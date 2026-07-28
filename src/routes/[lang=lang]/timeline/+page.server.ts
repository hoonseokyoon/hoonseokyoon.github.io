import type { PageServerLoad } from './$types';
import { catalog } from '$lib/content/catalog.server';
import { localizedPublicCatalog, sortedTimeline } from '$lib/content/public';
import type { Locale } from '$lib/site';

export const load: PageServerLoad = ({ params }) => {
  const lang = params.lang as Locale;
  const publicCatalog = localizedPublicCatalog(catalog, lang);
  return {
    lang,
    timeline: sortedTimeline(publicCatalog.timeline),
    projects: publicCatalog.projects,
    outputs: publicCatalog.outputs
  };
};
