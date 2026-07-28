import type { PageServerLoad } from './$types';
import { catalog } from '$lib/content/catalog.server';
import { localizedPublicCatalog, sortedOutputs } from '$lib/content/public';
import type { Locale } from '$lib/site';

export const load: PageServerLoad = ({ params }) => {
  const lang = params.lang as Locale;
  const publicCatalog = localizedPublicCatalog(catalog, lang);
  return {
    lang,
    outputs: sortedOutputs(publicCatalog.outputs),
    projects: publicCatalog.projects
  };
};
