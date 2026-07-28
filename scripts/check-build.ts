import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadCatalogFromDisk } from '../src/lib/content/catalog.node';
import { canonicalRoutes } from '../src/lib/content/route-manifest';
import { siteOrigin, socialCardAlt, socialCardUrl } from '../src/lib/site';
import {
  assertSameSet,
  buildRoot,
  discoverHtmlRoutes,
  loadRoutePolicy,
  redirectIsActive,
  requireBuild,
  routeArtifactPath
} from './route-contract';

interface HtmlTag {
  name: string;
  attributes: Record<string, string>;
}

function walkFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

function inspectForTemplateLeakage(): void {
  const forbidden = [
    'Albert Einstein',
    'al-folio',
    'alshedivat',
    'example.test',
    'Fixture Person',
    'Preview fixture',
    'fixture-software',
    'example_pdf.pdf',
    '/assets/json/',
    'github.com/hoonseokyoon/tokamak'
  ];
  for (const file of walkFiles(buildRoot).filter((path) => /\.(?:css|html|js|json|txt|xml)$/.test(path))) {
    const source = readFileSync(file, 'utf8');
    for (const fragment of forbidden) {
      if (source.includes(fragment)) {
        throw new Error(`Build contains forbidden template or fixture text ${JSON.stringify(fragment)} in ${file}`);
      }
    }
  }
}

function tags(html: string, name: string): HtmlTag[] {
  const matches = [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))];
  return matches.map((match) => {
    const attributes: Record<string, string> = {};
    for (const attribute of match[1].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attributes[attribute[1].toLowerCase()] = attribute[2] ?? attribute[3] ?? '';
    }
    return { name, attributes };
  });
}

function jsonLdBlocks(html: string): Array<Record<string, unknown>> {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    if (!/\btype\s*=\s*["']application\/ld\+json["']/i.test(match[1])) return [];
    return [JSON.parse(match[2]) as Record<string, unknown>];
  });
}

function exactlyOne(values: string[], expected: string, context: string): void {
  if (values.length !== 1 || values[0] !== expected) {
    throw new Error(
      `${context}: expected exactly ${expected}, got ${values.length === 0 ? 'none' : values.join(', ')}`
    );
  }
}

function localizedPair(route: string): { ko: string; en: string } {
  if (route.startsWith('/ko/')) return { ko: route, en: route.replace('/ko/', '/en/') };
  if (route.startsWith('/en/')) return { ko: route.replace('/en/', '/ko/'), en: route };
  throw new Error(`Not a localized route: ${route}`);
}

function inspectLocalizedPage(route: string): void {
  const html = readFileSync(routeArtifactPath(route), 'utf8');
  const locale = route.startsWith('/ko/') ? 'ko' : 'en';
  const htmlLang = tags(html, 'html')
    .map((tag) => tag.attributes.lang)
    .filter(Boolean);
  exactlyOne(htmlLang, locale, `${route} html language`);

  const canonical = tags(html, 'link')
    .filter((tag) => tag.attributes.rel === 'canonical')
    .map((tag) => tag.attributes.href);
  exactlyOne(canonical, `${siteOrigin}${route}`, `${route} canonical`);

  const meta = tags(html, 'meta');
  exactlyOne(
    meta.filter((tag) => tag.attributes.property === 'og:image').map((tag) => tag.attributes.content),
    socialCardUrl,
    `${route} Open Graph image`
  );
  exactlyOne(
    meta.filter((tag) => tag.attributes.property === 'og:image:alt').map((tag) => tag.attributes.content),
    socialCardAlt,
    `${route} Open Graph image alt`
  );
  exactlyOne(
    meta.filter((tag) => tag.attributes.name === 'twitter:card').map((tag) => tag.attributes.content),
    'summary_large_image',
    `${route} Twitter card type`
  );
  exactlyOne(
    meta.filter((tag) => tag.attributes.name === 'twitter:image').map((tag) => tag.attributes.content),
    socialCardUrl,
    `${route} Twitter image`
  );

  const pair = localizedPair(route);
  const alternates = tags(html, 'link').filter((tag) => tag.attributes.rel === 'alternate');
  for (const [hreflang, target] of [
    ['ko', pair.ko],
    ['en', pair.en],
    ['x-default', pair.ko]
  ] as const) {
    exactlyOne(
      alternates.filter((tag) => tag.attributes.hreflang === hreflang).map((tag) => tag.attributes.href),
      `${siteOrigin}${target}`,
      `${route} ${hreflang} alternate`
    );
  }
}

