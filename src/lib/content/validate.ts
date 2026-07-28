import { siteOrigin } from '$lib/site';
import type { ContentCatalog, KnowledgeLink, Output, Project } from './types';

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface ValidationOptions {
  requireReleaseContent?: boolean;
}

function add(issues: ValidationIssue[], code: string, path: string, message: string) {
  issues.push({ code, path, message });
}

function duplicateValues(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicate = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate];
}

function partialDateBounds(value: string) {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = monthText ? Number(monthText) : undefined;
  const day = dayText ? Number(dayText) : undefined;
  const minimum = Date.UTC(year, (month ?? 1) - 1, day ?? 1);
  const maximum = day ? minimum : month ? Date.UTC(year, month, 0) : Date.UTC(year, 11, 31);
  return { minimum, maximum };
}

function validatePeriod(issues: ValidationIssue[], path: string, start: string, end?: string) {
  if (!end || end === 'present') return;
  const startBounds = partialDateBounds(start);
  const endBounds = partialDateBounds(end);
  if (endBounds.maximum < startBounds.minimum) {
    add(issues, 'period-order', path, `End ${end} is before start ${start}`);
  }
}

function validateReferences(
  issues: ValidationIssue[],
  path: string,
  values: readonly string[],
  available: ReadonlySet<string>,
  kind: string
) {
  for (const duplicate of duplicateValues(values)) {
    add(issues, 'duplicate-reference', path, `Duplicate ${kind} reference: ${duplicate}`);
  }
  for (const value of values) {
    if (!available.has(value)) add(issues, 'unknown-reference', path, `Unknown ${kind}: ${value}`);
  }
}

function validateKnowledgeLink(issues: ValidationIssue[], path: string, link: KnowledgeLink) {
  const patterns: Record<KnowledgeLink['kind'], RegExp> = {
    article: /^\/tokamak\/(ko|en)\/blog\/[^/]+\/$/,
    project: /^\/tokamak\/(ko|en)\/projects\/[^/]+\/$/,
    category: /^\/tokamak\/(ko|en)\/categories\/[^/]+\/$/
  };

  for (const locale of ['ko', 'en'] as const) {
    const raw = link.urls[locale];
    if (!raw) continue;
    const url = new URL(raw);
    if (url.origin !== siteOrigin || !patterns[link.kind].test(url.pathname)) {
      add(issues, 'invalid-knowledge-url', `${path}.urls.${locale}`, `Unexpected ${link.kind} URL: ${raw}`);
    }
    if (!url.pathname.startsWith(`/tokamak/${locale}/`)) {
      add(issues, 'knowledge-locale', `${path}.urls.${locale}`, `URL does not use ${locale} locale`);
    }
  }

  if (link.urls.ko && link.urls.en) {
    const koSuffix = new URL(link.urls.ko).pathname.replace('/tokamak/ko/', '');
    const enSuffix = new URL(link.urls.en).pathname.replace('/tokamak/en/', '');
    if (koSuffix !== enSuffix) {
      add(issues, 'knowledge-pair', path, 'KO and EN knowledge URLs must have matching suffixes');
    }
  }
}

function validateRecordLinks(
  issues: ValidationIssue[],
  path: string,
  ordinaryUrls: readonly string[],
  knowledgeLinks: readonly KnowledgeLink[]
) {
  const knowledgeUrls = knowledgeLinks.flatMap((link) => [link.urls.ko, link.urls.en]).filter(Boolean) as string[];
  const ordinarySet = new Set(ordinaryUrls);
  const duplicates = new Set(knowledgeUrls.filter((url) => ordinarySet.has(url)));
  for (const url of duplicates) {
    add(issues, 'duplicate-url-role', path, `URL appears in ordinary links and knowledgeLinks: ${url}`);
  }

  for (const url of duplicateValues(ordinaryUrls)) {
    add(issues, 'duplicate-link', path, `Duplicate ordinary link: ${url}`);
  }
  for (const url of duplicateValues(knowledgeUrls)) {
    add(issues, 'duplicate-knowledge-link', path, `Duplicate knowledge link: ${url}`);
  }
}

function validatePublishedEvidence(
  issues: ValidationIssue[],
  path: string,
  record: { editorialStatus: 'draft' | 'published'; evidence: unknown[] }
) {
  if (record.editorialStatus === 'published' && record.evidence.length === 0) {
    add(issues, 'missing-evidence', `${path}.evidence`, 'Published records require evidence');
  }
  if (
    record.editorialStatus === 'published' &&
    !record.evidence.some(
      (evidence) =>
        typeof evidence === 'object' && evidence !== null && 'kind' in evidence && evidence.kind === 'user-confirmed'
    )
  ) {
    add(
      issues,
      'missing-publication-approval',
      `${path}.evidence`,
      'Published records require dated user confirmation'
    );
  }
}

function validateProjectLifecycle(issues: ValidationIssue[], path: string, project: Project) {
  const end = project.period.end;
  if (project.lifecycle === 'active' && end && end !== 'present') {
    add(issues, 'active-project-end', `${path}.period.end`, 'Active projects cannot have a fixed end');
  }
  if ((project.lifecycle === 'completed' || project.lifecycle === 'archived') && (!end || end === 'present')) {
    add(issues, 'finished-project-end', `${path}.period.end`, 'Completed and archived projects require a fixed end');
  }
}

