import type { ContentCatalog } from './types';

export const coreLocalizedPaths = ['', 'timeline', 'projects', 'outputs'] as const;

export function canonicalRoutes(catalog: ContentCatalog) {
  const routes = new Set<string>();
  for (const lang of ['ko', 'en'] as const) {
    for (const path of coreLocalizedPaths) routes.add(`/${lang}/${path ? `${path}/` : ''}`);
    for (const project of catalog.projects.filter((record) => record.editorialStatus === 'published')) {
      routes.add(`/${lang}/projects/${project.id}/`);
    }
  }
  routes.add('/404.html');
  routes.add('/robots.txt');
  routes.add('/sitemap.xml');
  return routes;
}

export interface LegacyRedirect {
  path: string;
  target: string;
}

export function legacyRedirects(catalog: ContentCatalog): LegacyRedirect[] {
  const publishedTimeline = catalog.timeline.filter((record) => record.editorialStatus === 'published');
  const publishedOutputs = catalog.outputs.filter((record) => record.editorialStatus === 'published');
  const redirects: LegacyRedirect[] = [
    { path: 'projects', target: '/en/projects/' },
    { path: 'blog', target: '/tokamak/en/' },
    { path: 'review', target: '/tokamak/en/categories/paper-review/' }
  ];

  if (publishedTimeline.length > 0) redirects.push({ path: 'cv', target: '/en/timeline/' });
  if (publishedOutputs.some((output) => output.kind === 'paper')) {
    redirects.push({ path: 'publications', target: '/en/outputs/#publications' });
  }
  if (publishedOutputs.some((output) => output.kind === 'software')) {
    redirects.push({ path: 'repositories', target: '/en/outputs/#software' });
  }

  return redirects;
}
