# Content ownership contract

Status: **approved at CP1 on 2026-07-28**

## Purpose

The two sites describe the same person's work from different primary axes.

| Site                                       | Primary axis                        | Canonical question                                                          |
| ------------------------------------------ | ----------------------------------- | --------------------------------------------------------------------------- |
| Personal site (`hoonseokyoon.github.io`)   | person, activity, and time          | What did Hoonseok do, when, in which role, and with what result?            |
| Tokamak (`hoonseokyoon.github.io/tokamak`) | subject, explanation, and knowledge | What was learned or established, and how does it relate to other knowledge? |

The boundary is about canonical ownership, not visual presentation. Both sites
may show summaries of the same work, but only one site owns the full record.

## Ownership rules

### Personal site owns

- profile and contact information;
- education, employment, appointments, and other timeline events;
- project participation, role, period, status, collaborators, and outcomes;
- authored outputs such as software, papers, presentations, awards, and releases;
- activity updates, project case studies, and personal or career retrospectives;
- the canonical `Person` identity used by structured data across both sites.

### Tokamak owns

- study notes, concept explanations, tutorials, and technical articles;
- paper reviews and literature summaries;
- subject categories and knowledge-oriented project groupings;
- Korean and English article resources;
- prerequisite or reading-order relationships when they are genuinely useful;
- reusable explanations produced while carrying out a personal project.

### Neither site should own twice

- A full article must not be copied into both repositories.
- A project description on the personal site may summarize the work and link to
  Tokamak, but must not reproduce the linked knowledge article.
- A Tokamak article may name where the knowledge was applied and link back to a
  personal-site project, but must not duplicate the project's career record.
- Search, sitemap, canonical, and social metadata must point to the canonical
  owner rather than creating competing copies.

## Decision guide for ambiguous content

| Content                                                          | Canonical owner | Cross-site representation                                                          |
| ---------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------- |
| Enrolled in or completed a course                                | Personal site   | Timeline event linking to related Tokamak study project                            |
| Notes explaining the course material                             | Tokamak         | Optional link to the personal timeline event                                       |
| Built a software system                                          | Personal site   | Project record with role, dates, decisions, and results                            |
| Reusable technical explanation from that system                  | Tokamak         | Article linking back to the project as an application                              |
| Reviewed someone else's paper                                    | Tokamak         | Optional personal output link only when the review itself is a notable deliverable |
| Authored or co-authored a paper                                  | Personal site   | Output record linking to any explanatory Tokamak material                          |
| Project retrospective focused on personal decisions and outcomes | Personal site   | Links to knowledge articles for technical background                               |
| Topic synthesis intended to stand on its own                     | Tokamak         | Links to projects where it was used                                                |
| Short status update                                              | Personal site   | No duplicate Tokamak post                                                          |
| Personal essay about identity or career direction                | Personal site   | Tokamak only if a separate transferable knowledge article exists                   |

When a document contains both kinds of material, split it by reader intent:
the activity/case-study record belongs to the personal site; the durable
explanation belongs to Tokamak.

## Approved cross-site contract

### Identity

- Canonical person URL: `https://hoonseokyoon.github.io/`
- Proposed structured-data person ID: `https://hoonseokyoon.github.io/#person`
- Tokamak should reference that ID as the author instead of defining a competing
  person identity under `/tokamak`.

### Navigation

- Personal site exposes a primary `Knowledge` link to `/tokamak/ko/` and a
  language-aware link to `/tokamak/en/` on English pages.
- Tokamak exposes a stable author/profile link back to the personal site.
- The sites keep separate primary navigation because their reader tasks differ.

### Content links

- Phase 1 uses explicit, stable HTTPS URLs; neither build depends on fetching the
  other repository over the network.
- Personal project/output records may hold typed `knowledgeLinks` to Tokamak.
- Tokamak articles may hold an optional application/project link back to the
  personal site after the personal route schema exists.
- Both builds should validate internal routes and configured cross-site links.
- A shared feed or runtime API is out of scope until the number of manual links
  makes a manifest demonstrably useful.

### Known Tokamak integration work

The contract requires small, explicit Tokamak changes after CP1 approval:

- Tokamak currently emits `https://hoonseokyoon.github.io/tokamak/#person` via
  its base-path-aware URL helper. Its `WebSite.author` and `BlogPosting.author`
  must instead reference the root `https://hoonseokyoon.github.io/#person` ID.
- Tokamak's general `href()` helper always applies the `/tokamak` base path, so
  a separate root-site URL constant or helper is needed for author/profile links.
- Tokamak's build-integrity check currently rejects same-origin links that escape
  `/tokamak`. It needs a narrow allowlist for approved personal-site URLs rather
  than disabling the boundary check.
- The origin-level `/robots.txt` belongs to the personal-site repository and must
  advertise both the personal-site sitemap and `/tokamak/sitemap.xml`.

These are implementation consequences of the ownership contract, not reasons to
couple the two builds.

### Design

- The sites may share brand primitives, typography, accessibility standards, and
  selected design-token values.
- They should not initially share a runtime component package. Independent static
  builds avoid turning one site's release into a prerequisite for the other.
- Extraction into a shared package should happen only after repeated synchronized
  changes demonstrate that the maintenance cost is real.

## Approved product distinction

The personal site should not re-create al-folio's generic academic sections or
Tokamak's learning model. Its smallest useful content model is expected to be
`Person -> TimelineEvent -> Project -> Output`, with references between those
records. Tokamak retains its current knowledge-oriented domain/project/article
model.

## Approved CP1 decisions

CP1 records the following decisions:

1. The personal site is canonical for identity, activity, chronology, roles,
   projects, and authored outputs.
2. Tokamak is canonical for knowledge articles, study notes, and paper reviews.
3. Content is summarized and linked across sites, not duplicated.
4. The personal root owns the cross-site `Person` identity.
5. Integration begins with static URLs and validation, not a shared API or shared
   component package.

Language coverage and the detailed personal-site schema are defined by the
approved CP2 contracts in `04-information-architecture.md` and
`05-content-schema.md`. They extend this ownership boundary without changing it.
