import type { Locale } from '$lib/site';

/** Verbose, locale-aware date for prose and metadata. */
export function formatPartialDate(value: string, lang: Locale) {
  const [year, month, day] = value.split('-').map(Number);
  if (!month) return String(year);
  if (!day)
    return lang === 'ko'
      ? `${year}년 ${month}월`
      : new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', timeZone: 'UTC' }).format(
          new Date(Date.UTC(year, month - 1, 1))
        );
  return new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: lang === 'ko' ? 'numeric' : 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * Compact numeric date for the ledger gutter. Deliberately identical in both
 * locales so the date column stays aligned, the way a printed CV sets it.
 */
export function tabularDate(value: string) {
  return value.replaceAll('-', '.');
}

export function tabularPeriod(period: { start: string; end?: string }, presentLabel: string) {
  const start = tabularDate(period.start);
  const end = period.end === 'present' ? presentLabel : period.end ? tabularDate(period.end) : undefined;
  // A record that starts and ends in the same period reads as one date, not a range.
  return { start, end: end === start ? undefined : end };
}

export function formatPeriod(period: { start: string; end?: string }, lang: Locale, presentLabel: string) {
  const start = formatPartialDate(period.start, lang);
  const end = period.end === 'present' ? presentLabel : period.end ? formatPartialDate(period.end, lang) : undefined;
  return end ? `${start} – ${end}` : start;
}
