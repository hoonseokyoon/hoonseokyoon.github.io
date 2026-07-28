import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../..', import.meta.url));

function workflow(name: string) {
  return parse(readFileSync(`${root}/.github/workflows/${name}`, 'utf8')) as Record<string, any>;
}

function stepIndex(steps: Array<Record<string, any>>, predicate: (step: Record<string, any>) => boolean) {
  return steps.findIndex(predicate);
}

describe('repository workflows', () => {
  it('publishes only an approved exact default-branch revision and verifies the deployed SHA', () => {
    const source = readFileSync(`${root}/.github/workflows/pages.yml`, 'utf8');
    const pages = parse(source) as Record<string, any>;

    expect(Object.keys(pages.on)).toEqual(['workflow_dispatch']);
    expect(pages.on.workflow_dispatch.inputs.publish_approved).toMatchObject({
      required: true,
      type: 'boolean',
      default: false
    });
    expect(source).not.toContain('cp3_approved');
    expect(pages.permissions).toBeUndefined();
    expect(pages.concurrency).toEqual({ group: 'github-pages', 'cancel-in-progress': false });

    const validate = pages.jobs.validate;
    expect(validate.name).toBe('Validate publication request');
    expect(validate.if).toBeUndefined();
    expect(validate.permissions).toEqual({ contents: 'read' });
    const validationStep = validate.steps[0];
    expect(validationStep.env).toMatchObject({
      PUBLISH_APPROVED: '${{ inputs.publish_approved }}',
      SOURCE_REF_NAME: '${{ github.ref_name }}',
      SOURCE_REF_TYPE: '${{ github.ref_type }}',
      DEFAULT_BRANCH: '${{ github.event.repository.default_branch }}',
      SOURCE_SHA: '${{ github.sha }}',
      ORIGINAL_ACTOR: '${{ github.actor }}',
      TRIGGERING_ACTOR: '${{ github.triggering_actor }}',
      RUN_ATTEMPT: '${{ github.run_attempt }}'
    });
    expect(validationStep.run).toContain('publish_approved must be true');
    expect(validationStep.run).toContain(
      'if [[ "$SOURCE_REF_TYPE" != "branch" || "$SOURCE_REF_NAME" != "$DEFAULT_BRANCH" ]]; then'
    );
    expect(validationStep.run).toContain('original_actor=$ORIGINAL_ACTOR');
    expect(validationStep.run).toContain('triggering_actor=$TRIGGERING_ACTOR');
    expect(validationStep.run).toContain('run_attempt=$RUN_ATTEMPT');
    expect(validationStep.run).toContain('dispatched_at=');
    expect(validationStep.run).toContain('publish_approved=$PUBLISH_APPROVED');
    expect(validationStep.run).toContain('source_sha=$SOURCE_SHA');

    const build = pages.jobs.build;
    expect(build.needs).toBe('validate');
    expect(build['timeout-minutes']).toBe(20);
    expect(build.permissions).toEqual({ contents: 'read', pages: 'read' });
    expect(build.steps[0]).toMatchObject({
      uses: 'actions/checkout@v6',
      with: { ref: '${{ github.sha }}' }
    });
    expect(build.steps[1].run).toBe('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"');
    const verifyIndex = stepIndex(build.steps, (step) => step.run === 'npm run verify');
    const markerIndex = stepIndex(
      build.steps,
      (step) => step.run === 'npm run write:release-marker -- --sha "$GITHUB_SHA"'
    );
    const uploadIndex = stepIndex(build.steps, (step) => step.uses === 'actions/upload-pages-artifact@v5');
    expect(verifyIndex).toBeGreaterThan(-1);
    expect(markerIndex).toBeGreaterThan(verifyIndex);
    expect(uploadIndex).toBeGreaterThan(markerIndex);
    expect(build.steps[uploadIndex].with).toMatchObject({ path: './build', 'include-hidden-files': true });

    const deploy = pages.jobs.deploy;
    expect(deploy.needs).toBe('build');
    expect(deploy.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
    expect(deploy.outputs.page_url).toBe('${{ steps.deployment.outputs.page_url }}');
    expect(deploy.steps).toEqual(
      expect.arrayContaining([expect.objectContaining({ uses: 'actions/deploy-pages@v5' })])
    );

    const live = pages.jobs['verify-live'];
    expect(live.name).toBe('Verify deployed root and cross-site contracts');
    expect(live.needs).toBe('deploy');
    expect(live['timeout-minutes']).toBe(30);
    expect(live.permissions).toEqual({ contents: 'read' });
    expect(live.steps[0]).toMatchObject({
      uses: 'actions/checkout@v6',
      with: { ref: '${{ github.sha }}' }
    });
    expect(live.steps[1].run).toBe('test "$(git rev-parse HEAD)" = "$GITHUB_SHA"');
    expect(live.steps.some((step: any) => step.run === 'npm ci')).toBe(true);
    expect(source).not.toContain('npm ci --ignore-scripts');
    const liveStep = live.steps.find((step: any) => step.run?.startsWith('npm run check:live'));
    expect(liveStep).toMatchObject({
      env: {
        LIVE_BASE: '${{ needs.deploy.outputs.page_url }}',
        EXPECTED_SHA: '${{ github.sha }}'
      }
    });
    expect(liveStep.run).toContain('--expected-sha "$EXPECTED_SHA"');
  });

  it('runs release verification in CI without legacy build tooling', () => {
    const ciSource = readFileSync(`${root}/.github/workflows/ci.yml`, 'utf8');
    const ci = workflow('ci.yml');
    expect(ci.jobs.verify.steps.some((step: any) => step.run === 'npm run verify')).toBe(true);
    expect(ci.jobs.verify.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uses: 'actions/checkout@v6' }),
        expect.objectContaining({ uses: 'actions/setup-node@v6' })
      ])
    );
    expect(ciSource).not.toMatch(/jekyll|ruby|docker/i);
  });
});
