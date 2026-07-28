import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inflateSync } from 'node:zlib';
import { loadCatalogFromDisk } from '../src/lib/content/catalog.node';
import { localizedPublicCatalog, type PublicOutput } from '../src/lib/content/public';
import { canonicalRoutes } from '../src/lib/content/route-manifest';
import { siteOrigin, socialCardAlt, socialCardUrl } from '../src/lib/site';
import { outputStructuredDataId, outputStructuredDataType } from '../src/lib/structured-data';
import type { ContentCatalog } from '../src/lib/content/types';
import { artifactContainsSerializedProperty, internalCatalogFields } from './public-payload-contract';
import { parseReleaseMarker, releaseMarkerRoute } from './release-marker';
import { assertSameSet, loadRoutePolicy, redirectIsActive, type RoutePolicy } from './route-contract';

export const trustedLiveBase = 'https://hoonseokyoon.github.io/';
export { releaseMarkerRoute };

const tokamakBasePath = '/tokamak/';
const sharedPersonId = `${siteOrigin}/#person`;
const rootWebsiteId = `${siteOrigin}/#website`;
const tokamakWebsiteId = `${siteOrigin}/tokamak/#website`;
const missingRoutePrefix = '/__root-live-check-missing-';
const rootSvelteKitAssetMarker = '/_app/immutable/';
const defaultConcurrency = 8;
const defaultAttempts = 3;
const defaultRetryDelayMs = 750;
const defaultRequestTimeoutMs = 15_000;
const defaultPreflightAttempts = 120;
const defaultPreflightDelayMs = 5_000;
const rootForbiddenFragments = [
  'Albert Einstein',
  'al-folio',
  'alshedivat',
  'Fixture Person',
  'Preview fixture',
  'fixture-software',
  'example.test',
  'example_pdf.pdf',
  '/assets/json/',
  'github.com/hoonseokyoon/tokamak'
] as const;

type Locale = 'ko' | 'en';
type FetchImplementation = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface HtmlTag {
  raw: string;
  attributes: Record<string, string>;
}

interface IdentityNone {
  kind: 'none';
}

interface IdentityHome {
  kind: 'home';
}

interface IdentityProject {
  kind: 'project';
  projectId: string;
}

interface IdentityOutputs {
  kind: 'outputs';
  outputs: PublicOutput[];
}

export type LocalizedIdentity = IdentityNone | IdentityHome | IdentityProject | IdentityOutputs;

export interface LocalizedProbe {
  kind: 'localized';
  route: string;
  locale: Locale;
  alternateRoutes: Record<'ko' | 'en' | 'x-default', string>;
  expectedFragments: string[];
  unselectedContent: string[];
  identity: LocalizedIdentity;
}

export interface RootRedirectProbe {
  kind: 'root-redirect';
  route: '/';
  target: '/ko/';
}

export interface LocalizedDataProbe {
  kind: 'localized-data';
  route: string;
  pageRoute: string;
  locale: Locale;
  unselectedContent: string[];
}

export interface CompatibilityRedirectProbe {
  kind: 'compatibility-redirect';
  route: string;
  target: string;
}

export interface NotFoundProbe {
  kind: 'not-found';
  route: string;
  customDocument: boolean;
}

export interface SocialCardProbe {
  kind: 'social-card';
  route: '/social-card.png';
}

export interface RootSitemapProbe {
  kind: 'root-sitemap';
  route: '/sitemap.xml';
  localizedRoutes: string[];
}

export interface RobotsProbe {
  kind: 'robots';
  route: '/robots.txt';
}

export interface TokamakPageProbe {
  kind: 'tokamak-page';
  route: string;
  role: 'home' | 'calculus' | 'target';
  locale?: Locale;
}

export interface TokamakSitemapProbe {
  kind: 'tokamak-sitemap';
  route: '/tokamak/sitemap.xml';
  requiredRoutes: string[];
}

export type LiveProbe =
  | LocalizedProbe
  | LocalizedDataProbe
  | RootRedirectProbe
  | CompatibilityRedirectProbe
  | NotFoundProbe
  | SocialCardProbe
  | RootSitemapProbe
  | RobotsProbe
  | TokamakPageProbe
  | TokamakSitemapProbe;

export interface LivePlan {
  probes: LiveProbe[];
  localizedRoutes: string[];
  activeRedirects: Array<{ route: string; target: string }>;
  absentRoutes: string[];
  tokamakRoutes: string[];
  calculusRoutes: [string, string];
  missingRoute: string;
}

export interface LiveCheckOptions {
  base: string;
  expectedSha: string;
  concurrency?: number;
  attempts?: number;
  retryDelayMs?: number;
  requestTimeoutMs?: number;
  preflightAttempts?: number;
  preflightDelayMs?: number;
  fetchImpl?: FetchImplementation;
  sleep?: (milliseconds: number) => Promise<void>;
}

export interface LiveCheckSummary {
  base: string;
  expectedSha: string;
  probes: number;
  attempts: number;
  retriedProbes: number;
  concurrency: number;
  preflightRounds: number;
  preflightRequests: number;
  localizedRoutes: number;
  activeRedirects: number;
  absentRoutes: number;
  tokamakRoutes: number;
}

interface ProbeResult {
  route: string;
  url: string;
  attempts: number;
  status?: number;
  error?: string;
}

interface RequestContext {
  base: string;
  expectedSha: string;
  fetchImpl: FetchImplementation;
  requestTimeoutMs: number;
  nextRequestToken: () => string;
}

function usage(): string {
  return 'Usage: npm run check:live -- --base https://hoonseokyoon.github.io/ --expected-sha <40-character-lower-case-git-sha>';
}

