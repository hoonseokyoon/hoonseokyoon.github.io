import type { Locale } from '$lib/site';
import { siteOrigin } from '$lib/site';

export function localizedHref(lang: Locale, path = '') {
  const suffix = path.replace(/^\/+|\/+$/g, '');
  return `/${lang}/${suffix ? `${suffix}/` : ''}`;
}

export function absoluteUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${siteOrigin}${normalized}`;
}

export function tokamakHref(lang: Locale) {
  return `${siteOrigin}/tokamak/${lang}/`;
}

export function alternateLocale(lang: Locale): Locale {
  return lang === 'ko' ? 'en' : 'ko';
}

export function alternateLocalePath(pathname: string, lang: Locale) {
  const alternate = alternateLocale(lang);
  const localizedPattern = /^\/(ko|en)(\/|$)/;
  if (localizedPattern.test(pathname)) return pathname.replace(localizedPattern, `/${alternate}$2`);
  return localizedHref(alternate);
}
