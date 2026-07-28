# Post-cutover operations contract

Status: **CP4 complete; activation release verified**

Proposal date: **2026-07-28 (Asia/Seoul)**

Approval date: **2026-07-28 (Asia/Seoul)**

Completion date: **2026-07-28 (Asia/Seoul)**

## Purpose

CP3 completed the one-time production cutover. The root personal site and
Tokamak are live, their shared Person identity is connected, and the legacy root
artifact remains recoverable.

At proposal capture time, the root deployment workflow was still expressed as a
cutover workflow:

- `.github/workflows/pages.yml` accepts only `workflow_dispatch`;
- its approval input is named `cp3_approved`;
- it verifies and deploys the artifact, but has no reusable post-deployment live
  verification job.

CP4 approved the repeatable operating contract that replaces this one-time
gate. Implementation and external settings were completed through reviewed pull
requests, with branch protection and production publication applied only after
their prerequisite default-branch checks succeeded. The execution record below
captures the permanent GitHub evidence and API readback.

## Captured pre-implementation baseline

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
- Independent pull-request verification workflow: `.github/workflows/ci.yml`
- Observed PR and default-branch check: `Release verification`
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

The original actor, triggering actor, run attempt, timestamp, input, source SHA,
and workflow URL form the publication audit record, including on a workflow
rerun. `publish_approved` authorizes deployment of an already reviewed revision;
it never authorizes adding or inferring personal facts.

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

The production checker accepts only the exact trusted root origin
`https://hoonseokyoon.github.io/`. It rejects credentials, ports, query strings,
fragments, alternate hostnames, and non-root base paths. Derived targets are
checked against the same origin before every request, and redirects remain
manual so a response cannot silently move verification to an untrusted host.

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
  `https://hoonseokyoon.github.io/#person`;
- every published Root `knowledgeLinks` target to be included in the controlled
  Tokamak page and sitemap plan; and
- a bilingual Tokamak Project target explicitly marked `reciprocal: true` by a
  Root Project relation to contain exactly one same-locale Root Project backlink
  and no opposite-locale Project backlink.

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

The workflow is successful only when this final job passes. The live job runs
after the artifact is already public, so the sequence is not a transactional
deployment and a live-check failure requires explicit correction or rollback.
The live-verification job reserves 30 minutes so the bounded release-marker
preflight and bounded probe retries can finish with an aggregated result.

Keep the `github-pages` concurrency group and `cancel-in-progress: false` so an
in-flight publication is not cancelled. This setting does not guarantee FIFO
ordering; the operator must dispatch only one approved publication at a time.

## Tokamak pull-request and deployment contract

Tokamak keeps its existing post-merge sequence:

```text
main push → build → deploy → Verify deployed site
```

Tokamak PR #67 added `.github/workflows/ci.yml` before protecting `main`, with:

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
before protection is enabled. Root PR #3 completed a recognized Codex review
cycle before merge; a missing review bot is never treated as approval.

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

If classic branch protection on the private Tokamak repository returns a plan
entitlement error, stop and record the 403 response. Do not weaken the contract,
make the repository public, or substitute an unreviewed rule. Root `gh-pages`
remains an intentionally unprotected rollback artifact; preserve its exact SHA
checks and never use it as an ordinary publication branch.

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

- local source tag `legacy-al-folio-990479f` at
  `990479f86fc85ab72f15248b04b87bc04146aea2`;
- legacy Pages artifact `gh-pages` commit
  `ff96ac64f9315ece3e5cf0b458ae42a4ccd2ffe7`.

Emergency recovery requires explicit approval at the time of recovery, exact
SHA and target confirmation, and a settings capture before changing anything.
Set Pages to `build_type=legacy` with `source.branch=gh-pages` and
`source.path=/`, then read back both the build type and source before running a
recovery-specific live check. Returning to normal publishing requires restoring
and reading back `build_type=workflow`, followed by a normal approved manual
publication and complete live check. Stale `source=gh-pages:/` metadata by
itself is not evidence that legacy publishing is active. The recovery tag and
branch remain intact throughout.

Tokamak rollback uses a reviewed revert to `main`; its normal deployment and
`Verify deployed site` jobs must pass.

