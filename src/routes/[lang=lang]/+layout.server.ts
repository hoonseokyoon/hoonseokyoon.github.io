import type { LayoutServerLoad } from './$types';
import type { Locale } from '$lib/site';

export const load: LayoutServerLoad = ({ params }) => ({ lang: params.lang as Locale });
