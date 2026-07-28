# CP3 cutover record

Status: **CP3 complete; Tokamak and the root personal site are live**

Implementation date: **2026-07-28 (Asia/Seoul)**

CP3 approval date: **2026-07-28 (Asia/Seoul)**

This document is the historical CP3 cutover snapshot. The current reusable
publication gate is `publish_approved`, and the post-cutover live/protection
contract is recorded in `07-post-cutover-operations.md`. The first reciprocal
knowledge relationship is recorded in `08-knowledge-link-readiness.md`.

## Safety state

- Root implementation branch: `codex/personal-site-rebuild`
- Tokamak integration branch: `codex/personal-site-integration`
- Legacy source recovery point: local tag `legacy-al-folio-990479f` at
  `990479f86fc85ab72f15248b04b87bc04146aea2`
- Root rollback artifact: `origin/gh-pages` commit
  `ff96ac64f9315ece3e5cf0b458ae42a4ccd2ffe7`
- Root Pages publishing source at cutover start: legacy `gh-pages:/`
- Root production merge: PR `#1`, commit
  `84a016aeeecff9abe2186a3f0c80f903a0940562`
- Root Pages build type after cutover: `workflow`
- Root Pages run `30327485908`: verification, artifact upload, and deployment passed
- Tokamak production merge: PR `#65`, commit
  `a9f29da7fdcf931ed7a7b20faf42223e8094838b`
- Tokamak Pages run `30326972100`: build, deploy, and live verification passed

At CP3 cutover, the root Pages workflow accepted only a manual dispatch whose
`cp3_approved` input was true and whose ref was the repository default branch.
The approved run executed from `master`, repeated the complete release
validator, uploaded the artifact, and deployed it after the Pages build type
changed to `workflow`.

## Root implementation completed

- Replaced the Jekyll runtime with a first-party static SvelteKit application.
- Added the approved KO/EN home, Timeline, Projects, Project detail, and Outputs
  information architecture.
- Added YAML-backed Person, TimelineEvent, Project, and Output schemas with
  source-language fallback and an explicit `draft`/`published` boundary.
- Required dated user confirmation for every published record and retained
  partial date precision.
- Added shared Person/WebSite structured-data IDs, localized canonicals,
  `hreflang`, root and Tokamak sitemap discovery, and a static bilingual 404.
- Added a synthetic visual harness that is not imported by the production
  catalog.
- Added one approved `published` record for each of Person, TimelineEvent,
  Project, and Output. The release content validator accepts this seed.
- Adopted `static/social-card.png` as the single social-preview asset and
  verified its Open Graph/Twitter metadata and built-artifact integration.
- Classified the exact 80-route legacy sitemap plus seven infrastructure or
  standalone paths and enforced each redirect, removal, or regeneration rule.
- Removed 269 exact al-folio source/sample targets plus the ten old Jekyll,
  Docker, link-check, and formatting workflows from the implementation branch.
- Replaced deployment automation with release CI and a CP3-gated manual GitHub
  Pages workflow.

The legacy calculus URL is enabled in the root redirect manifest only because
its new Tokamak KO/EN targets were deployed and checked first.

## Tokamak integration completed

- Added stable constants for the root personal-site URL and shared Person ID.
- Updated Tokamak WebSite and BlogPosting authorship to reference
  `https://hoonseokyoon.github.io/#person`.
- Added a visible author link back to the personal site without weakening
  Tokamak's same-origin base-path checks.
- Rewrote the legacy calculus article as an independently authored KO/EN pair
  under the `calculus` LearningNode:
  - `/tokamak/ko/blog/integrated-understanding-of-calculus-symbols/`
  - `/tokamak/en/blog/integrated-understanding-of-calculus-symbols/`
- Removed the old article's external image dependency and corrected the
  chain-rule, Jacobian, Hessian, tensor, and vector-calculus explanations.

The Tokamak changes are deployed. Both localized article URLs return 200 with
their expected title, canonical, shared Person ID, and visible root author link.

## Verification state

### Root artifact

- Svelte/TypeScript diagnostics: 0 errors, 0 warnings
- Release content: one approved `published` Person, TimelineEvent, Project, and
  Output; release validator passed
- Vitest: 13 passed
- Playwright: 18 passed, including real KO/EN seed content, the Tokamak project
  detail, JavaScript-disabled navigation, and widths from 1440 to 320 pixels
- Legacy route parity: 80 sitemap paths plus 7 extra paths; 7 redirects active,
  including the live-verified calculus destination
- Build integrity: 10 localized canonical pages, 7 redirects, exact sitemap,
  robots, canonical, `hreflang`, social-card, and Person/Project JSON-LD contracts
- Production-content visual review: KO home and Tokamak project detail checked at
  1440 pixels; KO home checked at 390 pixels with no clipping or horizontal overflow
- Formatting and `git diff --check`: passed
- `npm audit --audit-level=low`: 0 vulnerabilities
- Full repository `npm run verify`: passed

### Root production

- GitHub Pages workflow run `30327485908`: passed
- Public root, KO/EN home, KO/EN Tokamak project detail, social card, sitemap,
  robots, compatibility redirects, 404 behavior, and Person JSON-LD: 17/17
  checks passed against cache-busted production responses
- Root-to-Tokamak links, both localized calculus articles, and the shared
  Tokamak-to-root Person identity: 5/5 integration checks passed
- Root Pages API after deployment: `status=built`, `build_type=workflow`
- The retired `/publications/` route returns 404; the legacy calculus route
  returns the approved noindex redirect document to the live Tokamak article

### Tokamak artifact

- Svelte/TypeScript diagnostics: 0 errors, 0 warnings
- Vitest: 37 passed
- Playwright: 41 passed
- Content catalog: 11 published LearningNodes and 22 localized post resources
- Static route contract: 82 routes
- Rewritten calculus math rendering: KO and EN each contain 17 display and 58
  inline expressions with no KaTeX errors
- The authorship link, structured data, and same-origin/base-path contracts are
  included in the verified deployed artifact.
- Actions build, Pages deployment, and post-deployment live checks passed.

## CP3 execution contract

The minimal public seed approval, full local verification, production-content
visual review, CP3 approval, and production cutover are complete. The execution
order was:

1. deploy Tokamak first;
2. verify both KO and EN calculus target URLs in the live environment;
3. enable the root legacy calculus redirect only after those checks pass;
4. run the final root checks and perform the root GitHub Pages cutover.

All four steps completed in order. Step 4 deployed only from the default branch
through the manual workflow with `cp3_approved: true`, and that workflow
repeated the complete release validation before uploading the Pages artifact.
The legacy `gh-pages` commit remains the documented rollback source.

No inferred education, employment, location, email, collaborator, or impact
claim was added to satisfy the seed gate.
