import { parse } from 'yaml';
import { OutputSchema, PersonSchema, ProjectSchema, TimelineEventSchema } from './schema';
import type { ContentCatalog, Output, Person, Project, TimelineEvent } from './types';

function parseWithSchema<T>(
  raw: string,
  source: string,
  schema: { safeParse: (value: unknown) => { success: boolean; data?: T; error?: { issues: unknown[] } } }
): T {
  const result = schema.safeParse(parse(raw));
  if (!result.success) {
    throw new Error(`Invalid content in ${source}:\n${JSON.stringify(result.error?.issues, null, 2)}`);
  }
  return result.data as T;
}

export function parsePerson(raw: string, source = 'person.yml'): Person {
  return parseWithSchema(raw, source, PersonSchema);
}

export function parseTimelineEvent(raw: string, source: string): TimelineEvent {
  return parseWithSchema(raw, source, TimelineEventSchema);
}

export function parseProject(raw: string, source: string): Project {
  return parseWithSchema(raw, source, ProjectSchema);
}

export function parseOutput(raw: string, source: string): Output {
  return parseWithSchema(raw, source, OutputSchema);
}

function parseCollection<T extends { id: string }>(
  entries: Array<[string, string]>,
  parser: (raw: string, source: string) => T
) {
  return entries.map(([source, raw]) => {
    const record = parser(raw, source);
    const filename = source
      .split('/')
      .at(-1)
      ?.replace(/\.yml$/, '');
    if (filename !== record.id) {
      throw new Error(`Content ID ${record.id} does not match filename ${source}`);
    }
    return record;
  });
}

export function parseCatalog(
  personRaw: string,
  timelineEntries: Array<[string, string]>,
  projectEntries: Array<[string, string]>,
  outputEntries: Array<[string, string]>
): ContentCatalog {
  return {
    person: parsePerson(personRaw),
    timeline: parseCollection(timelineEntries, parseTimelineEvent),
    projects: parseCollection(projectEntries, parseProject),
    outputs: parseCollection(outputEntries, parseOutput)
  };
}
