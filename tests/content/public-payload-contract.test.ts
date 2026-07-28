import { describe, expect, it } from 'vitest';
import { artifactContainsSerializedProperty } from '../../scripts/public-payload-contract';

describe('public payload build contract', () => {
  it('does not treat visible prose as a serialized field', () => {
    expect(artifactContainsSerializedProperty('<p>{contributors: Alice and Bob}</p>', 'contributors', '.html')).toBe(
      false
    );
    expect(artifactContainsSerializedProperty('<p>The evidence = a published release.</p>', 'evidence', '.html')).toBe(
      false
    );
  });

  it.each([
    ['{"contributors":[{"person":"self"}]}', '.json'],
    ["{'contributors': [{ person: 'self' }]}", '.js'],
    ['const record={contributors:[{person:"self"}]}', '.js'],
    ['record.contributors = [{ person: "self" }]', '.js'],
    ['record["contributors"] = [{ person: "self" }]', '.js'],
    ['<script>window.__data={contributors:[{person:"self"}]}</script>', '.html']
  ] as const)('detects a structured internal field in %s', (source, extension) => {
    expect(artifactContainsSerializedProperty(source, 'contributors', extension)).toBe(true);
  });
});
