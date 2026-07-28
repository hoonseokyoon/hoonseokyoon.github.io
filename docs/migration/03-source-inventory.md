# Current personal-content source inventory

Status: **approved at CP2 on 2026-07-28**

Audit date: **2026-07-28 (Asia/Seoul)**

## Purpose

The replacement site must begin with real, reviewable personal records rather
than translating al-folio placeholders into a new schema. This inventory records
what can seed a draft, what still requires Hoonseok's confirmation, and what must
not be published.

Public availability is evidence, not publication consent. Nothing in this
document authorizes an automatic import into the new site.

## Evidence levels

| Level | Source                                                   | Permitted use                                                                 |
| ----- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| A     | Hoonseok's explicit confirmation                         | May become a published record when all required fields are complete           |
| B     | A canonical public profile or canonical output page      | May prefill a draft; time-sensitive facts still require confirmation          |
| C     | Repository metadata or another project-controlled source | May identify project/output candidates; does not establish role or importance |
| D     | Imported template, sample record, or unsupported claim   | Must not seed personal content                                                |

Every published record must retain at least one non-template evidence reference
or a dated user-confirmation marker. Evidence metadata is for editorial review;
it is not rendered as part of the public biography by default.

## Current source findings

### Legacy root repository

The current root repository establishes only a small amount of personal intent:

- the name `Hoonseok Yoon`;
- the GitHub account `hoonseokyoon`;
- the email currently present in `_config.yml`;
- one personal knowledge draft, `Integrated Understanding of Calculus Symbols`.

The name and account can seed draft identity fields. The email requires explicit
confirmation before it is exposed by the replacement site. The calculus draft
belongs to Tokamak under the approved CP1 ownership contract and is not personal
timeline or project body content.

The home biography, address, CV, publications, teaching, news, project entries,
and bibliography in this repository are al-folio examples. They are level D and
must not be transformed into personal records.

### Public GitHub profile

The GitHub API endpoints `/users/hoonseokyoon` and
`/users/hoonseokyoon/repos?per_page=100` returned the following public profile
and repository values on the audit date:

| Field          | Public value                                       | CP2 treatment                       |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Name           | `Hoonseok Yoon`                                    | Draft identity candidate            |
| Bio            | `Medical Student at Catholic University of Korea.` | Draft current-role candidate        |
| Company        | `Catholic University, School of Medicine`          | Draft affiliation candidate         |
| Location       | `Seoul, Republic of Korea`                         | Optional draft location candidate   |
| Public repos   | `11`                                               | Discovery count only                |
| Profile handle | `hoonseokyoon`                                     | Draft public-profile link candidate |

These values are mutable self-reported metadata. They do not establish start or
end dates, degree details, an official institutional title, or permission to
publish location/contact information on the personal site. Those points remain
level B until confirmed.

### Public repository candidates

The 11 public repositories observed on the audit date divide into these groups:

| Group                     | Repositories                                                                                                                                                     | Treatment                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Non-fork work candidates  | `monoid-agent-kernel`, `uni2h-preprocessing`, `lecture-pipeline-light`, `good-work-project`, `goodwork`, `statistics-practice-2025`, `pdf2image-dataset-creator` | Candidate Project or software Output only after role, dates, purpose, and visibility are confirmed |
| Forks                     | `cokacdir`, `Awesome-Bio-Foundation-Models`, `hoonseokyoon.github.io`                                                                                            | Do not present as authored work merely because they are public                                     |
| GitHub profile repository | `hoonseokyoon`                                                                                                                                                   | Identity infrastructure, not a portfolio project                                                   |

`fork: false` does not prove sole authorship, project significance, completion,
or readiness for a portfolio. Repository recency, stars, language, and pinned
state must not automatically determine featured status. The initial project and
output set is a manually selected subset, not a mirror of GitHub.

### Tokamak repository and deployed knowledge site

Tokamak currently provides real knowledge-oriented domains, projects, learning
nodes, and KO/EN articles. It is evidence that knowledge work exists and supplies
canonical `knowledgeLinks`; its knowledge-oriented project taxonomy must not be
copied into the personal site's project collection.

Access to Tokamak's private source repository authorizes coordinated code and
documentation work for this migration. It is not, by itself, approval to expose
private repository metadata or to create a personal Project record for Tokamak.
That record requires the same explicit selection and confirmation as any other
project.

## Material not currently established

No authoritative source reviewed in CP1–CP2 currently establishes:

- education start/end dates, graduation status, or degree details;
- employment, appointment, research, or teaching periods;
- authored publications, DOI ownership, presentations, posters, or awards;
- collaborators, exact personal roles, project outcomes, or impact claims;
- which public repositories should be featured;
- whether the legacy email and location should remain public;
- a root-site activity/news stream that justifies a feed.

These fields must remain absent rather than being inferred from repository names,
commit timestamps, Tokamak topics, or template text.

## Initial-content gate for implementation

Before production cutover, Hoonseok must review and approve a deliberately small
seed set containing at least:

1. one bilingual Person record;
2. one dated TimelineEvent;
3. one bilingual Project with an explicit personal role;
4. one Output with a canonical public link and explicit contribution;
5. the public contact/profile links that are intentionally exposed.

The same real-world work may satisfy several of these requirements through
references—for example, one confirmed software project can have a timeline event
and a software output—but the text is stored once in the entity that owns it.

## Approved CP2 source policy

CP2 freezes these rules:

1. External public metadata may prefill drafts but is never auto-published.
2. No private fact belongs in the public repository, even under a draft flag.
3. Every published record has dated evidence or explicit user confirmation.
4. Dates retain their known precision; missing months or days are never invented.
5. GitHub repositories are manually curated into Projects or Outputs rather than
   mirrored as a repository directory.
6. Unsupported CV, publication, teaching, award, and impact claims remain absent.
