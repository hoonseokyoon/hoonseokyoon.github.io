import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

/**
 * Renders static/social-card.png in the site's own identity: warm paper,
 * a serif name, mono labels, and hairline rules. Run with `npm run social-card`
 * after changing the design tokens.
 */
const width = 1200;
const height = 630;

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: ${width}px; height: ${height}px;
        display: grid; grid-template-columns: 1fr 22rem; align-items: center; gap: 4rem;
        padding: 5rem 5.5rem;
        background: #fbfaf8; color: #35322c;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .label {
        color: #736d61; font-family: ui-monospace, Menlo, monospace;
        font-size: 15px; letter-spacing: 0.16em; text-transform: uppercase;
      }
      h1 {
        margin: 1.6rem 0 0; color: #1b1a17;
        font-family: 'Iowan Old Style', Charter, Cambria, Georgia, serif;
        font-size: 88px; font-weight: 400; line-height: 1.02; letter-spacing: -0.025em;
      }
      .rule { width: 8rem; height: 2px; margin: 2rem 0 1.6rem; background: #8c3a1c; }
      .sections {
        color: #5f594e; font-family: ui-monospace, Menlo, monospace;
        font-size: 17px; letter-spacing: 0.06em;
      }
      .sections .sep { color: #bab3a3; padding: 0 0.5em; }
      /* A miniature of the site's own ledger, rather than a diagram of boxes. */
      .ledger { border-top: 1px solid #1b1a17; padding-top: 0.9rem; }
      .ledger .row {
        display: grid; grid-template-columns: 6.5rem 1fr; gap: 1rem;
        padding: 0.85rem 0; border-top: 1px solid #ddd8cd;
      }
      .ledger .row:first-of-type { border-top: 0; }
      .ledger .when {
        color: #736d61; font-family: ui-monospace, Menlo, monospace;
        font-size: 13px; font-variant-numeric: tabular-nums;
      }
      .ledger .bars { display: block; }
      .ledger .bar { display: block; height: 7px; background: #e6e2d9; }
      .ledger .bar + .bar { margin-top: 6px; width: 72%; }
      .ledger .bar.strong { background: #c9c3b6; width: 88%; }
    </style>
  </head>
  <body>
    <div>
      <p class="label">Curriculum vitae</p>
      <h1>Hoonseok&nbsp;Yoon</h1>
      <div class="rule"></div>
      <p class="sections">
        Timeline<span class="sep">·</span>Projects<span class="sep">·</span>Outputs<span class="sep">·</span>Knowledge
      </p>
    </div>
    <div class="ledger">
      <div class="row"><span class="when">2026.07</span><span class="bars"><span class="bar strong"></span><span class="bar"></span></span></div>
      <div class="row"><span class="when">2025.10</span><span class="bars"><span class="bar strong"></span><span class="bar"></span></span></div>
      <div class="row"><span class="when">2025.03</span><span class="bars"><span class="bar strong"></span></span></div>
      <div class="row"><span class="when">2024.09</span><span class="bars"><span class="bar strong"></span><span class="bar"></span></span></div>
    </div>
  </body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({ path: resolve('static/social-card.png') });
await browser.close();
console.log(`Wrote static/social-card.png (${width * 2}×${height * 2})`);
