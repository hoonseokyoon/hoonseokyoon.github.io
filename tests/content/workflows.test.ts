import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const root = fileURLToPath(new URL('../..', import.meta.url));

function workflow(name: string) {
  return parse(readFileSync(`${root}/.github/workflows/${name}`, 'utf8')) as Record<string, any>;
}

describe('repository workflows', () => {
  it('keeps Pages deployment manual and explicitly CP3-gated', () => {
    const pages = workflow('pages.yml');
    expect(Object.keys(pages.on)).toEqual(['workflow_dispatch']);
    expect(pages.on.workflow_dispatch.inputs.cp3_approved).toMatchObject({
      required: true,
      type: 'boolean',
      default: false
    });
    expect(pages.jobs.build.if).toContain('inputs.cp3_approved');
    expect(pages.jobs.build.steps.some((step: any) => step.run === 'npm run verify')).toBe(true);
    expect(pages.jobs.build.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uses: 'actions/configure-pages@v6' }),
        expect.objectContaining({
          uses: 'actions/upload-pages-artifact@v5',
          with: expect.objectContaining({ path: './build', 'include-hidden-files': true })
        })
      ])
    );
    expect(pages.jobs.deploy.steps).toEqual(
      expect.arrayContaining([expect.objectContaining({ uses: 'actions/deploy-pages@v5' })])
    );
  });

  it('runs release verification in CI without legacy build tooling', () => {
    const ciSource = readFileSync(`${root}/.github/workflows/ci.yml`, 'utf8');
    const ci = parse(ciSource) as Record<string, any>;
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
