import type { z } from 'zod';
import type { KnowledgeLinkSchema, OutputSchema, PersonSchema, ProjectSchema, TimelineEventSchema } from './schema';

export type Person = z.infer<typeof PersonSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Output = z.infer<typeof OutputSchema>;
export type KnowledgeLink = z.infer<typeof KnowledgeLinkSchema>;

export interface ContentCatalog {
  person: Person;
  timeline: TimelineEvent[];
  projects: Project[];
  outputs: Output[];
}
