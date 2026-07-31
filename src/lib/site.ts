export const siteOrigin = 'https://hoonseokyoon.github.io';
export const personId = `${siteOrigin}/#person`;
export const websiteId = `${siteOrigin}/#website`;
export const socialCardUrl = `${siteOrigin}/social-card.png`;
export const socialCardAlt = 'Hoonseok Yoon — Curriculum vitae';
export const supportedLocales = ['ko', 'en'] as const;
export const defaultLocale = 'ko' as const;

export type Locale = (typeof supportedLocales)[number];
