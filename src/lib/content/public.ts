import type { Locale } from '$lib/site';
import type { ContentCatalog, Output, Person, Project, TimelineEvent } from './types';

export interface PublicCatalog {
  person: Person | null;
  timeline: TimelineEvent[];
  projects: Project[];
  outputs: Output[];
}

export function publishedCatalog(catalog: ContentCatalog): PublicCatalog {
  return {
    person: catalog.person.editorialStatus === 'published' ? catalog.person : null,
    timeline: catalog.timeline.filter((event) => event.editorialStatus === 'published'),
    projects: catalog.projects.filter((project) => project.editorialStatus === 'published'),
    outputs: catalog.outputs.filter((output) => output.editorialStatus === 'published')
  };
}

export function localizedContent<T extends { sourceLocale: Locale; content: Partial<Record<Locale, unknown>> }>(
  record: T,
  requestedLocale: Locale
) {
  const locale = record.content[requestedLocale] ? requestedLocale : record.sourceLocale;
  return {
    locale,
    content: record.content[locale] as NonNullable<T['content'][Locale]>,
    isFallback: locale !== requestedLocale
  };
}

function dateSortValue(value: string | undefined) {
  if (value === 'present') return '9999-12-31';
  if (!value) return '0000-00-00';
  return value.padEnd(10, '-00');
}

export function sortedTimeline(events: readonly TimelineEvent[]) {
  return [...events].sort((left, right) => {
    const endOrder = dateSortValue(right.period.end).localeCompare(dateSortValue(left.period.end));
    if (endOrder !== 0) return endOrder;
    const startOrder = dateSortValue(right.period.start).localeCompare(dateSortValue(left.period.start));
    return startOrder !== 0 ? startOrder : left.id.localeCompare(right.id);
  });
}

const lifecycleOrder: Record<Project['lifecycle'], number> = {
  active: 0,
  paused: 1,
  planned: 2,
  completed: 3,
  archived: 4
};

export function sortedProjects(projects: readonly Project[]) {
  return [...projects].sort((left, right) => {
    const lifecycle = lifecycleOrder[left.lifecycle] - lifecycleOrder[right.lifecycle];
    if (lifecycle !== 0) return lifecycle;
    const rank = (left.featuredRank ?? Number.MAX_SAFE_INTEGER) - (right.featuredRank ?? Number.MAX_SAFE_INTEGER);
    if (rank !== 0) return rank;
    const start = dateSortValue(right.period.start).localeCompare(dateSortValue(left.period.start));
    return start !== 0 ? start : left.id.localeCompare(right.id);
  });
}

export function sortedOutputs(outputs: readonly Output[]) {
  return [...outputs].sort((left, right) => {
    const date = dateSortValue(right.date).localeCompare(dateSortValue(left.date));
    return date !== 0 ? date : left.id.localeCompare(right.id);
  });
}

export function projectTimeline(catalog: PublicCatalog, projectId: string) {
  return sortedTimeline(catalog.timeline.filter((event) => event.projectIds.includes(projectId)));
}

export function projectOutputs(catalog: PublicCatalog, projectId: string) {
  return sortedOutputs(catalog.outputs.filter((output) => output.projectIds.includes(projectId)));
}