## CP4 approval record

The user's unqualified CP4 approval on 2026-07-28 accepted all four decisions:

1. Keep root deployment manual and replace `cp3_approved` with the reusable
   `publish_approved` gate.
2. Add the release marker, catalog-derived live checks, controlled Tokamak
   checks, and manual rollback policy.
3. Require PRs, up-to-date `Release verification`, resolved conversations, and
   force-push/deletion blocking on both default branches, with zero mandatory
   human approvals initially and an emergency owner bypass.
4. Keep Tokamak's automatic `main` deployment while adding an independent PR
   `Release verification` workflow.

## CP4 execution record

All timestamps below are from 2026-07-28. No personal content, Pages environment
policy, rollback asset, or license decision changed during this execution.

### Reviewed implementation

- Tokamak [PR #67](https://github.com/hoonseokyoon/tokamak/pull/67)
  introduced independent PR verification and merged as
  `269330cdd54f677a04ab53cd26b929cac75bd4a4`. Its
  [post-merge `Release verification`](https://github.com/hoonseokyoon/tokamak/actions/runs/30332244171)
  and [Pages/live verification](https://github.com/hoonseokyoon/tokamak/actions/runs/30332244167)
  succeeded.
- Root [PR #4](https://github.com/hoonseokyoon/hoonseokyoon.github.io/pull/4)
  implemented the durable publication workflow, release marker, and live
  checker. The final
  [Codex review](https://github.com/hoonseokyoon/hoonseokyoon.github.io/pull/4#issuecomment-5100722677)
  found no major issues, the PR check succeeded, and the PR merged as
  `05cb87b78ada2b27e1991d52f8b0f75fe93f7409`.
- The exact Root merge SHA passed the default-branch
  [`Release verification`](https://github.com/hoonseokyoon/hoonseokyoon.github.io/actions/runs/30334961235)
  before any protection or publication mutation.

### Protection and Pages readback

Classic branch protection was applied and read back on Root `master` and
Tokamak `main` with the same contract:

- strict, up-to-date status checks;
- app-bound `Release verification` from GitHub Actions app ID `15368`;
- pull requests and resolved review conversations required;
- zero mandatory numeric approvals initially;
- force pushes and deletion disabled;
- admin enforcement disabled for the approved emergency owner bypass.

The normalized, allowlisted REST response fields captured at
`2026-07-28T06:43:11Z` are preserved as
[`cp4-settings-readback-2026-07-28.json`](./evidence/cp4-settings-readback-2026-07-28.json).
The snapshot includes default-branch SHAs, empty repository-ruleset lists,
branch protection, Pages configuration, and Pages environment branch policies.
It omits credentials, actors, permission grants, and mutable API URLs.

After protection, Root Pages still reported `build_type=workflow`; its stale
`source=gh-pages:/` metadata was not treated as active legacy publishing, and
the `github-pages` environment still allowed only `master` and rollback branch
`gh-pages`. Tokamak Pages still reported `build_type=workflow`, source
`main:/docs`, and an environment policy limited to `main`.

### Activation publication

The approved Root
[manual publication run](https://github.com/hoonseokyoon/hoonseokyoon.github.io/actions/runs/30335102612)
deployed exact SHA `05cb87b78ada2b27e1991d52f8b0f75fe93f7409` as Pages
deployment `5635203446`. The final
[cross-site live job](https://github.com/hoonseokyoon/hoonseokyoon.github.io/actions/runs/30335102612/job/90198442768)
verified all 115 probes with zero retries and observed the release marker on its
first preflight request. Independent cache-busted readback confirmed the exact
marker bytes, expected MIME types, controlled Root and Tokamak routes, and a 404
for the unique missing route.

## Execution boundary after approval

CP4 authorizes only the operating changes listed in this contract. Personal
facts and other public content, the license, Tokamak's parked design contract,
hosting, environment-policy changes, rollback-asset mutation, and automatic
rollback remain outside scope. Any later content publication still requires its
own explicit content approval; the first reciprocal relationship has the
separate approval and evidence recorded in `08-knowledge-link-readiness.md`.
