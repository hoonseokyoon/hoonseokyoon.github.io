import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const locale = event.url.pathname.match(/^\/(ko|en)(?:\/|$)/)?.[1] ?? 'ko';
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('<html lang="en">', `<html lang="${locale}">`)
  });
};