function validateOutput(issues: ValidationIssue[], path: string, output: Output) {
  for (const link of output.links) {
    if (link.kind === 'doi' && !/^https:\/\/doi\.org\/10\.\d{4,9}\/\S+$/i.test(link.url)) {
      add(issues, 'invalid-doi-url', `${path}.links`, `DOI must use the canonical https://doi.org/ form: ${link.url}`);
    }
  }
  if (output.editorialStatus !== 'published') return;
  if (output.links.filter((link) => link.primary).length !== 1) {
    add(issues, 'primary-output-link', `${path}.links`, 'Published Output requires exactly one primary link');
  }
  if (!output.contributors.some((contributor) => contributor.person === 'self')) {
    add(issues, 'self-contributor', `${path}.contributors`, 'Published Output must identify self');
  }
}

export function validateCatalog(catalog: ContentCatalog, options: ValidationOptions = {}) {
  const issues: ValidationIssue[] = [];
  const projectIds = new Set(catalog.projects.map((project) => project.id));
  const outputIds = new Set(catalog.outputs.map((output) => output.id));

  for (const duplicate of duplicateValues(catalog.person.sameAs)) {
    add(issues, 'duplicate-profile-link', 'person.sameAs', `Duplicate public profile link: ${duplicate}`);
  }

  for (const duplicate of duplicateValues(catalog.timeline.map((record) => record.id))) {
    add(issues, 'duplicate-id', 'timeline', `Duplicate TimelineEvent ID: ${duplicate}`);
  }
  for (const duplicate of duplicateValues(catalog.projects.map((record) => record.id))) {
    add(issues, 'duplicate-id', 'projects', `Duplicate Project ID: ${duplicate}`);
  }
  for (const duplicate of duplicateValues(catalog.outputs.map((record) => record.id))) {
    add(issues, 'duplicate-id', 'outputs', `Duplicate Output ID: ${duplicate}`);
  }

  validatePublishedEvidence(issues, 'person', catalog.person);

  catalog.timeline.forEach((event, index) => {
    const path = `timeline[${index}]`;
    validatePublishedEvidence(issues, path, event);
    validatePeriod(issues, `${path}.period`, event.period.start, event.period.end);
    validateReferences(issues, `${path}.projectIds`, event.projectIds, projectIds, 'Project');
    validateReferences(issues, `${path}.outputIds`, event.outputIds, outputIds, 'Output');
    event.knowledgeLinks.forEach((link, linkIndex) =>
      validateKnowledgeLink(issues, `${path}.knowledgeLinks[${linkIndex}]`, link)
    );
  });

  const featuredRanks = catalog.projects.flatMap((project) =>
    project.editorialStatus === 'published' && project.featuredRank ? [String(project.featuredRank)] : []
  );
  for (const duplicate of duplicateValues(featuredRanks)) {
    add(issues, 'duplicate-featured-rank', 'projects', `Duplicate featured rank: ${duplicate}`);
  }

  catalog.projects.forEach((project, index) => {
    const path = `projects[${index}]`;
    validatePublishedEvidence(issues, path, project);
    validatePeriod(issues, `${path}.period`, project.period.start, project.period.end);
    validateProjectLifecycle(issues, path, project);
    project.knowledgeLinks.forEach((link, linkIndex) =>
      validateKnowledgeLink(issues, `${path}.knowledgeLinks[${linkIndex}]`, link)
    );
    validateRecordLinks(
      issues,
      path,
      project.links.map((link) => link.url),
      project.knowledgeLinks
    );
  });

  catalog.outputs.forEach((output, index) => {
    const path = `outputs[${index}]`;
    validatePublishedEvidence(issues, path, output);
    validateOutput(issues, path, output);
    validateReferences(issues, `${path}.projectIds`, output.projectIds, projectIds, 'Project');
    output.knowledgeLinks.forEach((link, linkIndex) =>
      validateKnowledgeLink(issues, `${path}.knowledgeLinks[${linkIndex}]`, link)
    );
    validateRecordLinks(
      issues,
      path,
      output.links.map((link) => link.url),
      output.knowledgeLinks
    );
  });

  const doiUrls = catalog.outputs.flatMap((output) =>
    output.links.filter((link) => link.kind === 'doi').map((link) => link.url.toLowerCase())
  );
  for (const duplicate of duplicateValues(doiUrls)) {
    add(issues, 'duplicate-doi', 'outputs', `Duplicate DOI URL: ${duplicate}`);
  }

  if (options.requireReleaseContent) {
    const publishedTimeline = catalog.timeline.filter((event) => event.editorialStatus === 'published');
    const publishedProjects = catalog.projects.filter((project) => project.editorialStatus === 'published');
    const publishedOutputs = catalog.outputs.filter((output) => output.editorialStatus === 'published');
    if (catalog.person.editorialStatus !== 'published')
      add(issues, 'release-person', 'person', 'Release requires published Person');
    if (publishedTimeline.length === 0) add(issues, 'release-timeline', 'timeline', 'Release requires a TimelineEvent');
    if (publishedProjects.length === 0) add(issues, 'release-project', 'projects', 'Release requires a Project');
    if (publishedOutputs.length === 0) add(issues, 'release-output', 'outputs', 'Release requires an Output');
    if (catalog.person.sameAs.length + catalog.person.contacts.length === 0) {
      add(issues, 'release-profile-link', 'person', 'Release requires an approved profile or contact link');
    }
  }

  return issues;
}
