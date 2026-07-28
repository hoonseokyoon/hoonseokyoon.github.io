import { z } from 'zod';
import { personId, siteOrigin, supportedLocales } from '$lib/site';

const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const partialDatePattern = /^\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/;

function isRealPartialDate(value: string) {
  if (!partialDatePattern.test(value)) return false;
  const [yearText, monthText, dayText] = value.split('-');
  if (!dayText) return true;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export const IdSchema = z.string().regex(idPattern, 'Expected a lower-case kebab-case ID');
export const LocaleSchema = z.enum(supportedLocales);
export const PartialDateSchema = z
  .string()
  .regex(partialDatePattern, 'Expected YYYY, YYYY-MM, or YYYY-MM-DD')
  .refine(isRealPartialDate, 'Expected a real calendar date');
export const EditorialStatusSchema = z.enum(['draft', 'published']);

const HttpsUrlSchema = z.url().refine((url) => url.startsWith('https://'), 'Expected an HTTPS URL');

export const PeriodSchema = z.object({
  start: PartialDateSchema,
  end: z.union([PartialDateSchema, z.literal('present')]).optional()
});

export const EvidenceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('user-confirmed'),
    checkedAt: PartialDateSchema
  }),
  z.object({
    kind: z.enum(['public-profile', 'repository', 'canonical-output']),
    url: HttpsUrlSchema,
    checkedAt: PartialDateSchema
  })
]);

const LocaleTextSchema = z.object({
  ko: z.string().min(1).optional(),
  en: z.string().min(1).optional()
});

export const KnowledgeLinkSchema = z.object({
  kind: z.enum(['article', 'project', 'category']),
  relation: z.enum(['background', 'applied', 'produced', 'documents']),
  reciprocal: z.literal(true).optional(),
  urls: z
    .object({
      ko: HttpsUrlSchema.optional(),
      en: HttpsUrlSchema.optional()
    })
    .refine((urls) => Boolean(urls.ko || urls.en), 'Expected at least one Tokamak URL'),
  label: LocaleTextSchema.optional()
});

const PersonContentSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  imageAlt: z.string().min(1).optional()
});

const TimelineContentSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1).optional(),
  organization: z.string().min(1).optional(),
  location: z.string().min(1).optional()
});

const ProjectContentSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  contributions: z.array(z.string().min(1)).default([]),
  outcomes: z.array(z.string().min(1)).default([])
});

const OutputContentSchema = z.object({
  title: z.string().min(1),
  contribution: z.string().min(1),
  summary: z.string().min(1).optional(),
  venue: z.string().min(1).optional()
});

function localizedContent<T extends z.ZodType>(contentSchema: T) {
  return z.object({
    ko: contentSchema.optional(),
    en: contentSchema.optional()
  });
}

const commonRecordShape = {
  editorialStatus: EditorialStatusSchema,
  sourceLocale: LocaleSchema,
  evidence: z.array(EvidenceSchema).default([])
};

export const PersonSchema = z
  .object({
    id: z.literal('hoonseok-yoon'),
    canonicalUrl: z.literal(`${siteOrigin}/`),
    ...commonRecordShape,
    content: localizedContent(PersonContentSchema),
    image: z.string().startsWith('/').optional(),
    sameAs: z.array(HttpsUrlSchema).default([]),
    contacts: z
      .array(
        z.object({
          kind: z.enum(['email', 'website']),
          url: z.string().refine((url) => url.startsWith('mailto:') || url.startsWith('https://'))
        })
      )
      .default([])
  })
  .superRefine((person, context) => {
    if (!person.content[person.sourceLocale]) {
      context.addIssue({ code: 'custom', path: ['content', person.sourceLocale], message: 'Missing source locale' });
    }
    if (person.editorialStatus === 'published' && (!person.content.ko || !person.content.en)) {
      context.addIssue({ code: 'custom', path: ['content'], message: 'Published Person requires KO and EN' });
    }
  });

export const TimelineEventSchema = z
  .object({
    id: IdSchema,
    kind: z.enum([
      'education',
      'employment',
      'appointment',
      'research',
      'project',
      'publication',
      'presentation',
      'award',
      'release',
      'milestone',
      'other'
    ]),
    ...commonRecordShape,
    period: PeriodSchema,
    content: localizedContent(TimelineContentSchema),
    organizationUrl: HttpsUrlSchema.optional(),
    projectIds: z.array(IdSchema).default([]),
    outputIds: z.array(IdSchema).default([]),
    knowledgeLinks: z.array(KnowledgeLinkSchema).default([])
  })
  .superRefine((event, context) => {
    if (!event.content[event.sourceLocale]) {
      context.addIssue({ code: 'custom', path: ['content', event.sourceLocale], message: 'Missing source locale' });
    }
  });

export const ProjectSchema = z
  .object({
    id: IdSchema,
    ...commonRecordShape,
    lifecycle: z.enum(['planned', 'active', 'paused', 'completed', 'archived']),
    period: PeriodSchema,
    featuredRank: z.number().int().positive().optional(),
    content: localizedContent(ProjectContentSchema),
    links: z
      .array(
        z.object({
          kind: z.enum(['website', 'repository', 'demo', 'documentation']),
          url: HttpsUrlSchema
        })
      )
      .default([]),
    knowledgeLinks: z.array(KnowledgeLinkSchema).default([])
  })
  .superRefine((project, context) => {
    if (!project.content[project.sourceLocale]) {
      context.addIssue({ code: 'custom', path: ['content', project.sourceLocale], message: 'Missing source locale' });
    }
    if (project.editorialStatus === 'published' && (!project.content.ko || !project.content.en)) {
      context.addIssue({ code: 'custom', path: ['content'], message: 'Published Project requires KO and EN' });
    }
  });

export const OutputSchema = z
  .object({
    id: IdSchema,
    kind: z.enum(['paper', 'software', 'release', 'presentation', 'poster', 'dataset', 'article', 'award', 'other']),
    ...commonRecordShape,
    date: PartialDateSchema,
    content: localizedContent(OutputContentSchema),
    projectIds: z.array(IdSchema).default([]),
    contributors: z
      .array(
        z.object({
          person: z.literal('self').optional(),
          name: z.string().min(1).optional(),
          role: z.string().min(1),
          url: HttpsUrlSchema.optional()
        })
      )
      .default([]),
    links: z
      .array(
        z.object({
          kind: z.enum(['doi', 'repository', 'demo', 'slides', 'pdf', 'video', 'website']),
          url: HttpsUrlSchema,
          primary: z.boolean().default(false)
        })
      )
      .default([]),
    knowledgeLinks: z.array(KnowledgeLinkSchema).default([])
  })
  .superRefine((output, context) => {
    if (!output.content[output.sourceLocale]) {
      context.addIssue({ code: 'custom', path: ['content', output.sourceLocale], message: 'Missing source locale' });
    }
  });

export const sharedPersonStructuredDataId = personId;
