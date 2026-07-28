# Post-cutover operations proposal

Status: **proposed at CP4; operational changes are blocked pending approval**

Proposal date: **2026-07-28 (Asia/Seoul)**

## Purpose

CP3 completed the one-time production cutover. The root personal site and
Tokamak are live, their shared Person identity is connected, and the legacy root
artifact remains recoverable.

The root deployment workflow is still expressed as a cutover workflow:

- `.github/workflows/pages.yml` accepts only `workflow_dispatch`;
- its approval input is named `cp3_approved`;
- it verifies and deploys the artifact, but has no reusable post-deployment live
  verification job.

CP4 decides the repeatable operating contract that replaces this one-time gate.
This proposal records the decision surface; it does not authorize implementation
or external settings changes by itself.

## Current operational baseline

### Root personal site

- Default branch: `master`
- PR workflow: `.github/workflows/ci.yml`
- Observed PR check: `Release verification`
- Deployment workflow: `.github/workflows/pages.yml`
- Deployment trigger: manual `workflow_dispatch`
- Current deployment input: `cp3_approved`
- Local release command: `npm run verify`
- Pages build type: `workflow`
- Pages environment branch policy: `master` and rollback branch `gh-pages`
- Default-branch protection or repository ruleset: none
- Reusable post-deployment checker: none

### Tokamak

- Default branch: `main`
- Deployment workflow: `.github/workflows/pages.yml`
- Deployment trigger: push to `main`, plus manual dispatch
- Post-merge jobs: `build`, `deploy`, and `Verify deployed site`
- Live command: `npm run check:live -- --base "$LIVE_BASE"`
- Independent pull-request verification workflow: none
- Pages environment branch policy: `main`
- Default-branch protection or repository ruleset: none

The existing Pages environment policies constrain deployment sources and must
remain in place.

## CP4 scope

CP4 covers only the repeatable post-cutover operating model:

1. replace the root workflow's one-time `cp3_approved` gate with a durable
   publication confirmation;
2. add root post-deployment freshness, route, identity, and controlled
   cross-site verification;
3. keep Tokamak's automatic deployment and live verification after `main`
   changes;
4. add an independent Tokamak pull-request verification workflow;
5. protect both default branches with pull-request and successful-CI
   requirements;
6. define deployment ordering, failure classification, rollback, and evidence
   recording;
7. update tests and operating documentation to enforce this contract.

## Non-scope

CP4 does not authorize:

- new or changed Person, TimelineEvent, Project, or Output records;
- publication of email, location, education, employment, collaborators, roles,
  outcomes, or impact claims;
- changes to the approved content schema, information architecture, locale
  behavior, or legacy-route dispositions;
- search, feeds, CMS features, analytics, runtime repository fetching, or a
  shared component package;
- changes to Tokamak taxonomy or its parked `validate:design` contract;
- a hosting move, custom domain, or Pages platform replacement;
- removal or rewriting of `gh-pages`, recovery tags, or rollback commits;
- automatic rollback;
- a license change.

The root license remains a separate explicit decision.

## Root publication contract

The root remains manually published after a reviewed change reaches `master`.
A source merge and a production publication remain separate events.

### Durable manual gate

`.github/workflows/pages.yml` continues to expose only `workflow_dispatch`; a
push must not deploy the root automatically. Replace the one-time input with:

```yaml
publish_approved:
  description: Confirm that this exact default-branch revision is approved for public deployment
  required: true
  type: boolean
  default: false
```

A validation job fails visibly instead of silently skipping work when:

- `publish_approved` is not `true`;
- the selected ref is not the repository default branch;
- the revision to be packaged is not the selected workflow revision.

The actor, timestamp, input, source SHA, and workflow URL form the publication
audit record. `publish_approved` authorizes deployment of an already reviewed
revision; it never authorizes adding or inferring personal facts.

### Release freshness marker

After `npm run verify` and before artifact upload, the workflow writes:

```text
build/.well-known/release.json
```

with deterministic public data only:

