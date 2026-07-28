import type { RequestHandler } from './$types';
import { siteOrigin } from '$lib/site';

export const prerender = true;

export const GET: RequestHandler = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\nSitemap: ${siteOrigin}/tokamak/sitemap.xml\n`,
    { headers: { 'content-type': 'text/plain; charset=utf-8' } }
  );
