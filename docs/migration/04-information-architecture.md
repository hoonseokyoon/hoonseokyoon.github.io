# Root personal-site information architecture

Status: **approved at CP2 on 2026-07-28**

Decision date: **2026-07-28 (Asia/Seoul)**

## Product shape

The root site is a compact, bilingual personal-history system. It answers four
questions without recreating al-folio's academic template or Tokamak's knowledge
navigation:

1. Who is Hoonseok and what is he doing now?
2. What happened when?
3. Which projects did he work on, in what role, and with what result?
4. Which concrete outputs came from that work?

The home page owns the Person identity. Timeline, Projects, and Outputs are the
only first-release content axes. Knowledge remains a locale-matching link to
Tokamak.

## Approved public routes

```text
/
├── ko/
│   ├── timeline/
│   ├── projects/
│   │   └── {project-id}/
│   └── outputs/
├── en/
│   ├── timeline/
│   ├── projects/
│   │   └── {project-id}/
│   └── outputs/
├── robots.txt
├── sitemap.xml
└── 404.html
```

`/` is an infrastructure entry point that immediately sends readers to `/ko/`.
It is not a third, unlocalized copy of the home page.

The first release deliberately has no separate About, CV, News, Repositories,
Publications, Teaching, Contact, or root Blog page. Those labels either duplicate
one of the four canonical questions or lack real content today.

## Page responsibilities

### `/{lang}/` — Person home

The home page contains:

- confirmed name, headline, short summary, and intentionally public links;
- a `Now` view derived from ongoing TimelineEvents rather than duplicated text;
- manually featured Projects;
- recent Outputs;
- a clear `Knowledge` gateway to the same-language Tokamak home.

It does not contain a news feed, long CV, full repository list, or copied Tokamak
article body. A separate About route is added only if confirmed profile material
later outgrows a concise home page.

### `/{lang}/timeline/` — verified chronology

The timeline shows published events in reverse chronological order, with ongoing
events first. Each item may expose its period, kind, role, organization, summary,
and links to related Projects and Outputs.

TimelineEvents do not receive detail routes in v1. A chronology item is context,
not another long-form publishing surface.

### `/{lang}/projects/` — selected personal work

The index contains manually selected personal Projects, not an automatic GitHub
repository mirror and not Tokamak's knowledge Project taxonomy. Active work may
be grouped before completed work; within a group, the configured featured rank
and then the known period determine order.

### `/{lang}/projects/{project-id}/` — project record

Project detail is the only record-level route in v1. It owns:

- the period, lifecycle, context, and explicit personal role;
- concise contributions, decisions, and outcomes when confirmed;
- canonical repository, demo, documentation, or website links;
- related TimelineEvents and Outputs, derived from references elsewhere;
- short, typed links to related Tokamak knowledge.

It summarizes project work but does not copy knowledge articles or create a
second source of truth for output metadata.

### `/{lang}/outputs/` — authored results

The output index groups published software, papers, releases, presentations,
posters, datasets, articles, awards, and other concrete results. Only non-empty
groups and anchors are rendered. Each item links to its canonical public artifact
and to related Projects.

Outputs do not receive internal detail routes in v1. If an output needs a case
study, that narrative belongs to the related Project; durable explanation belongs
to Tokamak.

## Primary navigation

The global navigation is intentionally small:

```text
Hoonseok Yoon | Timeline | Projects | Outputs | Knowledge | KO / EN
```

- The name/logo returns to the localized home.
- `Knowledge` points to `/tokamak/ko/` on Korean pages and `/tokamak/en/` on
  English pages.
- The language switch preserves the current core route and project ID.
- Contact/profile links belong in the Person area and footer, not primary nav.
- No menu item may point to an empty or non-generated page.

## Locale and URL policy

| Concern                | Approved policy                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Supported locales      | `ko`, `en`                                                                                                       |
| Default locale         | `ko`                                                                                                             |
| Root behavior          | Static redirect document to `/ko/`; `noindex`, canonical `/ko/`, and a visible fallback link                     |
| Detection              | No browser-language or client-side locale detection                                                              |
| URL form               | Lower-case static paths with a trailing slash                                                                    |
| Canonical              | Every localized content page is self-canonical                                                                   |
| `hreflang`             | KO/EN pairs on core pages and every Project; `x-default` points to the Korean counterpart                        |
| Project localization   | Every published Project requires complete KO and EN blocks, so project routes are symmetric                      |
| Timeline/output locale | A record may remain in its declared source language; fallback text is marked with the correct nested HTML `lang` |
| Legacy locale          | Existing unlocalized personal routes are treated as English entry points and therefore target English successors |

