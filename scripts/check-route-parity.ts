import { existsSync, readFileSync } from 'node:fs';
import { loadCatalogFromDisk } from '../src/lib/content/catalog.node';
import { canonicalRoutes, legacyRedirects } from '../src/lib/content/route-manifest';
import { siteOrigin } from '../src/lib/site';
import {
  assertSameSet,
  discoverHtmlRoutes,
  loadRoutePolicy,
  readPathFixture,
  redirectIsActive,
  requireBuild,
  routeArtifactPath,
  setDifference,
  type RedirectPolicy
} from './route-contract';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertRedirectDocument(policy: RedirectPolicy): void {
  const file = routeArtifactPath(policy.path);
  const html = readFileSync(file, 'utf8');
  const expectedLang = policy.generator === 'root' ? 'ko' : 'en';
  if (!new RegExp(`<html\\b[^>]*\\blang=["']${expectedLang}["']`, 'i').test(html)) {
    throw new Error(`${policy.path} redirect document must declare html lang=${expectedLang}`);
  }
  if (!/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex[^"']*["']/i.test(html)) {
    throw new Error(`${policy.path} redirect document must be noindex`);
  }
  if (
    !new RegExp(
      `<meta\\b[^>]*\\bhttp-equiv=["']refresh["'][^>]*\\bcontent=["']0;url=${escapeRegex(policy.target)}["']`,
      'i'
    ).test(html)
  ) {
    throw new Error(`${policy.path} redirect document has no exact meta refresh to ${policy.target}`);
  }
  const canonical = `${siteOrigin}${policy.target}`;
  if (
    !new RegExp(`<link\\b[^>]*\\brel=["']canonical["'][^>]*\\bhref=["']${escapeRegex(canonical)}["']`, 'i').test(html)
  ) {
    throw new Error(`${policy.path} redirect document has no exact canonical URL ${canonical}`);
  }
  if (!new RegExp(`<a\\b[^>]*\\bhref=["']${escapeRegex(policy.target)}["']`, 'i').test(html)) {
    throw new Error(`${policy.path} redirect document has no visible fallback link to ${policy.target}`);
  }
}

requireBuild();
const policy = loadRoutePolicy();
const catalog = loadCatalogFromDisk();
const snapshotPaths = readPathFixture(policy.sources.sitemap.file);
const extraPaths = readPathFixture(policy.sources.extras.file);

if (snapshotPaths.length !== policy.sources.sitemap.count) {
  throw new Error(
    `Legacy sitemap fixture count changed: expected ${policy.sources.sitemap.count}, got ${snapshotPaths.length}`
  );
}
if (extraPaths.length !== policy.sources.extras.count) {
  throw new Error(
    `Legacy extra fixture count changed: expected ${policy.sources.extras.count}, got ${extraPaths.length}`
  );
}
const overlap = snapshotPaths.filter((path) => extraPaths.includes(path));
if (overlap.length > 0) throw new Error(`Legacy sitemap and extra fixtures overlap: ${overlap.join(', ')}`);

const policyPaths = [...policy.redirects.map((entry) => entry.path), ...policy.regenerated, ...policy.removed];
assertSameSet(policyPaths, [...snapshotPaths, ...extraPaths], 'Legacy path policy coverage');

const activeRedirects = policy.redirects.filter((entry) => redirectIsActive(entry, catalog));
const activeCompatibility = activeRedirects.filter((entry) => entry.generator === 'compatibility');
const contentDrivenCompatibility = activeCompatibility.filter(
  (entry) => entry.activation !== 'tokamak-calculus-deployed'
);
const manifestRedirects = legacyRedirects(catalog).map((entry) => ({
  path: `/${entry.path}/`,
  target: entry.target
}));
assertSameSet(
  manifestRedirects.map((entry) => `${entry.path}\u0000${entry.target}`),
  contentDrivenCompatibility.map((entry) => `${entry.path}\u0000${entry.target}`),
  'Content-driven compatibility redirect manifest'
);

for (const redirect of policy.redirects) {
  const active = redirectIsActive(redirect, catalog);
  const artifact = routeArtifactPath(redirect.path);
  if (active && !existsSync(artifact))
    throw new Error(`Active redirect is missing its build artifact: ${redirect.path}`);
  if (!active && existsSync(artifact))
    throw new Error(`Inactive redirect unexpectedly exists in build: ${redirect.path}`);
  if (active) assertRedirectDocument(redirect);
}

for (const route of policy.regenerated) {
  if (!existsSync(routeArtifactPath(route))) throw new Error(`Regenerated route is missing from build: ${route}`);
}
for (const route of policy.removed) {
  if (existsSync(routeArtifactPath(route))) throw new Error(`Removed legacy route still exists in build: ${route}`);
}

const expectedHtmlRoutes = [
  ...[...canonicalRoutes(catalog)].filter((route) => route.endsWith('/') || route.endsWith('.html')),
  ...activeRedirects.map((entry) => entry.path)
];
assertSameSet(discoverHtmlRoutes(), expectedHtmlRoutes, 'Generated HTML route set');

const activeLocalTargets = activeRedirects
  .map((entry) => entry.target.split('#', 1)[0])
  .filter((target) => !target.startsWith('/tokamak/'));
const missingLocalTargets = activeLocalTargets.filter((target) => !existsSync(routeArtifactPath(target)));
if (missingLocalTargets.length > 0) {
  throw new Error(`Redirect target artifacts are missing: ${[...new Set(missingLocalTargets)].sort().join(', ')}`);
}

const calculus = policy.redirects.find((entry) => entry.activation === 'tokamak-calculus-deployed');
if (!calculus || calculus.enabled !== true) {
  throw new Error('Calculus redirect must be explicitly enabled after the recorded Tokamak live verification');
}

const uncoveredBuildLegacyRoutes = setDifference(
  discoverHtmlRoutes().filter((route) => snapshotPaths.includes(route) || extraPaths.includes(route)),
  [...activeRedirects.map((entry) => entry.path), ...policy.regenerated]
);
if (uncoveredBuildLegacyRoutes.length > 0) {
  throw new Error(`Legacy paths escaped their approved disposition: ${uncoveredBuildLegacyRoutes.join(', ')}`);
}

console.log(
  `Route parity passed: ${snapshotPaths.length} sitemap paths + ${extraPaths.length} extra paths; ${activeRedirects.length} active redirects; calculus redirect enabled`
);
