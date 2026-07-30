import type { PageServerLoad } from './$types';
import { catalog } from '$lib/content/catalog.server';
import type { PublicKnowledgeLink } from '$lib/content/public';
import { localizedPublicCatalog, sortedOutputs, sortedProjects, sortedTimeline } from '$lib/content/public';
import type { Locale } from '$lib/site';

/** The kinds that make up the backbone of an academic or engineering CV. */
const experienceKinds = new Set(['education', 'employment', 'appointment', 'research']);

export const load: PageServerLoad = ({ params }) => {
  const lang = params.lang as Locale;
  const publicCatalog = localizedPublicCatalog(catalog, lang);

  const now = sortedTimeline(publicCatalog.timeline.filter((event) => event.period.end === 'present')).slice(0, 4);
  const ongoing = new Set(now.map((event) => event.id));
  const past = publicCatalog.timeline.filter((event) => !ongoing.has(event.id));
  // Prefer the CV backbone, but never leave the section silently empty when the
  // recorded history is of another kind.
  const backbone = past.filter((event) => experienceKinds.has(event.kind));
  const experience = sortedTimeline(backbone.length ? backbone : past).slice(0, 5);

  const featured = publicCatalog.projects.filter((project) => project.featuredRank !== undefined);
  const projects = sortedProjects(featured.length ? featured : publicCatalog.projects).slice(0, 4);

  const knowledgeLinks: PublicKnowledgeLink[] = [];
  const seen = new Set<string>();
  for (const record of [...publicCatalog.projects, ...publicCatalog.outputs, ...publicCatalog.timeline]) {
    for (const link of record.knowledgeLinks) {
      if (seen.has(link.href)) continue;
      seen.add(link.href);
      knowledgeLinks.push(link);
    }
  }

  return {
    lang,
    person: publicCatalog.person,
    now,
    experience,
    projects,
    outputs: sortedOutputs(publicCatalog.outputs).slice(0, 4),
    allProjects: publicCatalog.projects,
    knowledgeLinks
  };
};
