import type { PageServerLoad } from './$types';
import { catalog } from '$lib/content/catalog.server';
import { publishedCatalog, sortedOutputs, sortedProjects, sortedTimeline } from '$lib/content/public';
import type { Locale } from '$lib/site';

export const load: PageServerLoad = ({ params }) => {
  const publicCatalog = publishedCatalog(catalog);
  return {
    lang: params.lang as Locale,
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
