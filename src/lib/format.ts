import type { Locale } from '$lib/site';

export function formatPartialDate(value: string, lang: Locale) {
  const [year, month, day] = value.split('-').map(Number);
  if (!month) return String(year);
  if (!day)
    return lang === 'ko'
      ? `${year}. ${String(month).padStart(2, '0')}.`
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

export function formatPeriod(period: { start: string; end?: string }, lang: Locale, presentLabel: string) {
  const start = formatPartialDate(period.start, lang);
  const end = period.end === 'present' ? presentLabel : period.end ? formatPartialDate(period.end, lang) : undefined;
  return end ? `${start} — ${end}` : start;
}