function isSafeRequestRoute(route: string): boolean {
  return (
    route.startsWith('/') &&
    !route.startsWith('//') &&
    !route.includes('\\') &&
    !/%(?:2e|2f|5c)/i.test(route) &&
    !route.split('/').includes('..') &&
    !/[?#]/.test(route)
  );
}

export function normalizeTrustedBase(value: string): string {
  let base: URL;
  try {
    base = new URL(value);
  } catch {
    throw new Error(`Invalid live base URL: ${value}`);
  }

  const authority = value.match(/^https:\/\/([^/?#]*)(?:[/?#]|$)/)?.[1] ?? '';
  if (base.protocol !== 'https:') throw new Error('Live base must use HTTPS');
  if (base.username || base.password) throw new Error('Live base must not contain credentials');
  if (/:[0-9]+$/.test(authority) || base.port) throw new Error('Live base must not contain a port');
  if (base.hostname !== 'hoonseokyoon.github.io') {
    throw new Error(`Live base must use the trusted host hoonseokyoon.github.io; received ${base.hostname}`);
  }
  if (base.search || base.hash) throw new Error('Live base must not contain a query or fragment');
  if (base.pathname !== '/' && base.pathname !== '') throw new Error('Live base must use the origin root path');
  if (value !== trustedLiveBase && value !== trustedLiveBase.slice(0, -1)) {
    throw new Error('Live base must use the exact normalized GitHub Pages URL');
  }
  return trustedLiveBase;
}

export function assertExpectedSha(value: string): string {
  if (!/^[0-9a-f]{40}$/.test(value)) {
    throw new Error(`Expected SHA must be exactly 40 lower-case hexadecimal characters; received ${value}`);
  }
  return value;
}

export function parseLiveArguments(args: string[]): { base: string; expectedSha: string } | null {
  let base = trustedLiveBase;
  let expectedSha: string | undefined;
  let sawBase = false;
  let sawExpectedSha = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') {
      process.stdout.write(`${usage()}\n`);
      return null;
    }

    const [name, inlineValue] = argument.includes('=')
      ? [argument.slice(0, argument.indexOf('=')), argument.slice(argument.indexOf('=') + 1)]
      : [argument, undefined];
    if (name !== '--base' && name !== '--expected-sha') {
      throw new Error(`Unknown argument: ${argument}. ${usage()}`);
    }
    const value = inlineValue ?? args[index + 1];
    if (!value || (!inlineValue && value.startsWith('--'))) {
      throw new Error(`${name} requires a value. ${usage()}`);
    }
    if (inlineValue === undefined) index += 1;

    if (name === '--base') {
      if (sawBase) throw new Error(`--base may be provided only once. ${usage()}`);
      sawBase = true;
      base = value;
    } else {
      if (sawExpectedSha) throw new Error(`--expected-sha may be provided only once. ${usage()}`);
      sawExpectedSha = true;
      expectedSha = value;
    }
  }

  if (!expectedSha) throw new Error(`--expected-sha is required. ${usage()}`);
  return { base: normalizeTrustedBase(base), expectedSha: assertExpectedSha(expectedSha) };
}

export function resolveTrustedRoute(base: string, route: string): string {
  const normalizedBase = normalizeTrustedBase(base);
  if (!isSafeRequestRoute(route)) throw new Error(`Unsafe live-check route: ${route}`);
  const resolved = new URL(route.slice(1), normalizedBase);
  if (resolved.origin !== new URL(trustedLiveBase).origin) {
    throw new Error(`Live-check route escaped the trusted origin: ${route}`);
  }
  return resolved.href;
}

export function buildCacheBustedUrl(base: string, route: string, token: string): string {
  const url = new URL(resolveTrustedRoute(base, route));
  url.searchParams.set('__root_live_check', token);
  return url.href;
}

function localizedPair(route: string): Record<'ko' | 'en' | 'x-default', string> {
  if (route.startsWith('/ko/')) {
    return { ko: route, en: route.replace('/ko/', '/en/'), 'x-default': route };
  }
  if (route.startsWith('/en/')) {
    const ko = route.replace('/en/', '/ko/');
    return { ko, en: route, 'x-default': ko };
  }
  throw new Error(`Not a localized route: ${route}`);
}

function localizedDataRoute(pageRoute: string): string {
  if (!pageRoute.endsWith('/')) throw new Error(`Localized page route must end with /: ${pageRoute}`);
  return `${pageRoute}__data.json`;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

function collectJsonKeysAndStrings(value: unknown): { keys: string[]; strings: string[] } {
  if (typeof value === 'string') return { keys: [], strings: [value] };
  if (Array.isArray(value)) {
    return value.reduce(
      (collected, entry) => {
        const nested = collectJsonKeysAndStrings(entry);
        collected.keys.push(...nested.keys);
        collected.strings.push(...nested.strings);
        return collected;
      },
      { keys: [] as string[], strings: [] as string[] }
    );
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce(
      (collected, [key, entry]) => {
        const nested = collectJsonKeysAndStrings(entry);
        collected.keys.push(key, ...nested.keys);
        collected.strings.push(...nested.strings);
        return collected;
      },
      { keys: [] as string[], strings: [] as string[] }
    );
  }
  return { keys: [], strings: [] };
}

function identityForRoute(route: string, locale: Locale, catalog: ContentCatalog): LocalizedIdentity {
  if (route === `/${locale}/`) return { kind: 'home' };
  if (route === `/${locale}/outputs/`) {
    return { kind: 'outputs', outputs: localizedPublicCatalog(catalog, locale).outputs };
  }
  const projectMatch = route.match(new RegExp(`^/${locale}/projects/([^/]+)/$`));
  if (projectMatch && catalog.projects.some((project) => project.id === projectMatch[1])) {
    return { kind: 'project', projectId: projectMatch[1] };
  }
  return { kind: 'none' };
}

function assertUniqueRoutes(routes: string[], context: string): void {
  const duplicates = [...new Set(routes.filter((route, index) => routes.indexOf(route) !== index))].sort();
  if (duplicates.length > 0) throw new Error(`${context} contains duplicate routes: ${duplicates.join(', ')}`);
  for (const route of routes) {
    if (!isSafeRequestRoute(route)) throw new Error(`${context} contains an unsafe route: ${route}`);
  }
}

function publishedKnowledgeRoutes(catalog: ContentCatalog): string[] {
  const records = [...catalog.timeline, ...catalog.projects, ...catalog.outputs].filter(
    (record) => record.editorialStatus === 'published'
  );
  const slug = '[a-z0-9]+(?:-[a-z0-9]+)*';
  const patterns = {
    article: new RegExp(`^/tokamak/(ko|en)/blog/${slug}/$`),
    project: new RegExp(`^/tokamak/(ko|en)/projects/${slug}/$`),
    category: new RegExp(`^/tokamak/(ko|en)/categories/${slug}/$`)
  } as const;
  const routes: string[] = [];

  for (const record of records) {
    for (const link of record.knowledgeLinks) {
      for (const raw of [link.urls.ko, link.urls.en]) {
        if (!raw) continue;
        let url: URL;
        try {
          url = new URL(raw);
        } catch {
          throw new Error(`Published knowledge link is not a URL: ${raw}`);
        }
        if (
          url.protocol !== 'https:' ||
          url.origin !== siteOrigin ||
          url.username ||
          url.password ||
          url.port ||
          url.search ||
          url.hash ||
          /[?#]/.test(raw) ||
          url.href !== raw ||
          /%(?:2e|2f|5c)/i.test(raw) ||
          !patterns[link.kind].test(url.pathname) ||
          !isSafeRequestRoute(url.pathname)
        ) {
          throw new Error(`Published knowledge link is not a canonical controlled Tokamak route: ${raw}`);
        }
        routes.push(url.pathname);
      }
    }
  }

  return [...new Set(routes)].sort();
}

export function createLivePlan(
  expectedSha: string,
  catalog: ContentCatalog = loadCatalogFromDisk(),
  policy: RoutePolicy = loadRoutePolicy()
): LivePlan {
  assertExpectedSha(expectedSha);
  const localizedRoutes = [...canonicalRoutes(catalog)].filter((route) => /^\/(?:ko|en)\//.test(route)).sort();
  assertUniqueRoutes(localizedRoutes, 'Localized route plan');

  const activePolicies = policy.redirects.filter((redirect) => redirectIsActive(redirect, catalog));
  const inactiveRoutes = policy.redirects
    .filter((redirect) => !redirectIsActive(redirect, catalog))
    .map((redirect) => redirect.path);
  const absentRoutes = [...new Set([...inactiveRoutes, ...policy.removed])].sort();
  assertUniqueRoutes(absentRoutes, 'Absent route plan');

  const localFragments = new Map<string, Set<string>>();
  const activeTokamakTargets: string[] = [];
  for (const redirect of activePolicies) {
    const [targetRoute, fragment = ''] = redirect.target.split('#', 2);
    if (!isSafeRequestRoute(targetRoute)) throw new Error(`Active redirect has an unsafe target: ${redirect.target}`);
    if (targetRoute.startsWith(tokamakBasePath)) {
      activeTokamakTargets.push(targetRoute);
      continue;
    }
    if (!localizedRoutes.includes(targetRoute)) {
      throw new Error(`Active local redirect target is not a canonical localized route: ${redirect.target}`);
    }
    if (fragment) {
      const fragments = localFragments.get(targetRoute) ?? new Set<string>();
      fragments.add(fragment);
      localFragments.set(targetRoute, fragments);
    }
  }

  const allContentStrings = [catalog.person, ...catalog.timeline, ...catalog.projects, ...catalog.outputs].flatMap(
    (record) => collectStrings(record.content)
  );
  const localizedProbes: LocalizedProbe[] = localizedRoutes.map((route) => {
    const locale = route.startsWith('/ko/') ? 'ko' : 'en';
    const selectedPayload = JSON.stringify(localizedPublicCatalog(catalog, locale));
    return {
      kind: 'localized',
      route,
      locale,
      alternateRoutes: localizedPair(route),
      expectedFragments: [...(localFragments.get(route) ?? [])].sort(),
      unselectedContent: [
        ...new Set(allContentStrings.filter((value) => value.length >= 8 && !selectedPayload.includes(value)))
      ].sort(),
      identity: identityForRoute(route, locale, catalog)
    };
  });

  const calculusPolicy = policy.redirects.find((redirect) => redirect.activation === 'tokamak-calculus-deployed');
  if (!calculusPolicy || !redirectIsActive(calculusPolicy, catalog)) {
    throw new Error('The Tokamak calculus redirect must be active before creating a live verification plan');
  }
  const calculusEn = calculusPolicy.target.split('#', 1)[0];
  if (!/^\/tokamak\/en\/blog\/[^/]+\/$/.test(calculusEn)) {
    throw new Error(`Unexpected Tokamak calculus target shape: ${calculusPolicy.target}`);
  }
  const calculusKo = calculusEn.replace('/tokamak/en/', '/tokamak/ko/');
  const calculusRoutes: [string, string] = [calculusKo, calculusEn];
  const knowledgeTargets = publishedKnowledgeRoutes(catalog);

  const tokamakRoles = new Map<string, { role: TokamakPageProbe['role']; locale?: Locale }>();
  for (const route of activeTokamakTargets) {
    const locale = route.match(/^\/tokamak\/(ko|en)\//)?.[1] as Locale | undefined;
    tokamakRoles.set(route, { role: 'target', locale });
  }
  for (const route of knowledgeTargets) {
    const locale = route.match(/^\/tokamak\/(ko|en)\//)?.[1] as Locale | undefined;
    tokamakRoles.set(route, { role: 'target', locale });
  }
  tokamakRoles.set('/tokamak/ko/', { role: 'home', locale: 'ko' });
  tokamakRoles.set('/tokamak/en/', { role: 'home', locale: 'en' });
  tokamakRoles.set(calculusKo, { role: 'calculus', locale: 'ko' });
  tokamakRoles.set(calculusEn, { role: 'calculus', locale: 'en' });
  const tokamakProbes: TokamakPageProbe[] = [...tokamakRoles.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([route, details]) => ({ kind: 'tokamak-page', route, ...details }));

  const missingRoute = `${missingRoutePrefix}${expectedSha}/`;
  const probes: LiveProbe[] = [
    ...localizedProbes,
    ...localizedProbes.map<LocalizedDataProbe>((probe) => ({
      kind: 'localized-data',
      route: localizedDataRoute(probe.route),
      pageRoute: probe.route,
      locale: probe.locale,
      unselectedContent: probe.unselectedContent
    })),
    { kind: 'root-redirect', route: '/', target: '/ko/' },
    { kind: 'not-found', route: '/404.html', customDocument: true },
    { kind: 'not-found', route: missingRoute, customDocument: false },
    { kind: 'social-card', route: '/social-card.png' },
    { kind: 'root-sitemap', route: '/sitemap.xml', localizedRoutes },
    { kind: 'robots', route: '/robots.txt' },
    ...activePolicies
      .filter((redirect) => redirect.path !== '/')
      .map<CompatibilityRedirectProbe>((redirect) => ({
        kind: 'compatibility-redirect',
        route: redirect.path,
        target: redirect.target
      })),
    ...absentRoutes.map<NotFoundProbe>((route) => ({ kind: 'not-found', route, customDocument: false })),
    ...tokamakProbes,
    {
      kind: 'tokamak-sitemap',
      route: '/tokamak/sitemap.xml',
      requiredRoutes: tokamakProbes.map((probe) => probe.route)
    }
  ];
  assertUniqueRoutes(
    probes.map((probe) => probe.route),
    'Live probe plan'
  );

  return {
    probes,
    localizedRoutes,
    activeRedirects: activePolicies.map((redirect) => ({ route: redirect.path, target: redirect.target })),
    absentRoutes,
    tokamakRoutes: tokamakProbes.map((probe) => probe.route),
    calculusRoutes,
    missingRoute
  };
}

function tags(html: string, name: string): HtmlTag[] {
  return [...html.matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'gi'))].map((match) => {
    const attributes: Record<string, string> = {};
    for (const attribute of match[1].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attributes[attribute[1].toLowerCase()] = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
    }
    return { raw: match[0], attributes };
  });
}

function exactlyOne(values: string[], expected: string, context: string): void {
  if (values.length !== 1 || values[0] !== expected) {
    throw new Error(
      `${context}: expected exactly ${expected}, got ${values.length === 0 ? 'none' : values.join(', ')}`
    );
  }
}

function hasNoindex(html: string): boolean {
  return tags(html, 'meta').some(
    (tag) =>
      tag.attributes.name?.toLowerCase() === 'robots' && /(?:^|,)\s*noindex\b/i.test(tag.attributes.content ?? '')
  );
}

function hasJekyllGenerator(html: string): boolean {
  return tags(html, 'meta').some(
    (tag) => tag.attributes.name?.toLowerCase() === 'generator' && /jekyll/i.test(tag.attributes.content ?? '')
  );
}

function hasExactAnchor(html: string, href: string): boolean {
  return tags(html, 'a').some((tag) => tag.attributes.href === href);
}

function hasFragment(html: string, fragment: string): boolean {
  return [...html.matchAll(/<[a-z][^>]*>/gi)].some((match) => {
    const parsed = tags(match[0], match[0].match(/^<([a-z]+)/i)?.[1] ?? 'invalid')[0];
    return parsed?.attributes.id === fragment;
  });
}

function jsonLdBlocks(html: string): Array<Record<string, unknown>> {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].flatMap((match) => {
    const type = match[1].match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if ((type?.[1] ?? type?.[2] ?? type?.[3]) !== 'application/ld+json') return [];
    const value = JSON.parse(match[2]) as unknown;
    return value && typeof value === 'object' && !Array.isArray(value) ? [value as Record<string, unknown>] : [];
  });
}

function graphNodes(blocks: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return blocks.flatMap((block) => {
    const graph = block['@graph'];
    if (Array.isArray(graph)) {
      return graph.filter(
        (node): node is Record<string, unknown> => Boolean(node) && typeof node === 'object' && !Array.isArray(node)
      );
    }
    return [block];
  });
}

function referencedId(value: unknown): unknown {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)['@id']
    : undefined;
}

function requireHtmlResponse(response: Response, html: string, expectedStatus: number, context: string): void {
  const failures: string[] = [];
  if (response.status !== expectedStatus) failures.push(`expected HTTP ${expectedStatus}; received ${response.status}`);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    failures.push(`expected HTML content-type; received ${contentType || 'missing content-type'}`);
  }
  if (!/^\s*<!doctype html>/i.test(html) || !/<html(?:\s|>)/i.test(html) || !/<\/html\s*>/i.test(html)) {
    failures.push('response is not a complete HTML document');
  }
  if (failures.length > 0) throw new Error(`${context}: ${failures.join('; ')}`);
}

function assertCanonical(html: string, expected: string, context: string): void {
  exactlyOne(
    tags(html, 'link')
      .filter((tag) => tag.attributes.rel === 'canonical')
      .map((tag) => tag.attributes.href),
    expected,
    `${context} canonical`
  );
}

function hasSvelteKitAsset(html: string, documentUrl: string): boolean {
  const document = new URL(documentUrl);
  return [...tags(html, 'link'), ...tags(html, 'script')].some((tag) => {
    const reference = tag.attributes.href ?? tag.attributes.src;
    if (!reference) return false;
    try {
      const asset = new URL(reference, document);
      return asset.origin === document.origin && asset.pathname.startsWith(rootSvelteKitAssetMarker);
    } catch {
      return false;
    }
  });
}

function validateHomeIdentity(blocks: Array<Record<string, unknown>>, route: string): void {
  if (blocks.length !== 1) throw new Error(`${route} must contain exactly one JSON-LD block`);
  const graph = blocks[0]['@graph'];
  if (!Array.isArray(graph)) throw new Error(`${route} JSON-LD graph is missing`);
  const person = graph.find((node) => node && typeof node === 'object' && node['@type'] === 'Person');
  if (
    !person ||
    person['@id'] !== sharedPersonId ||
    person.name !== 'Hoonseok Yoon' ||
    person.url !== `${siteOrigin}/`
  ) {
    throw new Error(`${route} Person JSON-LD does not use the shared identity`);
  }
  if (JSON.stringify(person.sameAs) !== JSON.stringify(['https://github.com/hoonseokyoon'])) {
    throw new Error(`${route} Person JSON-LD contains an unapproved public profile`);
  }
  const website = graph.find((node) => node && typeof node === 'object' && node['@type'] === 'WebSite');
  const author = website && typeof website === 'object' ? website.author : undefined;
  if (
    !website ||
    website['@id'] !== rootWebsiteId ||
    website.url !== `${siteOrigin}/` ||
    !author ||
    typeof author !== 'object' ||
    author['@id'] !== sharedPersonId
  ) {
    throw new Error(`${route} WebSite JSON-LD is not linked to the shared Person ID`);
  }
}

function validateProjectIdentity(blocks: Array<Record<string, unknown>>, route: string, projectId: string): void {
  if (blocks.length !== 1) throw new Error(`${route} must contain exactly one JSON-LD block`);
  const project = blocks[0];
  const member = project.member;
  if (
    project['@type'] !== 'Project' ||
    project['@id'] !== `${siteOrigin}/#project-${projectId}` ||
    referencedId(member) !== sharedPersonId
  ) {
    throw new Error(`${route} Project JSON-LD is not linked to the shared Person ID`);
  }
}

function validateOutputIdentity(blocks: Array<Record<string, unknown>>, route: string, outputs: PublicOutput[]): void {
  if (blocks.length !== 1 || blocks[0]['@context'] !== 'https://schema.org') {
    throw new Error(`${route} Output JSON-LD envelope is invalid`);
  }
  const graph = blocks[0]['@graph'];
  if (!Array.isArray(graph)) throw new Error(`${route} Output JSON-LD graph is missing`);
  assertSameSet(
    graph.flatMap((node) => (node && typeof node === 'object' && typeof node['@id'] === 'string' ? [node['@id']] : [])),
    outputs.map((output) => outputStructuredDataId(output.id)),
    `${route} Output JSON-LD IDs`
  );
  for (const output of outputs) {
    const node = graph.find(
      (candidate) =>
        candidate && typeof candidate === 'object' && candidate['@id'] === outputStructuredDataId(output.id)
    );
    const primary = output.links.find((link) => link.primary);
    const author = node && typeof node === 'object' ? node.author : undefined;
    if (
      !node ||
      typeof node !== 'object' ||
      node['@type'] !== outputStructuredDataType(output.kind) ||
      node.url !== primary?.url ||
      node.name !== output.content.title ||
      node.description !== output.content.summary ||
      node.creditText !== output.content.contribution ||
      node.datePublished !== output.date ||
      node.inLanguage !== output.locale ||
      !author ||
      typeof author !== 'object' ||
      author['@id'] !== sharedPersonId
    ) {
      throw new Error(`${route} Output JSON-LD is invalid for ${output.id}`);
    }
  }
}

function validateLocalizedProbe(probe: LocalizedProbe, response: Response, html: string, documentUrl: string): void {
  const failures: string[] = [];
  try {
    requireHtmlResponse(response, html, 200, probe.route);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  try {
    exactlyOne(
      tags(html, 'html')
        .map((tag) => tag.attributes.lang)
        .filter(Boolean),
      probe.locale,
      `${probe.route} html language`
    );
    assertCanonical(html, `${siteOrigin}${probe.route}`, probe.route);
    const alternates = tags(html, 'link').filter((tag) => tag.attributes.rel === 'alternate');
    for (const hreflang of ['ko', 'en', 'x-default'] as const) {
      exactlyOne(
        alternates.filter((tag) => tag.attributes.hreflang === hreflang).map((tag) => tag.attributes.href),
        `${siteOrigin}${probe.alternateRoutes[hreflang]}`,
        `${probe.route} ${hreflang} alternate`
      );
    }
    const meta = tags(html, 'meta');
    exactlyOne(
      meta.filter((tag) => tag.attributes.property === 'og:image').map((tag) => tag.attributes.content),
      socialCardUrl,
      `${probe.route} Open Graph image`
    );
    exactlyOne(
      meta.filter((tag) => tag.attributes.property === 'og:image:alt').map((tag) => tag.attributes.content),
      socialCardAlt,
      `${probe.route} Open Graph image alt`
    );
    exactlyOne(
      meta.filter((tag) => tag.attributes.name === 'twitter:card').map((tag) => tag.attributes.content),
      'summary_large_image',
      `${probe.route} Twitter card type`
    );
    exactlyOne(
      meta.filter((tag) => tag.attributes.name === 'twitter:image').map((tag) => tag.attributes.content),
      socialCardUrl,
      `${probe.route} Twitter image`
    );
    if (hasNoindex(html)) throw new Error(`${probe.route} canonical page must not be noindex`);
    if (!hasSvelteKitAsset(html, documentUrl)) {
      throw new Error(`${probe.route} is missing SvelteKit asset marker ${rootSvelteKitAssetMarker}`);
    }
    if (!hasExactAnchor(html, `${siteOrigin}/tokamak/${probe.locale}/`)) {
      throw new Error(`${probe.route} is missing its locale-matching Tokamak home link`);
    }
    for (const fragment of probe.expectedFragments) {
      if (!hasFragment(html, fragment)) throw new Error(`${probe.route} is missing required fragment #${fragment}`);
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  if (hasJekyllGenerator(html)) failures.push(`${probe.route} still exposes Jekyll generator metadata`);
  for (const forbidden of rootForbiddenFragments) {
    if (html.includes(forbidden)) failures.push(`${probe.route} exposes forbidden template/private text ${forbidden}`);
  }
  for (const key of internalCatalogFields) {
    if (artifactContainsSerializedProperty(html, key, '.html')) {
      failures.push(`${probe.route} exposes internal catalog field ${key}`);
    }
  }
  for (const value of probe.unselectedContent) {
    if (html.includes(value))
      failures.push(`${probe.route} exposes unselected locale content ${JSON.stringify(value)}`);
  }

  try {
    const blocks = jsonLdBlocks(html);
    switch (probe.identity.kind) {
      case 'home':
        validateHomeIdentity(blocks, probe.route);
        break;
      case 'project':
        validateProjectIdentity(blocks, probe.route, probe.identity.projectId);
        break;
      case 'outputs':
        validateOutputIdentity(blocks, probe.route, probe.identity.outputs);
        break;
      case 'none':
        break;
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }

  if (failures.length > 0) throw new Error(failures.join('; '));
}

function validateLocalizedDataProbe(probe: LocalizedDataProbe, response: Response, source: string): void {
  const failures: string[] = [];
  if (response.status !== 200) failures.push(`expected HTTP 200; received ${response.status}`);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) {
    failures.push(`expected application/json; received ${contentType || 'missing content-type'}`);
  }
  let decoded = { keys: [] as string[], strings: [] as string[] };
  try {
    decoded = collectJsonKeysAndStrings(JSON.parse(source) as unknown);
  } catch {
    failures.push('response is not valid JSON');
  }
  const decodedText = [...decoded.keys, ...decoded.strings];
  for (const forbidden of rootForbiddenFragments) {
    if (source.includes(forbidden) || decodedText.some((value) => value.includes(forbidden))) {
      failures.push(`exposes forbidden template/private text ${forbidden}`);
    }
  }
  for (const key of internalCatalogFields) {
    if (artifactContainsSerializedProperty(source, key, '.json') || decoded.keys.includes(key)) {
      failures.push(`exposes internal catalog field ${key}`);
    }
  }
  for (const value of probe.unselectedContent) {
    if (source.includes(value) || decodedText.some((decodedValue) => decodedValue.includes(value))) {
      failures.push(`exposes unselected locale content ${JSON.stringify(value)}`);
    }
  }
  if (failures.length > 0) throw new Error(`${probe.pageRoute} data payload: ${failures.join('; ')}`);
}

function validateRedirectHtml(
  route: string,
  target: string,
  expectedLang: Locale,
  response: Response,
  html: string
): void {
  requireHtmlResponse(response, html, 200, route);
  exactlyOne(
    tags(html, 'html')
      .map((tag) => tag.attributes.lang)
      .filter(Boolean),
    expectedLang,
    `${route} redirect language`
  );
  if (!hasNoindex(html)) throw new Error(`${route} redirect must be noindex`);
  exactlyOne(
    tags(html, 'meta')
      .filter((tag) => tag.attributes['http-equiv']?.toLowerCase() === 'refresh')
      .map((tag) => tag.attributes.content),
    `0;url=${target}`,
    `${route} meta refresh`
  );
  assertCanonical(html, `${siteOrigin}${target}`, `${route} redirect`);
  if (!hasExactAnchor(html, target)) throw new Error(`${route} redirect is missing its exact visible fallback link`);
}

function validateNotFound(probe: NotFoundProbe, response: Response, html: string): void {
  requireHtmlResponse(response, html, probe.customDocument ? 200 : 404, probe.route);
  if (!hasNoindex(html)) throw new Error(`${probe.route} not-found response must be noindex`);
  if (!/\b404\b/.test(html)) throw new Error(`${probe.route} does not contain the custom 404 marker`);
  if (!hasExactAnchor(html, '/ko/') || !hasExactAnchor(html, '/en/')) {
    throw new Error(`${probe.route} does not expose both custom 404 home links`);
  }
}

function pngCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function validateSocialCard(response: Response, body: Uint8Array): void {
  if (response.status !== 200) throw new Error(`social card expected HTTP 200; received ${response.status}`);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('image/png')) {
    throw new Error(`social card expected image/png; received ${contentType || 'missing content-type'}`);
  }
  if (body.length < 24 || Buffer.from(body.subarray(0, 8)).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('social card is not a valid PNG');
  }
  const view = new DataView(body.buffer, body.byteOffset, body.byteLength);
  let offset = 8;
  let firstChunk = true;
  let sawImageData = false;
  let sawEnd = false;
  const imageDataChunks: Buffer[] = [];
  while (offset < body.length) {
    if (offset + 12 > body.length) throw new Error('social card PNG contains a truncated chunk');
    const length = view.getUint32(offset);
    const type = Buffer.from(body.subarray(offset + 4, offset + 8)).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const nextOffset = dataEnd + 4;
    if (!/^[A-Za-z]{4}$/.test(type) || nextOffset > body.length) {
      throw new Error('social card PNG contains an invalid chunk');
    }
    const expectedCrc = view.getUint32(dataEnd);
    const actualCrc = pngCrc32(body.subarray(offset + 4, dataEnd));
    if (actualCrc !== expectedCrc) throw new Error(`social card PNG ${type} chunk has an invalid CRC`);
    if (firstChunk && (type !== 'IHDR' || length !== 13)) {
      throw new Error('social card PNG must start with a 13-byte IHDR chunk');
    }
    if (!firstChunk && type === 'IHDR') throw new Error('social card PNG contains more than one IHDR chunk');
    if (type === 'IDAT') {
      sawImageData = true;
      imageDataChunks.push(Buffer.from(body.subarray(dataStart, dataEnd)));
    }
    if (type === 'IEND') {
      if (length !== 0 || nextOffset !== body.length) {
        throw new Error('social card PNG has an invalid IEND chunk');
      }
      sawEnd = true;
    }
    firstChunk = false;
    offset = nextOffset;
  }
  if (!sawImageData || !sawEnd) throw new Error('social card PNG is missing IDAT or IEND');
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  if (width !== 1731 || height !== 909) {
    throw new Error(`unexpected social-card dimensions: ${width}x${height}`);
  }
  const bitDepth = body[24];
  const colorType = body[25];
  const compressionMethod = body[26];
  const filterMethod = body[27];
  const interlaceMethod = body[28];
  const channels = new Map([
    [0, 1],
    [2, 3],
    [3, 1],
    [4, 2],
    [6, 4]
  ]).get(colorType);
  const allowedBitDepths: Record<number, number[]> = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16]
  };
  if (
    !channels ||
    !allowedBitDepths[colorType]?.includes(bitDepth) ||
    compressionMethod !== 0 ||
    filterMethod !== 0 ||
    interlaceMethod !== 0
  ) {
    throw new Error('social card PNG uses an unsupported image encoding');
  }
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8);
  const expectedInflatedLength = height * (rowBytes + 1);
  let inflated: Buffer;
  try {
    inflated = inflateSync(Buffer.concat(imageDataChunks), { maxOutputLength: expectedInflatedLength + 1 });
  } catch {
    throw new Error('social card PNG contains invalid compressed image data');
  }
  if (inflated.length !== expectedInflatedLength) {
    throw new Error('social card PNG decompressed image length is invalid');
  }
  for (let row = 0; row < height; row += 1) {
    if (inflated[row * (rowBytes + 1)] > 4) throw new Error('social card PNG contains an invalid row filter');
  }
}

function validateRootSitemap(probe: RootSitemapProbe, response: Response, xml: string): void {
  if (response.status !== 200) throw new Error(`root sitemap expected HTTP 200; received ${response.status}`);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('xml'))
    throw new Error(`root sitemap has unexpected content-type ${contentType || 'missing'}`);
  const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
  const actualUrls = blocks.map((block) => block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? '');
  const expectedUrls = probe.localizedRoutes.map((route) => `${siteOrigin}${route}`).sort();
  assertSameSet(actualUrls, expectedUrls, 'Live root sitemap canonical URLs');
  if (actualUrls.length !== new Set(actualUrls).size) throw new Error('Live root sitemap contains duplicate URLs');
  for (const route of probe.localizedRoutes) {
    const canonical = `${siteOrigin}${route}`;
    const block = blocks.find((candidate) => candidate.includes(`<loc>${canonical}</loc>`));
    if (!block) throw new Error(`Live root sitemap is missing ${canonical}`);
    const alternates = tags(block, 'xhtml:link');
    const pair = localizedPair(route);
    for (const hreflang of ['ko', 'en', 'x-default'] as const) {
      exactlyOne(
        alternates.filter((tag) => tag.attributes.hreflang === hreflang).map((tag) => tag.attributes.href),
        `${siteOrigin}${pair[hreflang]}`,
        `sitemap ${route} ${hreflang} alternate`
      );
    }
  }
}

