import { describe, expect, it } from 'vitest';
import { containsSerializedProperty } from '../../scripts/public-payload-contract';

describe('public payload build contract', () => {
  it('does not treat visible prose as a serialized field', () => {
    expect(containsSerializedProperty('<p>contributors: Alice and Bob</p>', 'contributors')).toBe(false);
    expect(containsSerializedProperty('<p>The evidence = a published release.</p>', 'evidence')).toBe(false);
  });

  it.each([
    '{"contributors":[{"person":"self"}]}',
    "{'contributors': [{ person: 'self' }]}",
    'record.contributors = [{ person: "self" }]',
    'record["contributors"] = [{ person: "self" }]'
  ])('detects a structured internal field in %s', (source) => {
    expect(containsSerializedProperty(source, 'contributors')).toBe(true);
  });
});
