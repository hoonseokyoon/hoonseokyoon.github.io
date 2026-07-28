# Legacy route disposition plan

Status: **route audit approved at CP1; deferred routes approved at CP2 on 2026-07-28**

Source branch/head: `master` at `990479f`

Published branch/head: `origin/gh-pages` at `ff96ac6`

## Audit result

The current published artifact contains:

- 80 sitemap URLs;
- 81 route-like HTML files when `/404.html` is included;
- 3 additional standalone demo HTML files under `assets/`;
- 27 source posts: 1 personal post and 26 al-folio samples;
- 1 additional external al-folio Medium post fetched at build time;
- 6 sample projects and 3 sample news records;
- 1 custom `/review/` page with no personal review data;
- template CV, publication, repository, people, teaching, and home content.

Git history after the imported al-folio baseline changes only `_config.yml`,
adds `_pages/review.md`, and adds the calculus post. This is the evidence used to
distinguish personal intent from template material.

The exact sitemap snapshot is recorded in `legacy-sitemap-paths.txt`. The three
standalone HTML demos excluded from the sitemap are:

- `/assets/html/relativity.html`
- `/assets/jupyter/blog.ipynb.html`
- `/assets/plotly/demo.html`

## Disposition vocabulary

| Term                   | Meaning                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| Rebuild                | The route expresses a real responsibility of the new personal site        |
| Compatibility redirect | Preserve an old meaningful entry point while moving its canonical content |
| Knowledge redirect     | Send a genuine knowledge-oriented entry point to Tokamak                  |
| Remove                 | Publish no replacement; GitHub Pages should return the new site's 404     |
| Regenerate             | Infrastructure output produced by the new build                           |
| Defer                  | Preserve the decision for CP2 because it depends on real content and IA   |

Blanket redirects are avoided. Redirecting unrelated sample URLs to a home page
would create soft-404 behavior and falsely imply that template content was
authored by Hoonseok.

## Personal and meaningful routes