function validateRobots(response: Response, text: string): void {
  if (response.status !== 200) throw new Error(`robots.txt expected HTTP 200; received ${response.status}`);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('text/plain'))
    throw new Error(`robots.txt has unexpected content-type ${contentType || 'missing'}`);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const expected = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${siteOrigin}/sitemap.xml`,
    `Sitemap: ${siteOrigin}/tokamak/sitemap.xml`
  ];
  if (JSON.stringify(lines) !== JSON.stringify(expected)) {
    throw new Error(`robots.txt lines differ from the approved contract: ${lines.join(' | ')}`);
  }
}

function validateTokamakIdentity(html: string, route: string): void {
  const nodes = graphNodes(jsonLdBlocks(html));
  const person = nodes.find((node) => node['@type'] === 'Person');
  const website = nodes.find((node) => node['@type'] === 'WebSite');
  const posting = nodes.find((node) => node['@type'] === 'BlogPosting');
  const websiteAuthor = website?.author;
  const postingAuthor = posting?.author;
  if (!person || person['@id'] !== sharedPersonId || person.url !== `${siteOrigin}/`) {
    throw new Error(`${route} Tokamak Person JSON-LD does not use the shared root identity`);
  }
  if (!website || website['@id'] !== tokamakWebsiteId || referencedId(websiteAuthor) !== sharedPersonId) {
    throw new Error(`${route} Tokamak WebSite JSON-LD is not authored by the shared Person`);
  }
  if (!posting || posting.url !== `${siteOrigin}${route}` || referencedId(postingAuthor) !== sharedPersonId) {
    throw new Error(`${route} Tokamak BlogPosting JSON-LD is not authored by the shared Person`);
  }
}

function validateTokamakPage(probe: TokamakPageProbe, response: Response, html: string): void {
  requireHtmlResponse(response, html, 200, probe.route);
  assertCanonical(html, `${siteOrigin}${probe.route}`, probe.route);
  if (probe.locale) {
    exactlyOne(
      tags(html, 'html')
        .map((tag) => tag.attributes.lang)
        .filter(Boolean),
      probe.locale,
      `${probe.route} html language`
    );
  }
  if ((probe.role === 'home' || probe.role === 'calculus') && !hasExactAnchor(html, `${siteOrigin}/`)) {
    throw new Error(`${probe.route} is missing the visible root author link`);
  }
  if (probe.role === 'calculus') validateTokamakIdentity(html, probe.route);
}

function validateTokamakSitemap(probe: TokamakSitemapProbe, response: Response, xml: string): void {
  if (response.status !== 200) throw new Error(`Tokamak sitemap expected HTTP 200; received ${response.status}`);
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('xml'))
    throw new Error(`Tokamak sitemap has unexpected content-type ${contentType || 'missing'}`);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const locElements = [...xml.matchAll(/<(?:[^<>\s/:]+:)?loc\b/giu)].length;
  if (locElements !== urls.length) {
    throw new Error('Tokamak sitemap contains an unsupported or malformed loc element');
  }
  if (urls.length !== new Set(urls).size) throw new Error('Tokamak sitemap contains duplicate URLs');
  for (const url of urls) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Tokamak sitemap contains an invalid URL: ${url}`);
    }
    if (
      parsed.origin !== siteOrigin ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.search ||
      parsed.hash ||
      parsed.href !== url ||
      !parsed.pathname.startsWith(tokamakBasePath) ||
      url.includes('&') ||
      /%(?:2e|2f|5c)/i.test(url)
    ) {
      throw new Error(`Tokamak sitemap escaped its controlled base: ${url}`);
    }
  }
  const required = probe.requiredRoutes.map((route) => `${siteOrigin}${route}`);
  const missing = required.filter((url) => !urls.includes(url));
  if (missing.length > 0) throw new Error(`Tokamak sitemap is missing controlled routes: ${missing.join(', ')}`);
}

