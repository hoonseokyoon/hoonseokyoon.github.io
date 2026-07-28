# Knowledge-link publication readiness

Status: **post-CP4 capability implemented; relationship content not approved**

Implementation date: **2026-07-28 (Asia/Seoul)**

## Purpose

CP2 approved typed `knowledgeLinks` from root TimelineEvent, Project, and Output
records to canonical Tokamak URLs. This post-CP4 slice completes the dormant
publication path without asserting a new relationship:

1. published records retain only their localized public link projection;
2. timeline, project, and output UI can render the relation and optional label;
3. empty link arrays render no related-knowledge block; and
4. the guarded post-deployment audit probes targets derived from published
   `knowledgeLinks`.

This is readiness work, not a content migration. The production TimelineEvent,
Project, and Output records still use `knowledgeLinks: []`.

## Publication boundary

The capability preserves the existing separation between the two sites:

- the root catalog explicitly owns each cross-site reference and relation;
- Tokamak remains canonical for the linked knowledge resource;
- the root site does not import Tokamak's project graph, taxonomy, or content;
- validation, tests, and the ordinary build use local catalog data only;
- no runtime API or browser fetch is added; and
- this slice changes neither the Tokamak repository nor its deployed behavior.

Network reachability is checked only by the release live audit after the root
artifact is deployed. A Tokamak outage therefore cannot make an ordinary root
build nondeterministic, while a newly published broken relationship still fails
the publication verification.

No personal fact, chronology, role, contribution, or project outcome is added or
changed by this work. Rendering a relation such as `applied` or `produced` would
itself make a public claim, so an implemented field is not permission to fill it.

## First relationship checkpoint

The next explicit content checkpoint must approve all of the following before
the first production link is added:

1. the exact published TimelineEvent, Project, or Output record;
2. the existing canonical Tokamak target and its declared route kind;
3. the semantic relation: `background`, `applied`, `produced`, or `documents`;
4. the locale URL pair or approved single-locale fallback;
5. any KO/EN public label; and
6. evidence or direct user confirmation supporting the relationship claim.

The Tokamak ODE series is only a candidate inventory for that review. This
document does not approve an ODE URL, associate the series with any production
personal record, or assign it a relation label. No such link should be inferred
or published before the checkpoint above.

## Release acceptance

The readiness slice is acceptable when automated checks demonstrate that:

- TimelineEvent, Project, and Output links survive published-only public
  projection with correct locale fallback;
- each record surface renders relation text, optional labels, external-link
  semantics, and actual-language markup without an empty-state panel;
- the live plan includes every unique Tokamak target declared by published
  records and ignores draft-only relationship content;
- ordinary validation and build execution do not contact Tokamak; and
- the production catalog remains unchanged with respect to relationship links.

The first real link must then follow the dependency order in
[`07-post-cutover-operations.md`](07-post-cutover-operations.md): ensure the
Tokamak target is deployed and verified before publishing the root reference.
