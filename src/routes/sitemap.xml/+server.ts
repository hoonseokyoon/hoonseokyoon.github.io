import type { RequestHandler } from './$types';
import { catalog } from '$lib/content/catalog.server';
import { canonicalRoutes } from '$lib/content/route-manifest';
import { siteOrigin } from '$lib/site';

export const prerender = true;

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const GET: RequestHandler = () => {
  const routes = [...canonicalRoutes(catalog)].filter((route) => /^\/(ko|en)\//.test(route)).sort();
  const body = routes
    .map((route) => {
      const alternate = route.startsWith('/ko/') ? route.replace('/ko/', '/en/') : route.replace('/en/', '/ko/');
      const ko = route.startsWith('/ko/') ? route : alternate;
      const en = route.startsWith('/en/') ? route : alternate;
      return `<url><loc>${escapeXml(`${siteOrigin}${route}`)}</loc><xhtml:link rel="alternate" hreflang="ko" href="${escapeXml(`${siteOrigin}${ko}`)}"/><xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${siteOrigin}${en}`)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${siteOrigin}${ko}`)}"/></url>`;
    })
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${body}</urlset>`,
    { headers: { 'content-type': 'application/xml; charset=utf-8' } }
  );
};