function inspectSocialCard(): void {
  const path = join(buildRoot, 'social-card.png');
  if (!existsSync(path)) throw new Error('build/social-card.png is required');
  const source = readFileSync(path);
  const pngSignature = '89504e470d0a1a0a';
  if (source.subarray(0, 8).toString('hex') !== pngSignature) {
    throw new Error('build/social-card.png is not a PNG');
  }
  const width = source.readUInt32BE(16);
  const height = source.readUInt32BE(20);
  if (width !== 1731 || height !== 909) {
    throw new Error(`Unexpected social-card dimensions: ${width}x${height}`);
  }
}

function inspectRootIdentity(): void {
  for (const locale of ['ko', 'en'] as const) {
    const route = `/${locale}/`;
    const blocks = jsonLdBlocks(readFileSync(routeArtifactPath(route), 'utf8'));
    if (blocks.length !== 1) throw new Error(`${route} must contain exactly one JSON-LD block`);
    const graph = blocks[0]['@graph'];
    if (!Array.isArray(graph)) throw new Error(`${route} JSON-LD graph is missing`);

    const person = graph.find((node) => node && typeof node === 'object' && node['@type'] === 'Person');
    if (!person || person['@id'] !== `${siteOrigin}/#person` || person.name !== 'Hoonseok Yoon') {
      throw new Error(`${route} Person JSON-LD does not use the approved shared identity`);
    }
    if (JSON.stringify(person.sameAs) !== JSON.stringify(['https://github.com/hoonseokyoon'])) {
      throw new Error(`${route} Person JSON-LD contains an unapproved public profile`);
    }

    const website = graph.find((node) => node && typeof node === 'object' && node['@type'] === 'WebSite');
    const author = website?.author;
    if (
      !website ||
      website['@id'] !== `${siteOrigin}/#website` ||
      !author ||
      typeof author !== 'object' ||
      author['@id'] !== `${siteOrigin}/#person`
    ) {
      throw new Error(`${route} WebSite JSON-LD is not linked to the shared Person ID`);
    }
  }
}

function inspectProjectIdentity(): void {
  for (const locale of ['ko', 'en'] as const) {
    const route = `/${locale}/projects/tokamak/`;
    const blocks = jsonLdBlocks(readFileSync(routeArtifactPath(route), 'utf8'));
    if (blocks.length !== 1) throw new Error(`${route} must contain exactly one JSON-LD block`);
    const project = blocks[0];
    const member = project.member;
    if (
      project['@type'] !== 'Project' ||
      project['@id'] !== `${siteOrigin}/#project-tokamak` ||
      !member ||
      typeof member !== 'object' ||
      member['@id'] !== `${siteOrigin}/#person`
    ) {
      throw new Error(`${route} Project JSON-LD is not linked to the shared Person ID`);
    }
  }
}

