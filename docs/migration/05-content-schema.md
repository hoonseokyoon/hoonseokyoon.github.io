# Root personal-site content schema

Status: **approved at CP2 on 2026-07-28**

Decision date: **2026-07-28 (Asia/Seoul)**

## Design goals

The schema is a small, first-party model for accurate personal-history records.
It must:

- separate identity, chronology, projects, and outputs without duplicating facts;
- preserve partial dates and source-language text instead of inventing precision
  or translations;
- require an explicit editorial decision before anything is published;
- link to Tokamak through stable URLs without importing its learning DAG;
- produce a fully static site with no runtime content service.

The approved CP1 shape, `Person -> TimelineEvent -> Project -> Output`, describes
the reader's information flow. References form a graph; the records are not
physically nested inside one another.

## Approved file layout

```text
src/lib/content/
├── person.yml
├── timeline/
│   └── {event-id}.yml
├── projects/
│   └── {project-id}.yml
├── outputs/
│   └── {output-id}.yml
├── schema.ts
├── catalog.server.ts
├── public.ts
└── validate.ts
```

One YAML file owns one logical record and contains all available languages.
Project prose remains structured summary data in v1; localized MD/SVX bodies are
not introduced until real case studies prove that the structured fields are too
small.

Origin, supported locales, canonical entity IDs, and UI labels are typed
application constants rather than editable biography content. Person and record
data remain in the catalog above.

## Common primitives

```ts
type Locale = 'ko' | 'en';
type Id = string; // lower-case kebab-case
type PartialDate = 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD';

type Period = {
  start: PartialDate;
  end?: PartialDate | 'present';
};

type EditorialStatus = 'draft' | 'published';

type Localized<T> = {
  sourceLocale: Locale;
  content: Partial<Record<Locale, T>>;
};
```

`content[sourceLocale]` is always present. Each locale is a complete content
block, not a bag of per-field fallbacks. When the requested language is missing,
the renderer uses the complete source-language block and marks that subtree with
the correct HTML `lang` attribute.

Dates keep the precision supplied by evidence. `2024` must not become
`2024-01-01`; display and sorting code understands year, month, and day precision.
For period validation, a partial start uses the earliest possible instant and a
partial end uses the latest possible instant, so missing precision is not treated
as a fabricated exact date.

### Evidence

Every published record includes editorial provenance:

```yaml
evidence:
  - kind: user-confirmed
    checkedAt: 2026-07-28
  - kind: public-profile
    url: https://example.com/canonical-profile
    checkedAt: 2026-07-28
```

Permitted kinds are `user-confirmed`, `public-profile`, `repository`, and
`canonical-output`. All non-user evidence requires a canonical HTTPS URL.
Evidence is not rendered by default and may contain no private notes. A `draft`
flag suppresses generated pages; it does not make source data private in a public
Git repository.

## Entity schemas

The YAML fragments below define shape only. They are not proposed biographical
content and are not added to the production catalog at CP2.

### Person singleton

```yaml
id: hoonseok-yoon
canonicalUrl: https://hoonseokyoon.github.io/
editorialStatus: draft
sourceLocale: ko
content:
  ko:
    name: '<confirmed Korean display name>'
    headline: '<confirmed headline>'
    summary: '<confirmed short biography>'
    imageAlt: '<optional localized description>'
  en:
    name: Hoonseok Yoon
    headline: '<confirmed headline>'
    summary: '<confirmed short biography>'
    imageAlt: '<optional localized description>'
image: /assets/profile/hoonseok-yoon.webp
sameAs:
  - https://github.com/hoonseokyoon
contacts:
  - kind: email
    url: 'mailto:<confirmed-public-address>'
evidence: []
```

Required published Person fields are `id`, `canonicalUrl`, both locale blocks,
and evidence. Image, contacts, and identity profiles are optional and included
only after explicit review.

Affiliations and current roles do not live in Person. They are derived from
published, ongoing TimelineEvents so that a changed date or title has one owner.
`headline` is a short editorial introduction, not a second structured CV.

### TimelineEvent

```yaml
id: example-event
kind: education
editorialStatus: draft
period:
  start: 2026-03
  end: present
sourceLocale: ko
content:
  ko:
    title: '<event title>'
    role: '<optional role>'
    organization: '<optional organization>'
    location: '<optional public location>'
    summary: '<concise factual summary>'
  en:
    title: '<translated event title>'
    role: '<optional translated role>'
    organization: '<optional translated organization>'
    location: '<optional translated location>'
    summary: '<translated summary>'
organizationUrl: https://example.com/
projectIds: [example-project]
outputIds: [example-output]
knowledgeLinks: []
evidence: []
```

Event kinds are:

```text
education | employment | appointment | research | project | publication |
presentation | award | release | milestone | other
```

A TimelineEvent owns the chronological statement and references Projects or
Outputs that explain it. It does not own copies of their summaries. The event can
be source-language-only because it has no record detail route.

