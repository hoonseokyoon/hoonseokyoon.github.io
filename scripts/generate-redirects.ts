import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadCatalogFromDisk } from '../src/lib/content/catalog.node';
import { siteOrigin } from '../src/lib/site';
import { loadRoutePolicy, redirectIsActive } from './route-contract';

const buildRoot = resolve('build');

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function redirectDocument(target: string) {
  const escapedTarget = escapeHtml(target);
  const canonical = escapeHtml(`${siteOrigin}${target}`);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, follow" />
    <meta http-equiv="refresh" content="0;url=${escapedTarget}" />
    <link rel="canonical" href="${canonical}" />
    <title>Page moved · Hoonseok Yoon</title>
    <style>
      :root { font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #30363d; }
      body { margin: 0; padding: 12vh max(1rem, 6vw); }
      main { max-width: 42rem; }
      h1 { color: #171b21; font-size: clamp(2rem, 6vw, 3.5rem); line-height: 1.15; letter-spacing: -0.04em; }
      p { line-height: 1.65; }
      a { min-height: 44px; display: inline-flex; align-items: center; color: #075ea8; font-weight: 650; text-underline-offset: 0.17em; }
      a:focus-visible { outline: 3px solid #7fb2dc; outline-offset: 3px; }
    </style>
  </head>
  <body>
    <main>
      <p>PAGE MOVED</p>
      <h1>This page has moved.</h1>
      <p lang="ko">이 페이지는 새 위치로 이동했습니다.</p>
      <a href="${escapedTarget}">Continue · <span lang="ko">새 위치로 이동</span> →</a>
    </main>
  </body>
</html>
`;
}

const catalog = loadCatalogFromDisk();
const redirects = loadRoutePolicy().redirects.filter(
  (entry) => entry.generator === 'compatibility' && redirectIsActive(entry, catalog)
);

for (const redirect of redirects) {
  const path = redirect.path.replace(/^\/+|\/+$/g, '');
  if (!/^[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(path) || path.includes('..')) {
    throw new Error(`Unsafe legacy redirect path: ${redirect.path}`);
  }
  const directory = join(buildRoot, path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'index.html'), redirectDocument(redirect.target));
}

console.log(`Generated ${redirects.length} compatibility redirects`);
