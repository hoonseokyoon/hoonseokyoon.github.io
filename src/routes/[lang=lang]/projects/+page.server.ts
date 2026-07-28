import type { PageServerLoad } from './$types';
import { catalog } from '$lib/content/catalog.server';
import { publishedCatalog, sortedProjects } from '$lib/content/public';
import type { Locale } from '$lib/site';

export const load: PageServerLoad = ({ params }) => {
  const publicCatalog = publishedCatalog(catalog);
  return {
    lang: params.lang as Locale,
    projects: sortedProjects(publicCatalog.projects),
    outputs: publicCatalog.outputs
  };
};
