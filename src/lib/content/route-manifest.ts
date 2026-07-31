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
  return routes;
}
