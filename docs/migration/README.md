# Personal site and Tokamak migration

Status: **CP1–CP4 complete; both sites live; CP4 operations verified**

Audit date: **2026-07-28 (Asia/Seoul)**

CP1 approval date: **2026-07-28 (Asia/Seoul)**

CP2 approval date: **2026-07-28 (Asia/Seoul)**

CP3 approval date: **2026-07-28 (Asia/Seoul)**

CP4 proposal date: **2026-07-28 (Asia/Seoul)**

CP4 approval date: **2026-07-28 (Asia/Seoul)**

CP4 completion date: **2026-07-28 (Asia/Seoul)**

This directory records the decisions required to replace the al-folio site at
`https://hoonseokyoon.github.io/` with a first-party personal-history site and
connect it to the knowledge site at `https://hoonseokyoon.github.io/tokamak/`.

The documents are deliberately separated by decision responsibility:

1. [`01-content-ownership.md`](01-content-ownership.md) defines which site owns
   each kind of content and how the sites may refer to each other.
2. [`02-legacy-route-plan.md`](02-legacy-route-plan.md) inventories the current
   public surface and proposes a disposition for every route family.
3. [`legacy-sitemap-paths.txt`](legacy-sitemap-paths.txt) is the exact 80-path
   sitemap snapshot used by the route audit.
4. [`03-source-inventory.md`](03-source-inventory.md) separates confirmed or
   reviewable personal-source candidates from template and unsupported claims.
5. [`04-information-architecture.md`](04-information-architecture.md) defines
   the concrete bilingual root routes, page responsibilities, and final legacy
   compatibility behavior.
6. [`05-content-schema.md`](05-content-schema.md) defines the first-party
   Person, TimelineEvent, Project, Output, provenance, locale, and cross-site
   linking contract.
7. [`06-implementation-status.md`](06-implementation-status.md) records the
   post-CP2 implementation, production cutover, verification evidence, and
   rollback point.
8. [`07-post-cutover-operations.md`](07-post-cutover-operations.md) defines the
   approved repeatable publication, live-verification, branch-protection, and
   rollback contract for CP4 and records its completed execution evidence.
9. [`evidence/cp4-settings-readback-2026-07-28.json`](evidence/cp4-settings-readback-2026-07-28.json)
   preserves the normalized, non-secret branch-protection, Pages, and
   environment-policy readback captured at CP4 completion.
10. [`08-knowledge-link-readiness.md`](08-knowledge-link-readiness.md) records
    the post-CP4 public-projection, UI, and live-audit capability boundary before
    any real personal-record relationship is published.

## Safety boundary after CP2

CP1 approves the ownership and legacy-audit contracts. CP2 approves the
root-site information architecture, source policy, content schema, locale rules,
and deferred-route decisions. Work through CP2 did **not**:

- delete or move content;
- add redirects;
- change either site's navigation, schema, build, or deployment;
- change GitHub Pages settings;
- push or deploy either repository.

## Checkpoints

| Checkpoint | Decision                                                                     | Status   |
| ---------- | ---------------------------------------------------------------------------- | -------- |
| CP1        | Approve the ownership contract and legacy-route dispositions                 | approved |
| CP2        | Approve root IA, source policy, schema, locale, and deferred-route decisions | approved |
| CP3        | Approve production cutover after route, visual, and live checks              | approved |
| CP4        | Approve the repeatable post-cutover operating and branch-protection contract | approved |

The approved CP2 contracts now constrain the implementation phase. No new
application code, content records, redirects, or Tokamak behavior changes were
included in the checkpoint itself.

## Current implementation state

The initial public seed is approved: one Person, TimelineEvent, Project, and
Output record is `published`, and the release content validator passes. The
first-party root application, route policy, guarded deployment workflow, and
social-preview asset now form the live root site. The Tokamak identity link and
rewritten KO/EN calculus article were deployed first, and both live article URLs
were verified before the root calculus redirect gate was enabled.

The root full verification and real-content visual review passed before CP3.
The final cutover completed through the guarded default-branch workflow, and
the live root checks plus cross-site integration checks passed. The legacy
`gh-pages` commit remains the rollback point. See `06-implementation-status.md`
for the validation evidence and execution record.

CP4 is complete. Tokamak now has an independent PR `Release verification`
workflow, and the root operations implementation provides exact-release
freshness, post-deployment live checks, and a reusable manual publication gate.
Equivalent default-branch protection was applied and read back on both
repositories after their exact default-branch checks succeeded. The first CP4
root publication deployed its exact merge SHA and passed all 115 live probes
without retry. See `07-post-cutover-operations.md` and the linked settings
snapshot for the permanent evidence. New personal facts remain gated by a
separate explicit content approval.

Post-CP4 knowledge-link readiness now covers published TimelineEvent, Project,
and Output projection, conditional UI, and catalog-derived release probing
without runtime or ordinary-build coupling to Tokamak. Production
`knowledgeLinks` remain empty: the first target, relationship, and public label
require the next explicit content checkpoint. The Tokamak ODE series is a review
candidate only, not an approved or published relationship. See
`08-knowledge-link-readiness.md` for the exact boundary.
