import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import type { ContentCatalog } from '../src/lib/content/types';

export const buildRoot = resolve('build');
export const policyPath = resolve('tests/fixtures/legacy-route-policy.yml');

export type RedirectActivation =
  | 'always'
  | 'published-timeline'
  | 'published-paper'
  | 'published-software'
  | 'tokamak-calculus-deployed';

export interface RedirectPolicy {
  path: string;
  target: string;
  activation: RedirectActivation;
  generator: 'root' | 'compatibility';
  enabled?: boolean;
}

export interface RoutePolicy {
  version: number;
  sources: {
    sitemap: { file: string; count: number };
    extras: { file: string; count: number };
  };
  redirects: RedirectPolicy[];
  regenerated: string[];
  removed: string[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${context} must be a non-empty string`);
  return value;
}

function requiredInteger(value: unknown, context: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) throw new Error(`${context} must be a non-negative integer`);
  return Number(value);
}

export function assertRouteShape(route: string, context: string): void {
  if (!route.startsWith('/') || route.includes('..') || route.includes('\\') || /[?#]/.test(route)) {
    throw new Error(`${context} is not a safe absolute path: ${route}`);
  }
  const lastSegment = route.split('/').filter(Boolean).at(-1) ?? '';
  if (route !== '/' && !route.endsWith('/') && !lastSegment.includes('.')) {
    throw new Error(`${context} must have a trailing slash: ${route}`);
  }
}

function parseSource(value: unknown, context: string): { file: string; count: number } {
  if (!isObject(value)) throw new Error(`${context} must be a mapping`);
  return {
    file: requiredString(value.file, `${context}.file`),
    count: requiredInteger(value.count, `${context}.count`)
  };
}

const activations = new Set<RedirectActivation>([
  'always',
  'published-timeline',
  'published-paper',
  'published-software',
  'tokamak-calculus-deployed'
]);

function parseRedirects(value: unknown): RedirectPolicy[] {
  if (!isObject(value)) throw new Error('redirects must be a mapping keyed by legacy path');
  return Object.entries(value).map(([path, raw]) => {
    assertRouteShape(path, 'redirect path');
    if (!isObject(raw)) throw new Error(`redirects.${path} must be a mapping`);
    const target = requiredString(raw.target, `redirects.${path}.target`);
    if (!target.startsWith('/') || target.includes('..') || target.includes('\\')) {
      throw new Error(`redirects.${path}.target must be a safe same-origin absolute path`);
    }
    const activation = requiredString(raw.activation, `redirects.${path}.activation`) as RedirectActivation;
    if (!activations.has(activation)) throw new Error(`redirects.${path}.activation is unsupported: ${activation}`);
    const generator = requiredString(raw.generator, `redirects.${path}.generator`);
    if (generator !== 'root' && generator !== 'compatibility') {
      throw new Error(`redirects.${path}.generator must be root or compatibility`);
    }
    if (generator === 'root' && path !== '/') throw new Error(`Only / may use the root redirect generator: ${path}`);
    if (generator === 'compatibility' && path === '/') throw new Error('/ must use the root redirect generator');
    if (activation === 'tokamak-calculus-deployed') {
      if (typeof raw.enabled !== 'boolean')
        throw new Error(`redirects.${path}.enabled must explicitly record the external gate`);
    } else if (raw.enabled !== undefined) {
      throw new Error(`redirects.${path}.enabled is only valid for the external calculus gate`);
    }
    return {
      path,
      target,
      activation,
      generator,
      enabled: raw.enabled as boolean | undefined
    };
  });
}

function parseRouteList(value: unknown, context: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${context} must be a list`);
  return value.map((entry, index) => {
    const route = requiredString(entry, `${context}[${index}]`);
    assertRouteShape(route, `${context}[${index}]`);
    return route;
  });
}

export function loadRoutePolicy(): RoutePolicy {
  const raw = parse(readFileSync(policyPath, 'utf8')) as unknown;
  if (!isObject(raw)) throw new Error('Legacy route policy must be a mapping');
  if (raw.version !== 1) throw new Error(`Unsupported legacy route policy version: ${String(raw.version)}`);
  if (!isObject(raw.sources)) throw new Error('sources must be a mapping');
  const policy: RoutePolicy = {
    version: 1,
    sources: {
      sitemap: parseSource(raw.sources.sitemap, 'sources.sitemap'),
      extras: parseSource(raw.sources.extras, 'sources.extras')
    },
    redirects: parseRedirects(raw.redirects),
    regenerated: parseRouteList(raw.regenerated, 'regenerated'),
    removed: parseRouteList(raw.removed, 'removed')
  };
  const all = [...policy.redirects.map((entry) => entry.path), ...policy.regenerated, ...policy.removed];
  const duplicates = [...new Set(all.filter((route, index) => all.indexOf(route) !== index))].sort();
  if (duplicates.length > 0) throw new Error(`Routes have multiple dispositions: ${duplicates.join(', ')}`);
  return policy;
}

export function readPathFixture(file: string): string[] {
  const absolute = resolve(file);
  const paths = readFileSync(absolute, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
  for (const [index, route] of paths.entries()) assertRouteShape(route, `${file}:${index + 1}`);
  const duplicates = [...new Set(paths.filter((route, index) => paths.indexOf(route) !== index))].sort();
  if (duplicates.length > 0) throw new Error(`${file} contains duplicate paths: ${duplicates.join(', ')}`);
  return paths;
}

export function redirectIsActive(policy: RedirectPolicy, catalog: ContentCatalog): boolean {
  switch (policy.activation) {
    case 'always':
      return true;
    case 'published-timeline':
      return catalog.timeline.some((record) => record.editorialStatus === 'published');
    case 'published-paper':
      return catalog.outputs.some((record) => record.editorialStatus === 'published' && record.kind === 'paper');
    case 'published-software':
      return catalog.outputs.some((record) => record.editorialStatus === 'published' && record.kind === 'software');
    case 'tokamak-calculus-deployed':
      return policy.enabled === true;
  }
}

export function routeArtifactPath(route: string): string {
  assertRouteShape(route, 'artifact route');
  if (route === '/') return join(buildRoot, 'index.html');
  const relativeRoute = route.slice(1);
  return route.endsWith('/') ? join(buildRoot, relativeRoute, 'index.html') : join(buildRoot, relativeRoute);
}

export function requireBuild(): void {
  if (!existsSync(buildRoot)) throw new Error('build/ does not exist; run npm run build before route checks');
}

function walkFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

export function discoverHtmlRoutes(): string[] {
  requireBuild();
  return walkFiles(buildRoot)
    .filter((file) => file.endsWith('.html'))
    .map((file) => {
      const output = relative(buildRoot, file).split(sep).join('/');
      if (output === 'index.html') return '/';
      if (output.endsWith('/index.html')) return `/${output.slice(0, -'index.html'.length)}`;
      return `/${output}`;
    })
    .sort();
}

export function setDifference(left: Iterable<string>, right: Iterable<string>): string[] {
  const rightSet = new Set(right);
  return [...new Set(left)].filter((entry) => !rightSet.has(entry)).sort();
}

export function assertSameSet(actual: Iterable<string>, expected: Iterable<string>, context: string): void {
  const missing = setDifference(expected, actual);
  const unexpected = setDifference(actual, expected);
  if (missing.length === 0 && unexpected.length === 0) return;
  const details = [
    missing.length > 0 ? `missing: ${missing.join(', ')}` : '',
    unexpected.length > 0 ? `unexpected: ${unexpected.join(', ')}` : ''
  ].filter(Boolean);
  throw new Error(`${context} mismatch (${details.join('; ')})`);
}
