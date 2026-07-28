import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { loadCatalogFromDisk } from '../../src/lib/content/catalog.node';
import { parseCatalog } from '../../src/lib/content/parse';
import { legacyRedirects } from '../../src/lib/content/route-manifest';
import { PartialDateSchema } from '../../src/lib/content/schema';
import { localizedContent, publishedCatalog, sortedTimeline } from '../../src/lib/content/public';
import { validateCatalog } from '../../src/lib/content/validate';
import { fixtureCatalog } from '../fixtures/catalog';

describe('personal content catalog', () => {
  it('publishes the approved seed catalog', () => {
    const catalog = loadCatalogFromDisk();
    const publicCatalog = publishedCatalog(catalog);

    expect(catalog.person.editorialStatus).toBe('published');
    expect(publicCatalog.person?.id).toBe('hoonseok-yoon');
    expect(publicCatalog.timeline.map((record) => record.id)).toEqual(['tokamak-project']);
    expect(publicCatalog.projects.map((record) => record.id)).toEqual(['tokamak']);
    expect(publicCatalog.outputs.map((record) => record.id)).toEqual(['tokamak-sveltekit-site']);
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it('passes the release gate with the approved seed catalog', () => {
    expect(validateCatalog(loadCatalogFromDisk(), { requireReleaseContent: true })).toEqual([]);
  });

  it('accepts the complete synthetic release fixture', () => {
    expect(validateCatalog(fixtureCatalog, { requireReleaseContent: true })).toEqual([]);
  });

  it('falls back to the declared source locale without pretending to translate', () => {
    const localized = localizedContent(fixtureCatalog.outputs[0], 'ko');
    expect(localized.locale).toBe('en');
    expect(localized.isFallback).toBe(true);
    expect(localized.content.title).toContain('Fixture source package');
  });

  it('keeps ongoing timeline records first', () => {
    const historical = {
      ...fixtureCatalog.timeline[0],
      id: 'fixture-historical',
      period: { start: '2020', end: '2021' }
    };
    expect(sortedTimeline([historical, fixtureCatalog.timeline[0]]).map((event) => event.id)).toEqual([
      'fixture-project-period',
      'fixture-historical'
    ]);
  });

  it('emits compatibility redirects enabled by the approved catalog', () => {
    expect(legacyRedirects(loadCatalogFromDisk())).toEqual([
      { path: 'projects', target: '/en/projects/' },
      { path: 'blog', target: '/tokamak/en/' },
      { path: 'review', target: '/tokamak/en/categories/paper-review/' },
      { path: 'cv', target: '/en/timeline/' },
      { path: 'repositories', target: '/en/outputs/#software' }
    ]);
  });

  it('rejects unresolved project references', () => {
    const broken = structuredClone(fixtureCatalog);
    broken.outputs[0].projectIds = ['fixture-missing'];
    expect(validateCatalog(broken).map((issue) => issue.code)).toContain('unknown-reference');
  });

  it('rejects mismatched Tokamak locale pairs', () => {
    const broken = structuredClone(fixtureCatalog);
    broken.projects[0].knowledgeLinks[0].urls.en = 'https://hoonseokyoon.github.io/tokamak/en/blog/different-slug/';
    expect(validateCatalog(broken).map((issue) => issue.code)).toContain('knowledge-pair');
  });

  it('requires explicit user approval for every published record', () => {
    const broken = structuredClone(fixtureCatalog);
    broken.projects[0].evidence = [
      { kind: 'repository', url: 'https://example.test/repository', checkedAt: '2026-07-28' }
    ];
    expect(validateCatalog(broken).map((issue) => issue.code)).toContain('missing-publication-approval');
  });

  it('rejects impossible calendar dates', () => {
    expect(PartialDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(PartialDateSchema.safeParse('2024-02-29').success).toBe(true);
  });

  it('requires collection filenames to match immutable record IDs', () => {
    expect(() =>
      parseCatalog(
        stringify(fixtureCatalog.person),
        [],
        [['src/lib/content/projects/wrong-file.yml', stringify(fixtureCatalog.projects[0])]],
        []
      )
    ).toThrow(/does not match filename/);
  });
});
