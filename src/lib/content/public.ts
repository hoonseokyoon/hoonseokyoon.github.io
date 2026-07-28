import type { Locale } from '$lib/site';
import type { ContentCatalog, KnowledgeLink, Output, Person, Project, TimelineEvent } from './types';

export interface PublishedCatalog {
  person: Person | null;
  timeline: TimelineEvent[];
  projects: Project[];
  outputs: Output[];
}

type PersonContent = NonNullable<Person['content'][Locale]>;
type TimelineContent = NonNullable<TimelineEvent['content'][Locale]>;
type ProjectContent = NonNullable<Project['content'][Locale]>;
type OutputContent = NonNullable<Output['content'][Locale]>;

interface LocalizedView<T> {
  locale: Locale;
  isFallback: boolean;
  content: T;
}

export interface PublicPerson extends LocalizedView<PersonContent> {
  canonicalUrl: Person['canonicalUrl'];
  sameAs: Person['sameAs'];
  contacts: Person['contacts'];
}

export interface PublicTimelineEvent extends LocalizedView<TimelineContent> {
  id: TimelineEvent['id'];
  kind: TimelineEvent['kind'];
  period: TimelineEvent['period'];
  projectIds: TimelineEvent['projectIds'];
  outputIds: TimelineEvent['outputIds'];
  knowledgeLinks: PublicKnowledgeLink[];
}

export interface PublicKnowledgeLink {
  relation: KnowledgeLink['relation'];
  href: string;
  locale: Locale;
  label?: string;
}

export interface PublicProject extends LocalizedView<ProjectContent> {
  id: Project['id'];
  lifecycle: Project['lifecycle'];
  period: Project['period'];
  featuredRank?: Project['featuredRank'];
  links: Project['links'];
  knowledgeLinks: PublicKnowledgeLink[];
}

export interface PublicOutput extends LocalizedView<OutputContent> {
  id: Output['id'];
  kind: Output['kind'];
  date: Output['date'];
  projectIds: Output['projectIds'];
  links: Output['links'];
  knowledgeLinks: PublicKnowledgeLink[];
}

export interface LocalizedPublicCatalog {
  person: PublicPerson | null;
  timeline: PublicTimelineEvent[];
  projects: PublicProject[];
  outputs: PublicOutput[];
}

export function publishedCatalog(catalog: ContentCatalog): PublishedCatalog {
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

function localizedKnowledgeLink(link: KnowledgeLink, requestedLocale: Locale): PublicKnowledgeLink {
  const locale = link.urls[requestedLocale] ? requestedLocale : link.urls.ko ? 'ko' : 'en';
  return {
    relation: link.relation,
    href: link.urls[locale] as string,
    locale,
    label: link.label?.[locale]
  };
}

function publicPerson(person: Person, requestedLocale: Locale): PublicPerson {
  return {
    ...localizedContent(person, requestedLocale),
    canonicalUrl: person.canonicalUrl,
    sameAs: person.sameAs,
    contacts: person.contacts
  };
}

function publicTimelineEvent(event: TimelineEvent, requestedLocale: Locale): PublicTimelineEvent {
  return {
    ...localizedContent(event, requestedLocale),
    id: event.id,
    kind: event.kind,
    period: event.period,
    projectIds: event.projectIds,
    outputIds: event.outputIds,
    knowledgeLinks: event.knowledgeLinks.map((link) => localizedKnowledgeLink(link, requestedLocale))
  };
}

function publicProject(project: Project, requestedLocale: Locale): PublicProject {
  return {
    ...localizedContent(project, requestedLocale),
    id: project.id,
    lifecycle: project.lifecycle,
    period: project.period,
    featuredRank: project.featuredRank,
    links: project.links,
    knowledgeLinks: project.knowledgeLinks.map((link) => localizedKnowledgeLink(link, requestedLocale))
  };
}

function publicOutput(output: Output, requestedLocale: Locale): PublicOutput {
  return {
    ...localizedContent(output, requestedLocale),
    id: output.id,
    kind: output.kind,
    date: output.date,
    projectIds: output.projectIds,
    links: output.links,
    knowledgeLinks: output.knowledgeLinks.map((link) => localizedKnowledgeLink(link, requestedLocale))
  };
}

export function localizedPublicCatalog(catalog: ContentCatalog, requestedLocale: Locale): LocalizedPublicCatalog {
  const published = publishedCatalog(catalog);
  return {
    person: published.person ? publicPerson(published.person, requestedLocale) : null,
    timeline: published.timeline.map((event) => publicTimelineEvent(event, requestedLocale)),
    projects: published.projects.map((project) => publicProject(project, requestedLocale)),
    outputs: published.outputs.map((output) => publicOutput(output, requestedLocale))
  };
}

function dateSortValue(value: string | undefined) {
  if (value === 'present') return '9999-12-31';
  if (!value) return '0000-00-00';
  return value.padEnd(10, '-00');
}

interface TimelineSortable {
  id: string;
  period: { start: string; end?: string };
}

export function sortedTimeline<T extends TimelineSortable>(events: readonly T[]) {
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

interface ProjectSortable {
  id: string;
  lifecycle: Project['lifecycle'];
  featuredRank?: number;
  period: { start: string };
}

export function sortedProjects<T extends ProjectSortable>(projects: readonly T[]) {
  return [...projects].sort((left, right) => {
    const lifecycle = lifecycleOrder[left.lifecycle] - lifecycleOrder[right.lifecycle];
    if (lifecycle !== 0) return lifecycle;
    const rank = (left.featuredRank ?? Number.MAX_SAFE_INTEGER) - (right.featuredRank ?? Number.MAX_SAFE_INTEGER);
    if (rank !== 0) return rank;
    const start = dateSortValue(right.period.start).localeCompare(dateSortValue(left.period.start));
    return start !== 0 ? start : left.id.localeCompare(right.id);
  });
}

interface OutputSortable {
  id: string;
  date: string;
}

export function sortedOutputs<T extends OutputSortable>(outputs: readonly T[]) {
  return [...outputs].sort((left, right) => {
    const date = dateSortValue(right.date).localeCompare(dateSortValue(left.date));
    return date !== 0 ? date : left.id.localeCompare(right.id);
  });
}

export function projectTimeline<T extends TimelineSortable & { projectIds: string[] }>(
  catalog: { timeline: readonly T[] },
  projectId: string
) {
  return sortedTimeline(catalog.timeline.filter((event) => event.projectIds.includes(projectId)));
}

export function projectOutputs<T extends OutputSortable & { projectIds: string[] }>(
  catalog: { outputs: readonly T[] },
  projectId: string
) {
  return sortedOutputs(catalog.outputs.filter((output) => output.projectIds.includes(projectId)));
}