```json
{ "commit": "<40-character-lower-case-Git-SHA>" }
```

The live checker must compare this value with the exact workflow source SHA. A
generic 200 response is not sufficient evidence that the requested artifact is
live.

## Root live verification contract

The implementation adds:

- `scripts/check-live.ts`;
- `tests/check-live.test.ts`;
- a `check:live` package script;
- a deterministic release-marker writer and unit test;
- workflow and build-integrity expectations.

The production command is:

```bash
npm run check:live -- --base <pages-url> --expected-sha <git-sha>
```

Network access remains outside ordinary `npm run verify`. Unit tests use an
injected fetch implementation; only post-deployment verification contacts the
public sites.

### Retry boundary

Follow the existing Tokamak live checker pattern:

- cache-busting requests and `cache: no-store`;
- bounded request timeouts and concurrency;
- three per-route attempts with backoff;
- a bounded preflight window for the exact release marker;
- `redirect: manual` while inspecting static compatibility documents;
- one aggregated failure report with route, URL, status, attempts, and reason.

Retries must not become an indefinite monitor.

### Required root assertions

Expected routes come from `loadCatalogFromDisk()` and `canonicalRoutes()` rather
than a hard-coded page count. The checker requires:

- the exact release SHA at `/.well-known/release.json`;
- every localized canonical route to return a complete SvelteKit document with
  the expected language, canonical, KO/EN/`x-default` alternates, social card,
  and no Jekyll, al-folio, or private-repository leakage;
- `/` to remain a 200 noindex static redirect to `/ko/` with canonical and
  visible fallback link;
- the custom 404 document and a unique nonexistent route to retain 404/noindex
  behavior;
- `/social-card.png` to remain a valid 1731x909 PNG;
- `/sitemap.xml` to match the catalog-derived canonical set exactly and exclude
  compatibility routes;
- `/robots.txt` to advertise exactly the root and Tokamak sitemaps;
- the Person, WebSite, Project, and Output structured-data IDs and author
  references to use the shared root Person identity;
- built page payloads to omit internal evidence, editorial fields, contributor
  internals, and unselected locale prose.

### Compatibility and cross-site assertions

Compatibility expectations come from
`tests/fixtures/legacy-route-policy.yml`, `loadRoutePolicy()`, and
`redirectIsActive()`:

- every active redirect returns a 200 noindex document with the exact refresh,
  canonical, and fallback-link destination;
- inactive and removed routes return 404;
- local targets and declared fragments exist;
- active `/tokamak/` destinations return 200 and are self-canonical.

Controlled cross-site verification also requires:

- locale-matching root links to the Tokamak KO and EN homes;
- both localized calculus articles and the Tokamak sitemap to be reachable;
- calculus articles to expose the visible root author link;
- Tokamak WebSite and BlogPosting authorship to reference
  `https://hoonseokyoon.github.io/#person`.

The checker does not crawl unrelated third-party links or make an unrelated
external service outage fail a root release.

## Workflow ordering

The root workflow order becomes:

```text
Validate publication request
        ↓
Verify and package
        ↓
Deploy
        ↓
Verify deployed root and cross-site contracts
```

The deployment job exports `steps.deployment.outputs.page_url`. The final job
checks out the same source revision and runs:

```bash
npm run check:live -- --base "$LIVE_BASE" --expected-sha "$GITHUB_SHA"
```

The workflow is successful only when this final job passes. Keep the
`github-pages` concurrency group and `cancel-in-progress: false` so publications
cannot overtake one another.

## Tokamak pull-request and deployment contract

Tokamak keeps its existing post-merge sequence:

```text
main push → build → deploy → Verify deployed site
```

Before protecting `main`, add `.github/workflows/ci.yml` with:

- `pull_request` and push-to-`main` triggers;
- one stable job named `Release verification`;
- Node 22, `npm ci`, Playwright dependencies, and `npm run verify`;
- `contents: read` permission only.

Post-merge deployment checks cannot serve as PR-required checks because they do
not run against PR heads.

## Cross-repository deployment order

For a new or changed root link to Tokamak:

1. merge and deploy Tokamak;
2. require Tokamak `Verify deployed site` to pass;
3. verify the changed public target;
4. merge the root reference;
5. manually publish and verify the root release.

For removal of a Tokamak target:

1. remove or replace the root reference and publish the root first;
2. verify that no live root route depends on the target;
3. remove the Tokamak target.

## Default-branch protection contract

Apply equivalent protection to root `master` and Tokamak `main`:

- changes reach the default branch through pull requests;
- branches must be up to date before merge;
- the exact required check is `Release verification`;
- unresolved review conversations block merge;
- force pushes and branch deletion are blocked;
- no numeric human-approval requirement is added initially;
- the owner retains an emergency admin bypass that is not used for ordinary
  publication.

The required check must be observed successfully on the current default SHA
before protection is enabled. Root PR review integration must also be recognized
before the post-merge audit PR or this proposal is merged; a missing review bot
must not be disguised as an approval.

Safe application order after CP4 approval:

1. capture branch, ruleset, Pages, and environment-policy JSON for both repos;
2. implement and review root operations and Tokamak PR CI;
3. merge after successful existing verification;
4. confirm `Release verification` on both default branches;
5. apply and read back root protection;
6. confirm root Pages remains `build_type=workflow` and preserves `gh-pages` as
   rollback-only;
7. apply and read back Tokamak protection;
8. confirm Tokamak Pages remains restricted to `main`;
9. validate the next ordinary change through a PR, not a direct-push test.

## Failure and rollback contract

Before dispatch, record the merged SHA, PR, successful CI run, current Pages
state, last successful deployment, and any changed Tokamak targets.

If validation or packaging fails, production has not changed. Fix it in a new
PR rather than repeatedly dispatching the same revision.

If deployment succeeds but live verification fails:

1. preserve the workflow URL and assertion output;
2. classify stale artifact, root regression, changed cross-site contract, or
   independent Tokamak outage;
3. do not blindly redeploy the same SHA;
4. revert or correct first-party regressions through a reviewed PR.

Normal rollback is a revert or corrective PR followed by the same manual publish
and complete live checker. Never force-push or reset `master`.

Emergency legacy recovery retains:

- source tag `legacy-al-folio-990479f` at
  `990479f86fc85ab72f15248b04b87bc04146aea2`;
- legacy Pages artifact `gh-pages` commit
  `ff96ac64f9315ece3e5cf0b458ae42a4ccd2ffe7`.

Changing Pages back to `gh-pages:/` requires explicit approval at the time of
recovery, exact SHA and target confirmation, settings capture, and a
recovery-specific live check. The recovery tag and branch remain intact after
returning to workflow publishing.

Tokamak rollback uses a reviewed revert to `main`; its normal deployment and
`Verify deployed site` jobs must pass.

## CP4 approval questions

CP4 requires explicit approval of all four decisions:

1. Keep root deployment manual and replace `cp3_approved` with the reusable
   `publish_approved` gate.
2. Add the release marker, catalog-derived live checks, controlled Tokamak
   checks, and manual rollback policy.
3. Require PRs, up-to-date `Release verification`, resolved conversations, and
   force-push/deletion blocking on both default branches, with zero mandatory
   human approvals initially and an emergency owner bypass.
4. Keep Tokamak's automatic `main` deployment while adding an independent PR
   `Release verification` workflow.

An unqualified `CP4 approved` accepts all four decisions. An exception must name
the numbered decision and its replacement behavior.

## Blocked until CP4 approval

Until approval, do not:

- change either deployment trigger or approval input;
- add or merge the root live checker or release marker;
- add the Tokamak PR workflow;
- create or modify branch protection, repository rulesets, Pages settings, or
  environment protection;
- dispatch a production deployment for this proposal;
- delete or rewrite rollback branches, tags, or artifacts;
- add personal facts or other public content;
- change the license or Tokamak's parked design-contract work.

The proposal may be reviewed. Operational implementation, settings changes,
merge, and deployment remain blocked at CP4.
