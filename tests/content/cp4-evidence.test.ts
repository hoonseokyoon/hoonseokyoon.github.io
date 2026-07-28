import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const evidence = JSON.parse(
  readFileSync(new URL('../../docs/migration/evidence/cp4-settings-readback-2026-07-28.json', import.meta.url), 'utf8')
);

const expectedProtection = {
  requiredStatusChecks: {
    strict: true,
    checks: [{ context: 'Release verification', appId: 15368 }]
  },
  requiredPullRequestReviews: {
    dismissStaleReviews: false,
    requireCodeOwnerReviews: false,
    requireLastPushApproval: false,
    requiredApprovingReviewCount: 0
  },
  enforceAdmins: false,
  requiredLinearHistory: false,
  allowForcePushes: false,
  allowDeletions: false,
  blockCreations: false,
  requiredConversationResolution: true,
  lockBranch: false,
  allowForkSyncing: false
};

describe('CP4 external-settings evidence', () => {
  it('keeps the redacted capture metadata and exact shared protection contract', () => {
    expect(evidence.schemaVersion).toBe(1);
    expect(evidence.capture).toEqual({
      capturedAt: '2026-07-28T06:43:11Z',
      githubApiVersion: '2026-03-10',
      normalization:
        'Allowlisted non-secret contract fields from GitHub REST responses; credentials, actors, permission grants, and mutable API URLs omitted'
    });
    expect(evidence.repositories.root.branchProtection).toEqual(expectedProtection);
    expect(evidence.repositories.tokamak.branchProtection).toEqual(expectedProtection);
    expect(evidence.repositories.root.repositoryRulesets).toEqual([]);
    expect(evidence.repositories.tokamak.repositoryRulesets).toEqual([]);
  });

  it('preserves the exact Pages and environment-policy readback for both repositories', () => {
    expect(evidence.repositories.root).toMatchObject({
      repository: 'hoonseokyoon/hoonseokyoon.github.io',
      visibility: 'public',
      defaultBranch: 'master',
      defaultBranchSha: '05cb87b78ada2b27e1991d52f8b0f75fe93f7409',
      pages: { buildType: 'workflow', source: { branch: 'gh-pages', path: '/' }, status: 'built' },
      pagesEnvironment: {
        deploymentBranchPolicy: { protectedBranches: false, customBranchPolicies: true },
        allowedBranches: [
          { name: 'gh-pages', type: 'branch' },
          { name: 'master', type: 'branch' }
        ]
      }
    });
    expect(evidence.repositories.tokamak).toMatchObject({
      repository: 'hoonseokyoon/tokamak',
      visibility: 'private',
      defaultBranch: 'main',
      defaultBranchSha: '269330cdd54f677a04ab53cd26b929cac75bd4a4',
      pages: { buildType: 'workflow', source: { branch: 'main', path: '/docs' }, status: 'built' },
      pagesEnvironment: {
        deploymentBranchPolicy: { protectedBranches: false, customBranchPolicies: true },
        allowedBranches: [{ name: 'main', type: 'branch' }]
      }
    });
  });
});
