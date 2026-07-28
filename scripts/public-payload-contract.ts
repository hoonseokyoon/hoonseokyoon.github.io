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

function containsSerializedProperty(source: string, property: string): boolean {
  const escaped = escapeRegExp(property);
  const quoted = `["']${escaped}["']`;
  const serializedProperty = new RegExp(
    `(?:${quoted}\\s*:|(?:^|[,{])\\s*${escaped}\\s*:|\\.\\s*${escaped}\\s*=|\\[\\s*${quoted}\\s*\\]\\s*=)`
  );
  return serializedProperty.test(source);
}

export function artifactContainsSerializedProperty(
  source: string,
  property: string,
  extension: '.html' | '.js' | '.json'
): boolean {
  const structuredSources =
    extension === '.html'
      ? [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1])
      : [source];
  return structuredSources.some((structuredSource) => containsSerializedProperty(structuredSource, property));
}