export function validateLiveProbe(
  probe: LiveProbe,
  response: Response,
  body: Uint8Array,
  documentUrl = resolveTrustedRoute(trustedLiveBase, probe.route)
): void {
  const text = new TextDecoder().decode(body);
  switch (probe.kind) {
    case 'localized':
      validateLocalizedProbe(probe, response, text, documentUrl);
      return;
    case 'localized-data':
      validateLocalizedDataProbe(probe, response, text);
      return;
    case 'root-redirect':
      validateRedirectHtml(probe.route, probe.target, 'ko', response, text);
      return;
    case 'compatibility-redirect':
      validateRedirectHtml(probe.route, probe.target, 'en', response, text);
      return;
    case 'not-found':
      validateNotFound(probe, response, text);
      return;
    case 'social-card':
      validateSocialCard(response, body);
      return;
    case 'root-sitemap':
      validateRootSitemap(probe, response, text);
      return;
    case 'robots':
      validateRobots(response, text);
      return;
    case 'tokamak-page':
      validateTokamakPage(probe, response, text);
      return;
    case 'tokamak-sitemap':
      validateTokamakSitemap(probe, response, text);
      return;
  }
}

function acceptHeaderForProbe(probe: LiveProbe | 'marker'): string {
  if (probe === 'marker') return 'application/json';
  switch (probe.kind) {
    case 'localized-data':
      return 'application/json';
    case 'social-card':
      return 'image/png';
    case 'root-sitemap':
    case 'tokamak-sitemap':
      return 'application/xml,text/xml;q=0.9,text/plain;q=0.8';
    case 'robots':
      return 'text/plain';
    default:
      return 'text/html,application/xhtml+xml';
  }
}

