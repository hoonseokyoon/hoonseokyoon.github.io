import { describe, expect, it } from 'vitest';
import { stringify } from 'yaml';
import { loadCatalogFromDisk } from '../../src/lib/content/catalog.node';
import { parseCatalog } from '../../src/lib/content/parse';
import { PartialDateSchema } from '../../src/lib/content/schema';
import { localizedContent, localizedPublicCatalog, publishedCatalog } from '../../src/lib/content/public';
import { outputStructuredData } from '../../src/lib/structured-data';
import { validateCatalog } from '../../src/lib/content/validate';

const catalog = loadCatalogFromDisk();

/** A clone of the real catalog, so rejection tests need no synthetic fixture. */
function broken() {
  return structuredClone(catalog);
}

describe('content catalog', () => {
  it('validates, including the release gate', () => {
    expect(validateCatalog(catalog)).toEqual([]);
    expect(validateCatalog(catalog, { requireReleaseContent: true })).toEqual([]);
  });

  it('publishes only approved records', () => {
    const published = publishedCatalog(catalog);
    expect(published.person?.editorialStatus).toBe('published');
    for (const record of [...published.timeline, ...published.projects, ...published.outputs]) {
      expect(record.editorialStatus).toBe('published');
    }
  });

  it('falls back to the source locale instead of pretending to translate', () => {
    const record = {
      sourceLocale: 'en' as const,
      content: { en: { title: 'Only English' } }
    };
    const localized = localizedContent(record, 'ko');
    expect(localized).toMatchObject({ locale: 'en', isFallback: true });
  });

  it('serves knowledge links in the requested locale only', () => {
    const ko = localizedPublicCatalog(catalog, 'ko');
    const en = localizedPublicCatalog(catalog, 'en');
    expect(JSON.stringify(ko)).not.toContain('/tokamak/en/');
    expect(JSON.stringify(en)).not.toContain('/tokamak/ko/');
  });

  it('keeps editorial metadata out of the public page payload', () => {
    const serialized = JSON.stringify(localizedPublicCatalog(catalog, 'ko'));
    for (const key of ['editorialStatus', 'sourceLocale', 'evidence', 'checkedAt', 'contributors', 'reciprocal']) {
      expect(serialized).not.toContain(`"${key}"`);
    }
  });

  it('describes outputs with stable structured data', () => {
    const outputs = localizedPublicCatalog(catalog, 'ko').outputs;
    const structured = outputStructuredData(outputs) as { '@graph': Array<Record<string, unknown>> };
    expect(structured['@graph']).toHaveLength(outputs.length);
    expect(structured['@graph'][0]).toMatchObject({
      '@id': `https://hoonseokyoon.github.io/#output-${outputs[0].id}`,
      author: { '@id': 'https://hoonseokyoon.github.io/#person' }
    });
  });

  it('rejects references to records that do not exist', () => {
    const catalogWithBadRef = broken();
    catalogWithBadRef.outputs[0].projectIds = ['missing-project'];
    expect(validateCatalog(catalogWithBadRef).map((issue) => issue.code)).toContain('unknown-reference');
  });

  it('rejects mismatched Tokamak locale pairs', () => {
    const catalogWithBadPair = broken();
    catalogWithBadPair.projects[0].knowledgeLinks[0].urls.en =
      'https://hoonseokyoon.github.io/tokamak/en/projects/different-slug/';
    expect(validateCatalog(catalogWithBadPair).map((issue) => issue.code)).toContain('knowledge-pair');
  });

  it('rejects knowledge URLs outside the canonical Tokamak shape', () => {
    for (const url of [
      'https://hoonseokyoon.github.io/tokamak/ko/projects/slug/?source=root',
      'https://example.test/tokamak/ko/projects/slug/'
    ]) {
      const catalogWithBadUrl = broken();
      catalogWithBadUrl.projects[0].knowledgeLinks[0].urls.ko = url;
      expect(
        validateCatalog(catalogWithBadUrl).map((issue) => issue.code),
        url
      ).toContain('invalid-knowledge-url');
    }
  });

  it('requires dated user approval on every published record', () => {
    const catalogWithoutApproval = broken();
    catalogWithoutApproval.projects[0].evidence = [
      { kind: 'repository', url: 'https://example.test/repository', checkedAt: '2026-07-28' }
    ];
    expect(validateCatalog(catalogWithoutApproval).map((issue) => issue.code)).toContain(
      'missing-publication-approval'
    );
  });

  it('rejects impossible calendar dates', () => {
    expect(PartialDateSchema.safeParse('2026-02-30').success).toBe(false);
    expect(PartialDateSchema.safeParse('2024-02-29').success).toBe(true);
  });

  it('requires filenames to match record IDs', () => {
    expect(() =>
      parseCatalog(
        stringify(catalog.person),
        [],
        [['src/lib/content/projects/wrong.yml', stringify(catalog.projects[0])]],
        []
      )
    ).toThrow(/does not match filename/);
  });
});
