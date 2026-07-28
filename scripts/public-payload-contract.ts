export const internalCatalogFields = [
  'editorialStatus',
  'sourceLocale',
  'evidence',
  'checkedAt',
  'contributors'
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsSerializedProperty(source: string, property: string): boolean {
  const escaped = escapeRegExp(property);
  const quoted = `["']${escaped}["']`;
  const serializedProperty = new RegExp(`(?:${quoted}\\s*:|\\.\\s*${escaped}\\s*=|\\[\\s*${quoted}\\s*\\]\\s*=)`);
  return serializedProperty.test(source);
}