### Project

```yaml
id: example-project
editorialStatus: draft
lifecycle: active
period:
  start: 2026-01
  end: present
featuredRank: 10
sourceLocale: ko
content:
  ko:
    title: '<project title>'
    summary: '<reader-oriented project summary>'
    role: '<explicit personal role>'
    contributions: ['<optional confirmed contribution>']
    outcomes: ['<optional confirmed outcome>']
  en:
    title: '<translated project title>'
    summary: '<translated project summary>'
    role: '<translated personal role>'
    contributions: ['<optional translated contribution>']
    outcomes: ['<optional translated outcome>']
links:
  - kind: repository
    url: https://github.com/example/example
knowledgeLinks: []
evidence: []
```

Project lifecycle is `planned`, `active`, `paused`, `completed`, or `archived`.
Link kinds are `website`, `repository`, `demo`, and `documentation`.

`id` is the immutable route segment; there is no second mutable slug. Every
published Project requires KO and EN content so
`/ko/projects/{id}/` and `/en/projects/{id}/` always describe the same logical
entity. `featuredRank` is an optional positive integer; absent means the Project
does not appear in the home feature set.

Projects store neither `timelineEventIds` nor `outputIds`. Their pages derive
backlinks from the catalog, avoiding mirrored arrays that can drift.

### Output

```yaml
id: example-output
kind: software
editorialStatus: draft
date: 2026-07-28
sourceLocale: en
content:
  en:
    title: '<canonical or source-language title>'
    summary: '<optional concise description>'
    contribution: '<explicit personal contribution>'
    venue: '<optional venue or publisher>'
  ko:
    title: '<optional translated display title>'
    summary: '<optional translated description>'
    contribution: '<translated contribution>'
    venue: '<optional translated venue>'
projectIds: [example-project]
contributors:
  - person: self
    role: creator
links:
  - kind: repository
    url: https://github.com/example/example
    primary: true
knowledgeLinks: []
evidence: []
```

Output kinds are:

```text
paper | software | release | presentation | poster | dataset | article |
award | other
```

Link kinds are `doi`, `repository`, `demo`, `slides`, `pdf`, `video`, and
`website`. A published Output has exactly one link marked `primary: true`; that
is its canonical public artifact. It also has a contributor entry that identifies
`self` and the actual role. Other contributors may have a name, role, and
optional public profile URL.

Output owns `projectIds` because one result can belong to several Projects.
Project pages derive the reverse list. A source-language-only Output can appear
on both localized indexes with its subtree language marked correctly.

## Tokamak knowledge links

TimelineEvent, Project, and Output may each hold typed references:

```yaml
knowledgeLinks:
  - kind: article
    relation: background
    urls:
      ko: https://hoonseokyoon.github.io/tokamak/ko/blog/example/
      en: https://hoonseokyoon.github.io/tokamak/en/blog/example/
    label:
      ko: '<optional short label>'
      en: '<optional short label>'
```

Kinds and route shapes are:

| Kind       | Required path shape                      |
| ---------- | ---------------------------------------- |
| `article`  | `/tokamak/{lang}/blog/{slug}/`           |
| `project`  | `/tokamak/{lang}/projects/{id}/`         |
| `category` | `/tokamak/{lang}/categories/{category}/` |

Relations are:

| Relation     | Meaning                                                                |
| ------------ | ---------------------------------------------------------------------- |
| `background` | The knowledge resource explains background used by the personal record |
| `applied`    | The personal work applies the linked knowledge                         |
| `produced`   | The work produced the linked knowledge artifact                        |
| `documents`  | The knowledge resource documents or reviews the personal work          |

At least one locale URL is required. If both locales exist, the suffix after
`/ko/` and `/en/` must match. Links are explicit canonical HTTPS URLs; the root
build validates shape but does not fetch Tokamak.

`sameAs` is never used for Project-to-article relationships. A knowledge article
is related material, not the same entity as a personal Project or Output.

## Canonical reference direction

```text
TimelineEvent ──projectIds──▶ Project
TimelineEvent ──outputIds───▶ Output
Output ─────────projectIds──▶ Project

TimelineEvent / Project / Output
              ──knowledgeLinks──▶ canonical Tokamak URLs
```

- Project backlinks to TimelineEvents and Outputs are derived.
- Tokamak backlinks are optional and never required for a root build.
- No runtime API, Git submodule, generated shared manifest, or cross-repository
  build fetch is introduced.

## Derived routes, anchors, and ordering

Content never stores its own root-site route. Routes are derived from entity ID
and locale:

```text
Project(example-project)
  → /ko/projects/example-project/
  → /en/projects/example-project/
```

TimelineEvents and Outputs have language-neutral fragment IDs on their index
pages, but those fragments are not treated as standalone canonical documents.
Output group anchors are stable:

