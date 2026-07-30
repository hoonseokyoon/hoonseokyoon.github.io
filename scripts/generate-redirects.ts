import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { siteOrigin } from '../src/lib/site';

/**
 * The few old paths worth keeping alive. Everything else from the previous
 * al-folio site pointed at template sample pages and is simply gone.
 */
const redirects: Record<string, string> = {
  cv: '/en/',
  projects: '/en/projects/',
  publications: '/en/outputs/',
  blog: '/tokamak/en/',
  'blog/2024/Integrated-Understanding-of-Calculus-Symbols':
    '/tokamak/en/blog/integrated-understanding-of-calculus-symbols/'
};

const buildRoot = resolve('build');

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function redirectDocument(target: string) {
  const href = escapeHtml(target);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, follow" />
    <meta http-equiv="refresh" content="0;url=${href}" />
    <link rel="canonical" href="${escapeHtml(`${siteOrigin}${target}`)}" />
    <title>Page moved · Hoonseok Yoon</title>
    <style>
      body { margin: 0; padding: 14vh max(1.25rem, 6vw); background: #fbfaf8; color: #35322c;
             font: 1.0625rem/1.7 Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      main { max-width: 40rem; padding-top: 0.9rem; border-top: 1px solid #1b1a17; }
      p.label { margin: 0 0 0.9rem; color: #736d61; font-family: ui-monospace, Menlo, monospace;
                font-size: 0.68rem; letter-spacing: 0.14em; }
      h1 { margin: 0 0 0.75rem; color: #1b1a17; font-family: 'Iowan Old Style', Charter, Georgia, serif;
           font-size: clamp(2.1rem, 5vw, 3rem); font-weight: 400; line-height: 1.12; }
      a { color: #35322c; text-underline-offset: 0.2em; }
      a:hover { color: #8c3a1c; }
    </style>
  </head>
  <body>
    <main>
      <p class="label">Moved</p>
      <h1>This page has moved.</h1>
      <p lang="ko">이 페이지는 새 위치로 이동했습니다.</p>
      <p><a href="${href}">Continue → <span lang="ko">새 위치로 이동</span></a></p>
    </main>
  </body>
</html>
`;
}

for (const [path, target] of Object.entries(redirects)) {
  const directory = join(buildRoot, path);
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'index.html'), redirectDocument(target));
}

console.log(`Generated ${Object.keys(redirects).length} redirects`);
