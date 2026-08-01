# Content model

All content lives in YAML under `src/lib/content/`. Every file is parsed and
validated by a Zod schema at build time, so a malformed or unapproved record
fails the build instead of reaching the site.

```text
src/lib/content/person.yml
src/lib/content/timeline/{id}.yml
src/lib/content/projects/{id}.yml
src/lib/content/outputs/{id}.yml
```

A collection file's name must equal the record's `id`.

## Shared fields

| Field             | Meaning                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `id`              | Lower-case kebab-case, immutable, matches the filename                |
| `editorialStatus` | `draft` or `published`; drafts never reach pages, sitemap, or JSON-LD |
| `sourceLocale`    | `ko` or `en`; the locale the record was written in                    |
| `content`         | Localized blocks keyed by locale                                      |
| `evidence`        | Why this record is publishable (see below)                            |

Dates are partial: `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`, and must be real calendar
dates. A period's `end` may also be the literal `present`.

Quote year-only dates — `start: '2024'`. Unquoted, YAML reads `2024` as an
integer and validation fails. `2024-03` and `2024-03-01` need no quotes.

### Locale rules

A record must always carry its `sourceLocale` block. When a page is requested in
the other locale and no translation exists, the source-locale text is shown and
marked as a fallback rather than machine-translated.

Published `Person` and `Project` records require **both** `ko` and `en`.

### Evidence

Every `published` record needs at least one evidence entry, and at least one of
them must be `user-confirmed` with a `checkedAt` date. This is the gate that
keeps unverified personal claims off the site.

```yaml
evidence:
  - kind: public-profile # or repository | canonical-output
    url: https://github.com/hoonseokyoon
    checkedAt: 2026-07-28
  - kind: user-confirmed
    checkedAt: 2026-07-28
```

## Person

One record, `person.yml`. It supplies the CV masthead and the stable
`https://hoonseokyoon.github.io/#person` identity that Tokamak's author data
points at.

```yaml
content:
  ko:
    name: Hoonseok Yoon
    headline: 한 줄 소개
    summary: 한 문단 소개
    focus: # 관심 분야 — rendered as the Focus section
      - 지식 구조와 정보 설계
    expertise: # 기술 — rendered as the Expertise ledger
      - label: 언어
        items: [TypeScript, Python]
sameAs:
  - https://github.com/hoonseokyoon
contacts:
  - kind: email
    url: mailto:someone@example.com
```

`focus` and `expertise` are optional. Their sections disappear when empty —
as does every other section on the home page.

## TimelineEvent

The chronology. `kind` is one of `education`, `employment`, `appointment`,
`research`, `project`, `publication`, `presentation`, `award`, `release`,
`milestone`, `other`.

The home page's **Experience** section prefers `education`, `employment`,
`appointment`, and `research` — the CV backbone — and falls back to whatever
history exists so the section is never mysteriously empty. Anything still
running (`end: present`) is lifted into **Now**.

## Project

`lifecycle` is `planned`, `active`, `paused`, `completed`, or `archived`. An
`active` project cannot have a fixed end date; a `completed` or `archived` one
must have one. `featuredRank` promotes a project onto the home page.

## Output

Concrete results: `paper`, `software`, `release`, `presentation`, `poster`,
`dataset`, `article`, `award`, `other`. A published Output needs exactly one
`primary: true` link and must list `person: self` among its contributors. DOIs
must use the canonical `https://doi.org/10.…` form.

## Knowledge links

Cross-references to the Tokamak knowledge site. This site never copies Tokamak's
prose; it links to it.

```yaml
knowledgeLinks:
  - kind: project # article | project | category
    relation: produced # background | applied | produced | documents
    reciprocal: true # Projects only; asserts Tokamak links back
    urls:
      ko: https://hoonseokyoon.github.io/tokamak/ko/projects/…/
      en: https://hoonseokyoon.github.io/tokamak/en/projects/…/
    label:
      ko: 상미분방정식 6부작
      en: Six-part ODE series
```

URLs must be canonical Tokamak paths — right origin, right locale prefix, no
query, fragment, port, or percent-encoding tricks — and a KO/EN pair must share
the same slug. Only a Project may declare `reciprocal`, and doing so requires
both locales.

Changing a reciprocal relation means deploying Tokamak first, then this site.

## Validating

```bash
npm run validate:content
```

Add `-- --release` to also require the minimum publishable set: a published
Person with a contact or profile link, plus at least one published
TimelineEvent, Project, and Output.
