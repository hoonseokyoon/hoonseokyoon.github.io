import type { Locale } from '$lib/site';
import { absoluteUrl } from '$lib/navigation';

export function localizedMetadata(lang: Locale, path: string) {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  const suffix = normalized ? `${normalized}/` : '';
  const canonicalPath = `/${lang}/${suffix}`;
  const alternate = lang === 'ko' ? 'en' : 'ko';
  return {
    canonical: absoluteUrl(canonicalPath),
    ko: absoluteUrl(`/ko/${suffix}`),
    en: absoluteUrl(`/en/${suffix}`),
    alternate: absoluteUrl(`/${alternate}/${suffix}`),
    xDefault: absoluteUrl(`/ko/${suffix}`)
  };
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