| Current route                                              | Proposed disposition   | Proposed destination or successor                                                  | Rationale                                                                                                             |
| ---------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/`                                                        | Rebuild                | Personal-site home; locale behavior decided at CP2                                 | Canonical identity and activity entry point                                                                           |
| `/projects/`                                               | Compatibility redirect | New localized personal project index                                               | The old data is sample content, but the route concept belongs to the personal site                                    |
| `/cv/`                                                     | Defer                  | `/cv/` or a new localized timeline/about route                                     | The current CV is Einstein sample data; the useful successor depends on the personal content model                    |
| `/publications/`                                           | Defer                  | A publication view or new localized outputs route                                  | Current publications are samples; authored-publication data must be inventoried first                                 |
| `/repositories/`                                           | Defer                  | New localized personal project or software-output route                            | Repository evidence may belong inside projects rather than in a standalone page                                       |
| `/news/`                                                   | Defer                  | New localized timeline/activity route or removal                                   | The current news is sample data; preservation depends on whether root exposes activity updates                        |
| `/teaching/`                                               | Defer                  | Timeline/output successor or removal                                               | No personal teaching data exists in this repository                                                                   |
| `/feed.xml`                                                | Defer                  | Root activity feed, future Tokamak feed, or removal                                | Tokamak has no feed today and CP2 must decide whether either product needs one                                        |
| `/blog/`                                                   | Knowledge redirect     | **Recommended:** `/tokamak/en/`                                                    | The legacy site is English and durable knowledge articles belong to Tokamak                                           |
| `/review/`                                                 | Knowledge redirect     | `/tokamak/en/categories/paper-review/`                                             | The page inherits the English legacy locale; Tokamak already owns this category                                       |
| `/blog/2024/Integrated-Understanding-of-Calculus-Symbols/` | Knowledge redirect     | **Proposed new:** `/tokamak/en/blog/integrated-understanding-of-calculus-symbols/` | The only personal post is English and knowledge-oriented, but no semantically equivalent Tokamak article exists today |
| `/404.html`                                                | Regenerate             | New personal-site 404                                                              | Required infrastructure                                                                                               |
| `/robots.txt`                                              | Regenerate             | Root robots policy referencing root and Tokamak sitemaps                           | Root robots controls the whole origin                                                                                 |
| `/sitemap.xml`                                             | Regenerate             | Root personal-site URLs only; explicitly expose Tokamak sitemap separately         | Avoid cross-site canonical ambiguity                                                                                  |

The calculus destination is proposed, not yet available. The existing Tokamak
`matrix-calculus-for-statistics` article covers trace methods and statistical
optimization; it is not a semantic replacement for the old chain-rule,
Jacobian/Hessian, tensor, grad/div/curl, and Laplacian draft. Before the redirect
is enabled, the old article must be:

1. mathematically reviewed and rewritten rather than copied verbatim;
2. published as a same-slug KO/EN Tokamak pair;
3. owned by a new published LearningNode in Tokamak's currently empty `calculus`
   SubProject;
4. updated to use locally owned, described images instead of the external Dropbox
   image and al-folio sample thumbnail;
5. deployed and verified at the proposed destinations.

The old English URL redirects only to the new English article after those gates
pass. The new Korean article is discovered through Tokamak's normal locale and
project navigation.

## Routes proposed for removal

### Template blog routes

Remove without redirects:

- the 26 source sample-post routes;
- `/blog/2022/displaying-external-posts-on-your-al-folio-blog/`, which is fetched
  from the template author's Medium feed rather than owned here;
- the 6 year archives;
- the 19 tag archives;
- the 2 category archives;
- `/blog/page/2/` through `/blog/page/6/`;

Only the blog index and the one personal calculus URL receive redirects. Sample
detail URLs do not redirect to Tokamak because Tokamak never owned those samples.

### Template project and news routes

Remove without redirects:

- `/projects/1_project/` through `/projects/6_project/`;
- `/news/announcement_1/` through `/news/announcement_3/`.

The project index receives the CP1 compatibility redirect, but individual sample
items do not. The news index remains deferred to CP2; it is not covered by that
project-index decision.

### Template top-level pages

Remove without redirects:

- `/people/` — sample lab-member page;
- `/_pages/dropdown/` — unintended generated route from the navigation demo.

`/teaching/` is deferred rather than removed at CP1. If real teaching history is
supplied during CP2, it should be represented as timeline events or outputs; the
compatibility behavior can then be chosen against actual data.

### Standalone demonstrations and sample assets

Remove the three standalone demo HTML files listed above and their supporting
sample-only assets, including `/assets/json/resume.json`,
`/assets/json/table_data.json`, the Einstein/example PDF, demo notebook, media,
and publication previews, after the new build proves that no retained route
refers to them.

## Preservation and cutover safeguards

Before destructive migration work begins:

1. create a named legacy tag at source commit `990479f`;
2. retain the current `gh-pages` commit ID `ff96ac6` in this document;
3. add the approved redirects to a route-parity fixture;
4. verify every retained or redirected old URL against the production artifact;
5. switch GitHub Pages deployment only after the new root build passes locally;
6. keep the legacy tag even after Jekyll files are removed from `main`.

The Git history already preserves deleted files, but the named tag makes the
pre-migration site explicit and recoverable.

## Approved CP1 decisions

CP1 records these policy choices:

1. Preserve meaningful index entry points but remove all individual al-folio
   sample routes without redirects.
2. Redirect the legacy-English `/blog/` to Tokamak's English home rather than
   creating a second knowledge blog on the personal site.
3. Redirect `/review/` to Tokamak's English paper-review category.
4. Rewrite the 2024 calculus draft as a distinct KO/EN Tokamak article under the
   `calculus` SubProject; do not redirect it to the existing matrix-calculus post.
5. Preserve `/projects/` as a compatibility entry point, while deferring `/cv/`,
   `/publications/`, `/repositories/`, `/news/`, `/teaching/`, and `/feed.xml` to
   the CP2 information architecture and real-content inventory.
6. Remove `/people/`, sample detail routes, archives, and demos.

Exact localized destinations for personal-site compatibility redirects are now
approved in `04-information-architecture.md`. No redirect was implemented as
part of CP2.

## Approved CP2 resolution of deferred routes

CP2 resolves the deferred paths as follows:

| Route            | Approved v1 disposition                                     |
| ---------------- | ----------------------------------------------------------- |
| `/projects/`     | Redirect to `/en/projects/`                                 |
| `/cv/`           | Redirect to `/en/timeline/` after the timeline release gate |
| `/publications/` | Redirect to `/en/outputs/#publications` only when non-empty |
| `/repositories/` | Redirect to `/en/outputs/#software` only when non-empty     |
| `/news/`         | Remove; return the new 404                                  |
| `/teaching/`     | Remove; return the new 404                                  |
| `/feed.xml`      | Remove; return the new 404                                  |

The exact rationale, locale behavior, target-existence checks, and GitHub Pages
static-redirect limitation are recorded in
[`04-information-architecture.md`](04-information-architecture.md). The original
`Defer` rows above remain as the historical CP1 audit result; this section is
their controlling CP2 disposition.
