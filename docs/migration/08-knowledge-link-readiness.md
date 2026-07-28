# First reciprocal knowledge relationship

Status: **first relationship approved and implemented; guarded publication required**

Implementation date: **2026-07-28 (Asia/Seoul)**

## Purpose

The post-CP4 readiness slice established typed `knowledgeLinks`, localized
public projection, conditional UI, and catalog-derived live probes without
publishing a relationship. The first approved relationship now uses that path:

- root owner: personal Project `tokamak`;
- relation: `produced`;
- canonical Tokamak target: the Ordinary Differential Equations SubProject;
- KO label: `상미분방정식 6부작`;
- EN label: `Six-part ODE series`; and
- reciprocal owner in Tokamak: `personalProjectId: tokamak` on the ODE
  SubProject.

The exact localized pair is:

```text
https://hoonseokyoon.github.io/ko/projects/tokamak/
  ↔ https://hoonseokyoon.github.io/tokamak/ko/projects/ordinary-differential-equations/

https://hoonseokyoon.github.io/en/projects/tokamak/
  ↔ https://hoonseokyoon.github.io/tokamak/en/projects/ordinary-differential-equations/
```

## Publication evidence and order

The relationship is supported by the existing dated user confirmation on the
published Project, the deployed Tokamak canonical output, and Tokamak merge
commit `258e7522e1272b5d3cabe9c772bd8cd570b1ae78`. Tokamak PR `#68` introduced
the locale-matched reciprocal Project link and was deployed before this Root
reference was prepared.

The release order remains dependency-safe:

1. merge and deploy Tokamak;
2. pass Tokamak artifact, browser, route, and post-deployment checks;
3. verify both localized ODE targets and their reciprocal Root hrefs;
4. merge the Root relation through a reviewed pull request; and
5. manually publish the exact Root default-branch SHA with
   `publish_approved: true`.

The Root build remains deterministic. Schema validation, unit tests, browser
tests, and ordinary static generation use local catalog data only; they do not
fetch Tokamak. Network reachability and reciprocity are checked only by the
bounded post-deployment live audit.

## Public and validation contract

- The production Root Project stores both canonical locale URLs but public page
  data contains only the requested locale target and label.
- The Root Project detail renders one named related-knowledge panel; an empty
  `knowledgeLinks` array still renders no panel on other record surfaces.
- The Tokamak ODE page renders one static, same-tab anchor to the matching Root
  Project and does not expose the opposite-locale Project URL.
- Both links remain usable without JavaScript and at a 320-pixel viewport.
- Root URL validation rejects alternate origins, credentials, ports, queries,
  fragments, encoded traversal, weak path shapes, locale mismatch, and
  duplicate knowledge URLs within one record.
- Tokamak validation accepts only manifest-owned Root Project URLs and requires
  every approved locale URL to have exactly one published SubProject owner.
- The Root live plan derives the two ODE targets from the published catalog,
  increasing the controlled plan from 115 to 117 probes and the Tokamak page
  subset from 5 to 7.
- Each ODE live probe requires exactly one matching Root Project backlink and
  rejects the opposite-locale backlink; the Tokamak live checker independently
  enforces the same relationship from the other repository.

## Ownership boundary

Root remains canonical for the personal Project, role, dates, and outputs.
Tokamak remains canonical for the ODE knowledge structure and its six articles.
Neither repository copies the other's body content or imports its runtime
graph. The relationship is a typed navigation edge, not `sameAs`, and does not
add claims about education, employment, collaborators, impact, or outcomes.

Future relationships must repeat the same content decision: exact owner,
canonical target, relation, locale pair or explicit fallback, public label, and
evidence. The existence of this first link does not authorize filling other
production `knowledgeLinks` arrays by inference.