function inspectSitemap(routes: string[]): void {
  const sitemap = readFileSync(routeArtifactPath('/sitemap.xml'), 'utf8');
  const blocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
  const actualUrls = blocks.flatMap((block) =>
    tags(block, 'loc').map(() => block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '')
  );
  const expectedUrls = routes.map((route) => `${siteOrigin}${route}`).sort();
  assertSameSet(actualUrls, expectedUrls, 'Sitemap canonical URLs');
  if (actualUrls.length !== new Set(actualUrls).size) throw new Error('Sitemap contains duplicate canonical URLs');

  for (const route of routes) {
    const canonical = `${siteOrigin}${route}`;
    const block = blocks.find((candidate) => candidate.includes(`<loc>${canonical}</loc>`));
    if (!block) throw new Error(`Sitemap block is missing for ${route}`);
    const pair = localizedPair(route);
    const alternates = tags(block, 'xhtml:link');
    for (const [hreflang, target] of [
      ['ko', pair.ko],
      ['en', pair.en],
      ['x-default', pair.ko]
    ] as const) {
      exactlyOne(
        alternates.filter((tag) => tag.attributes.hreflang === hreflang).map((tag) => tag.attributes.href),
        `${siteOrigin}${target}`,
        `sitemap ${route} ${hreflang} alternate`
      );
    }
  }
}

function inspectRobots(): void {
  const robots = readFileSync(routeArtifactPath('/robots.txt'), 'utf8');
  const sitemapLines = robots
    .split(/\r?\n/)
    .filter((line) => /^Sitemap:\s*/i.test(line))
    .map((line) => line.replace(/^Sitemap:\s*/i, ''));
  exactlyOne(
    sitemapLines.filter((line) => line === `${siteOrigin}/sitemap.xml`),
    `${siteOrigin}/sitemap.xml`,
    'robots root sitemap'
  );
  exactlyOne(
    sitemapLines.filter((line) => line === `${siteOrigin}/tokamak/sitemap.xml`),
    `${siteOrigin}/tokamak/sitemap.xml`,
    'robots Tokamak sitemap'
  );
  if (sitemapLines.length !== 2)
    throw new Error(`robots.txt contains unexpected sitemap directives: ${sitemapLines.join(', ')}`);
}

requireBuild();
const catalog = loadCatalogFromDisk();
const policy = loadRoutePolicy();
if (!existsSync(`${buildRoot}/.nojekyll`)) throw new Error('build/.nojekyll is required for GitHub Pages');

const canonical = [...canonicalRoutes(catalog)];
const localizedRoutes = canonical.filter((route) => /^\/(ko|en)\//.test(route)).sort();
for (const route of localizedRoutes) inspectLocalizedPage(route);

const activeRedirects = policy.redirects.filter((entry) => redirectIsActive(entry, catalog));
const expectedHtmlRoutes = [
  ...canonical.filter((route) => route.endsWith('/') || route.endsWith('.html')),
  ...activeRedirects.map((entry) => entry.path)
];
assertSameSet(discoverHtmlRoutes(), expectedHtmlRoutes, 'Build HTML routes');

const root = readFileSync(routeArtifactPath('/'), 'utf8');
if (!/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex[^"']*["']/i.test(root)) {
  throw new Error('Root locale redirect must be noindex');
}
const notFound = readFileSync(routeArtifactPath('/404.html'), 'utf8');
if (!/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex[^"']*["']/i.test(notFound)) {
  throw new Error('404.html must be noindex');
}

inspectSitemap(localizedRoutes);
inspectRobots();
inspectSocialCard();
inspectRootIdentity();
inspectProjectIdentity();
inspectForTemplateLeakage();

for (const redirect of activeRedirects) {
  const target = redirect.target.split('#', 1)[0];
  if (!target.startsWith('/tokamak/') && !existsSync(routeArtifactPath(target))) {
    throw new Error(`Active redirect target is not generated: ${redirect.path} -> ${redirect.target}`);
  }
  const fragment = redirect.target.includes('#') ? redirect.target.slice(redirect.target.indexOf('#') + 1) : '';
  if (fragment && !readFileSync(routeArtifactPath(target), 'utf8').includes(`id="${fragment}"`)) {
    throw new Error(`Active redirect target anchor is not generated: ${redirect.path} -> #${fragment}`);
  }
}

console.log(
  `Build integrity passed: ${localizedRoutes.length} canonical localized pages, ${activeRedirects.length} redirects, exact sitemap and robots contracts`
);
