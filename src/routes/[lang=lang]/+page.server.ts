import type { PageServerLoad } from './$types';
import { catalog } from '$lib/content/catalog.server';
import { localizedPublicCatalog, sortedOutputs, sortedProjects, sortedTimeline } from '$lib/content/public';
import type { Locale } from '$lib/site';

export const load: PageServerLoad = ({ params }) => {
  const lang = params.lang as Locale;
  const publicCatalog = localizedPublicCatalog(catalog, lang);
  return {
    lang,
    person: publicCatalog.person,
    now: sortedTimeline(publicCatalog.timeline.filter((event) => event.period.end === 'present')).slice(0, 3),
    projects: sortedProjects(publicCatalog.projects.filter((project) => project.featuredRank !== undefined)).slice(
      0,
      3
    ),
    outputs: sortedOutputs(publicCatalog.outputs).slice(0, 4),
    allProjects: publicCatalog.projects
  };
};
