import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { catalog } from '$lib/content/catalog.server';
import { projectOutputs, projectTimeline, publishedCatalog } from '$lib/content/public';
import type { Locale } from '$lib/site';

export const entries: EntryGenerator = () =>
  catalog.projects
    .filter((project) => project.editorialStatus === 'published')
    .flatMap((project) => [
      { lang: 'ko', id: project.id },
      { lang: 'en', id: project.id }
    ]);

export const load: PageServerLoad = ({ params }) => {
  const publicCatalog = publishedCatalog(catalog);
  const project = publicCatalog.projects.find((candidate) => candidate.id === params.id);
  if (!project) error(404, 'Project not found');

  return {
    lang: params.lang as Locale,
    project,
    timeline: projectTimeline(publicCatalog, project.id),
    outputs: projectOutputs(publicCatalog, project.id)
  };
};