| Output kind    | Group anchor     |
| -------------- | ---------------- |
| `paper`        | `#publications`  |
| `software`     | `#software`      |
| `release`      | `#releases`      |
| `presentation` | `#presentations` |
| `poster`       | `#posters`       |
| `dataset`      | `#datasets`      |
| `article`      | `#articles`      |
| `award`        | `#awards`        |
| `other`        | `#other`         |

Empty groups emit neither heading nor anchor. Timeline order is ongoing first,
then descending by known start date. Output order is descending by date. Projects
are grouped by lifecycle, then ordered by `featuredRank` when present and period.
Tie-breaking uses immutable ID for deterministic builds.

## Validation invariants

The content validator must fail the build when any of these rules is violated:

1. TimelineEvent, Project, and Output IDs are lower-case kebab-case, unique
   within their entity type, and equal the filename. The Person singleton has the
   fixed ID `hoonseok-yoon` in `person.yml`.
2. `content[sourceLocale]` exists and every present locale block satisfies the
   complete entity schema; there is no field-level language fallback.
3. The published Person has both locales and exactly the approved canonical URL.
4. Every published Project has both locales.
5. Every published record has at least one valid evidence entry.
6. Draft records generate no route, index item, sitemap entry, or JSON-LD.
7. All IDs in reference arrays resolve and no array contains duplicates.
8. Period end is not before start; `present` is allowed only as an end value.
9. Active Projects end in `present` or omit end; completed/archived Projects
   require a concrete end and cannot end in `present`.
10. Featured ranks are unique positive integers among published Projects.
11. A published Output has exactly one link marked `primary: true` and identifies
    `self` in contributors.
12. External URLs use HTTPS, except an explicitly confirmed Person contact may
    use `mailto:`.
13. DOI URLs use one normalized form and are unique across Outputs.
14. Knowledge URLs use the exact Tokamak origin/base and match their declared
    kind and locale.
15. Paired KO/EN knowledge URLs have the same suffix after the locale segment.
16. The same URL is not duplicated between a record's ordinary links and
    `knowledgeLinks`; an authored Tokamak article used as an Output is represented
    by its primary Output link.
17. Public routes are derived from IDs; stored root-site URLs are rejected.
18. The generated route manifest contains every nav, canonical, `hreflang`,
    sitemap, and redirect target.
19. The production catalog satisfies the non-empty release gate in the IA.

Reachability of external URLs is a separate live audit. It must not make either
repository's ordinary build depend on the other deployment being online.

## Structured-data mapping

Language-neutral IDs let KO and EN pages describe the same entities:

| Entity        | Structured-data ID                              |
| ------------- | ----------------------------------------------- |
| Person        | `https://hoonseokyoon.github.io/#person`        |
| WebSite       | `https://hoonseokyoon.github.io/#website`       |
| Project       | `https://hoonseokyoon.github.io/#project-{id}`  |
| Output        | `https://hoonseokyoon.github.io/#output-{id}`   |
| TimelineEvent | `https://hoonseokyoon.github.io/#timeline-{id}` |

- Localized home pages emit the shared `Person` and `WebSite` entities.
- Person `sameAs` contains identity-equivalent public profiles only.
- Current affiliation/role data is derived from eligible ongoing TimelineEvents.
- Projects map to Schema.org [`Project`](https://schema.org/Project). That term is
  currently marked as newer, so the release does not depend on a project-specific
  search rich result.
- Software Outputs map to
  [`SoftwareSourceCode`](https://schema.org/SoftwareSourceCode), papers to
  [`ScholarlyArticle`](https://schema.org/ScholarlyArticle), presentations to
  [`PresentationDigitalDocument`](https://schema.org/PresentationDigitalDocument),
  and datasets to [`Dataset`](https://schema.org/Dataset); other Outputs use
  conservative `CreativeWork` types.
- Timeline kinds map only where the meaning is precise; otherwise they remain
  semantic HTML rather than speculative structured data.
- Knowledge relations remain ordinary typed links unless a precise standard
  property applies. They are never forced into `sameAs`.
- Draft or unsupported facts never appear in JSON-LD.

Tokamak's `WebSite.author` and article author references must use the same root
Person ID. Tokamak keeps its own WebSite ID and canonical article URLs.

## Approved CP2 schema decisions

CP2 freezes these choices for implementation:

1. One YAML record contains shared factual metadata and whole KO/EN content
   blocks.
2. Person and every published Project are bilingual; TimelineEvents and Outputs
   may retain a declared source language.
3. `id` is immutable and determines Project routes; titles never determine URLs.
4. TimelineEvent and Output own forward references; Project backlinks are derived.
5. Public metadata seeds drafts only, and published records require evidence or
   dated confirmation.
6. Tokamak integration uses typed absolute URLs and build-time shape validation,
   with no runtime or build-time network coupling.
7. The public repository contains no supposedly private records, including drafts.