Site chrome and the Person record are always authored in both languages. A
TimelineEvent or Output may retain an English paper title or another source-only
block without pretending that it was translated. Project detail is stricter
because it is a first-class bilingual route and appears on both home pages.

## Non-empty release gate

The implementation must not publish a new shell filled with empty academic
sections. Production cutover requires:

- a complete bilingual Person record;
- at least one published TimelineEvent;
- at least one published bilingual Project;
- at least one published Output;
- at least one explicitly confirmed public profile/contact link.

The validator rejects a redirect, navigation link, sitemap URL, section anchor,
or `hreflang` counterpart whose target is not in the generated route manifest.
Output-type anchors such as `#software` and `#publications` exist only when that
group has records.

## CP2 resolution of deferred legacy routes

The current site is English, so meaningful old paths target English successors.
All compatibility documents use a static meta refresh, `noindex`, a canonical
destination, and a visible fallback link. GitHub Pages cannot provide a true HTTP
301 from these generated static documents.

| Legacy route     | First-release disposition                           | Activation rule and rationale                                                                 |
| ---------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `/projects/`     | Redirect to `/en/projects/`                         | Required by CP1; target must contain at least one confirmed Project                           |
| `/cv/`           | Redirect to `/en/timeline/`                         | Generated only after the non-empty timeline release gate passes                               |
| `/publications/` | Conditional redirect to `/en/outputs/#publications` | Generated only when at least one authored paper is published; otherwise 404                   |
| `/repositories/` | Conditional redirect to `/en/outputs/#software`     | Generated only when at least one selected software Output is published; otherwise 404         |
| `/news/`         | Remove; new site returns 404                        | Legacy records are samples and v1 has no root-owned activity stream                           |
| `/teaching/`     | Remove; new site returns 404                        | Legacy page is a sample; real teaching later belongs in Timeline and its artifacts in Outputs |
| `/feed.xml`      | Remove; new site returns 404                        | Timeline mutation is not a publication feed and no feed-eligible activity model exists        |

The knowledge redirects approved at CP1 remain unchanged:

- `/blog/` → `/tokamak/en/`
- `/review/` → `/tokamak/en/categories/paper-review/`
- the legacy calculus URL → its future same-topic English Tokamak article only
  after the CP1 rewrite and deployment gates pass.

There is no blanket redirect from removed template routes to the home page.

## Search, sitemap, and structured identity

- The root sitemap contains only generated canonical personal-site URLs.
- `/robots.txt` advertises both `/sitemap.xml` and `/tokamak/sitemap.xml`.
- Static compatibility documents and `/` are excluded from the sitemap and
  marked `noindex`.
- Both localized homes use the same approved Person ID,
  `https://hoonseokyoon.github.io/#person`.
- Tokamak continues to own and list its own routes in its own sitemap.

## Out of scope for the first release

- a content-management UI or private personal database;
- automatic GitHub, ORCID, Scholar, or Tokamak ingestion;
- runtime cross-repository fetching;
- a shared component package or coupled deployment;
- search, tags, activity feeds, comments, analytics dashboards, or project-body
  MD/SVX;
- per-event and per-output detail routes.

## Approved CP2 IA decisions

CP2 freezes the following implementation boundary:

1. Home plus Timeline, Projects, and Outputs is the complete first-release IA.
2. Root defaults to Korean while old unlocalized routes preserve English intent.
3. Only Project receives a record detail route, and published Projects are KO/EN
   symmetric.
4. Empty sections, anchors, redirects, and menu items are build errors or omitted.
5. `/cv/`, `/publications/`, `/repositories/`, `/news/`, `/teaching/`, and
   `/feed.xml` receive the exact dispositions in this document.
6. Knowledge navigation remains a locale-matching cross-site link, not a copied
   root blog.
