import type { PublicOutput } from '$lib/content/public';
import { personId, siteOrigin } from '$lib/site';

const outputTypes = {
  paper: 'ScholarlyArticle',
  software: 'SoftwareSourceCode',
  release: 'CreativeWork',
  presentation: 'PresentationDigitalDocument',
  poster: 'CreativeWork',
  dataset: 'Dataset',
  article: 'CreativeWork',
  award: 'CreativeWork',
  other: 'CreativeWork'
} as const satisfies Record<PublicOutput['kind'], string>;

export function outputStructuredDataType(kind: PublicOutput['kind']) {
  return outputTypes[kind];
}

export function outputStructuredDataId(id: string) {
  return `${siteOrigin}/#output-${id}`;
}

export function outputStructuredData(outputs: PublicOutput[]) {
  if (outputs.length === 0) return undefined;
  return {
    '@context': 'https://schema.org',
    '@graph': outputs.map((output) => {
      const primary = output.links.find((link) => link.primary);
      return {
        '@type': outputStructuredDataType(output.kind),
        '@id': outputStructuredDataId(output.id),
        ...(primary ? { url: primary.url } : {}),
        name: output.content.title,
        ...(output.content.summary ? { description: output.content.summary } : {}),
        creditText: output.content.contribution,
        datePublished: output.date,
        inLanguage: output.locale,
        author: { '@id': personId }
      };
    })
  };
}