function requestInit(accept: string, requestTimeoutMs: number): RequestInit {
  return {
    cache: 'no-store',
    headers: {
      accept,
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      'user-agent': 'root-live-verifier/1.0'
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(requestTimeoutMs)
  };
}

async function fetchProbe(context: RequestContext, probe: LiveProbe): Promise<ProbeResult> {
  const canonicalUrl = resolveTrustedRoute(context.base, probe.route);
  const url = buildCacheBustedUrl(context.base, probe.route, context.nextRequestToken());
  let status: number | undefined;
  try {
    const response = await context.fetchImpl(url, requestInit(acceptHeaderForProbe(probe), context.requestTimeoutMs));
    status = response.status;
    const body = new Uint8Array(await response.arrayBuffer());
    validateLiveProbe(probe, response, body, canonicalUrl);
    return { route: probe.route, url, attempts: 1, status: response.status };
  } catch (error) {
    return {
      route: probe.route,
      url,
      attempts: 1,
      status,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function fetchReleaseMarker(context: RequestContext): Promise<ProbeResult> {
  const url = buildCacheBustedUrl(context.base, releaseMarkerRoute, context.nextRequestToken());
  let status: number | undefined;
  try {
    const response = await context.fetchImpl(
      url,
      requestInit(acceptHeaderForProbe('marker'), context.requestTimeoutMs)
    );
    status = response.status;
    const body = await response.text();
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (response.status !== 200) throw new Error(`expected HTTP 200; received ${response.status}`);
    if (!contentType.includes('application/json')) {
      throw new Error(`expected application/json; received ${contentType || 'missing content-type'}`);
    }
    const marker = parseReleaseMarker(body);
    if (marker.commit !== context.expectedSha) {
      throw new Error(`release marker does not match expected SHA ${context.expectedSha}`);
    }
    return { route: releaseMarkerRoute, url, attempts: 1, status: response.status };
  } catch (error) {
    return {
      route: releaseMarkerRoute,
      url,
      attempts: 1,
      status,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function mapWithConcurrency<T, U>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<U>
): Promise<U[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`Concurrency must be a positive integer; received ${concurrency}`);
  }
  const results = new Array<U>(values.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(values[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function waitForReleaseMarker(options: {
  context: RequestContext;
  attempts: number;
  delayMs: number;
  sleep: (milliseconds: number) => Promise<void>;
}): Promise<{ rounds: number; requests: number }> {
  let lastResult: ProbeResult | undefined;
  for (let round = 1; round <= options.attempts; round += 1) {
    const startedAt = Date.now();
    lastResult = await fetchReleaseMarker(options.context);
    if (!lastResult.error) return { rounds: round, requests: round };
    if (round < options.attempts) {
      const elapsed = Date.now() - startedAt;
      await options.sleep(Math.max(0, options.delayMs - elapsed));
    }
  }
  throw new Error(
    `Release marker preflight did not observe ${options.context.expectedSha} after ${options.attempts} rounds:\n` +
      `- ${releaseMarkerRoute} (${lastResult?.url ?? resolveTrustedRoute(options.context.base, releaseMarkerRoute)}, ` +
      `status ${lastResult?.status ?? 'unavailable'}): ${lastResult?.error ?? 'unknown failure'}`
  );
}

function positiveInteger(value: number, context: string): number {
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`${context} must be a positive integer; received ${value}`);
  return value;
}

function nonNegativeNumber(value: number, context: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${context} must be non-negative; received ${value}`);
  return value;
}

export async function runLivePlan(options: LiveCheckOptions, plan: LivePlan): Promise<LiveCheckSummary> {
  const base = normalizeTrustedBase(options.base);
  const expectedSha = assertExpectedSha(options.expectedSha);
  const concurrency = positiveInteger(options.concurrency ?? defaultConcurrency, 'Concurrency');
  const attempts = positiveInteger(options.attempts ?? defaultAttempts, 'Attempts');
  const retryDelayMs = nonNegativeNumber(options.retryDelayMs ?? defaultRetryDelayMs, 'Retry delay');
  const requestTimeoutMs = nonNegativeNumber(options.requestTimeoutMs ?? defaultRequestTimeoutMs, 'Request timeout');
  if (requestTimeoutMs === 0) throw new Error('Request timeout must be positive');
  const preflightAttempts = positiveInteger(
    options.preflightAttempts ?? defaultPreflightAttempts,
    'Preflight attempts'
  );
  const preflightDelayMs = nonNegativeNumber(options.preflightDelayMs ?? defaultPreflightDelayMs, 'Preflight delay');
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? wait;
  assertUniqueRoutes(
    plan.probes.map((probe) => probe.route),
    'Provided live probe plan'
  );

  let requestNumber = 0;
  const context: RequestContext = {
    base,
    expectedSha,
    fetchImpl,
    requestTimeoutMs,
    nextRequestToken: () => `${expectedSha}-${++requestNumber}`
  };
  const preflight = await waitForReleaseMarker({
    context: {
      ...context,
      requestTimeoutMs:
        preflightDelayMs > 0 ? Math.min(requestTimeoutMs, Math.max(1, preflightDelayMs)) : requestTimeoutMs
    },
    attempts: preflightAttempts,
    delayMs: preflightDelayMs,
    sleep
  });

  const results = await mapWithConcurrency(plan.probes, concurrency, async (probe): Promise<ProbeResult> => {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const result = await fetchProbe(context, probe);
      if (!result.error || attempt === attempts) return { ...result, attempts: attempt };
      await sleep(retryDelayMs * 2 ** (attempt - 1));
    }
    throw new Error(`Unreachable retry state for ${probe.route}`);
  });

  const failures = results.filter((result) => result.error);
  if (failures.length > 0) {
    throw new Error(
      `Live verification failed for ${failures.length}/${results.length} probes:\n${failures
        .map(
          (result) =>
            `- ${result.route} (${result.url}, status ${result.status ?? 'unavailable'}, ${result.attempts} attempts): ${result.error}`
        )
        .join('\n')}`
    );
  }

  return {
    base,
    expectedSha,
    probes: results.length,
    attempts: results.reduce((total, result) => total + result.attempts, 0),
    retriedProbes: results.filter((result) => result.attempts > 1).length,
    concurrency,
    preflightRounds: preflight.rounds,
    preflightRequests: preflight.requests,
    localizedRoutes: plan.localizedRoutes.length,
    activeRedirects: plan.activeRedirects.length,
    absentRoutes: plan.absentRoutes.length,
    tokamakRoutes: plan.tokamakRoutes.length
  };
}

export async function checkLiveSite(options: LiveCheckOptions): Promise<LiveCheckSummary> {
  const expectedSha = assertExpectedSha(options.expectedSha);
  return runLivePlan(options, createLivePlan(expectedSha));
}

async function main(): Promise<void> {
  const parsed = parseLiveArguments(process.argv.slice(2));
  if (!parsed) return;
  const summary = await checkLiveSite(parsed);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

const entryPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (entryPath === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
