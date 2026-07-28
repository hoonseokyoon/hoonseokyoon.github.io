import type { ParamMatcher } from '@sveltejs/kit';
import { supportedLocales } from '$lib/site';

export const match: ParamMatcher = (param): param is (typeof supportedLocales)[number] =>
  supportedLocales.includes(param as (typeof supportedLocales)[number]);
