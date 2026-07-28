import { describe, expect, it, vi } from 'vitest';
import {
  assertExpectedSha,
  createLivePlan,
  normalizeTrustedBase,
  parseLiveArguments,
  releaseMarkerRoute,
  resolveTrustedRoute,
  runLivePlan,
  trustedLiveBase,
  validateLiveProbe,
  type LivePlan,
  type LiveProbe,
  type LocalizedDataProbe,
  type LocalizedProbe,
  type TokamakPageProbe
} from '../scripts/check-live';

const expectedSha = '0123456789abcdef0123456789abcdef01234567';
const staleSha = '89abcdef0123456789abcdef0123456789abcdef';
const encoder = new TextEncoder();

function response(body: BodyInit, status: number, contentType: string): Response {
  return new Response(body, { status, headers: { 'content-type': contentType } });
}

function jsonResponse(body: string): Response {
  return response(body, 200, 'application/json; charset=utf-8');
}

function htmlResponse(body: string, status = 200): Response {
  return response(body, status, 'text/html; charset=utf-8');
}

function marker(sha = expectedSha): string {
  return `{"commit":"${sha}"}\n`;
}

function notFoundHtml(): string {
  return `<!doctype html><html lang="ko"><head><meta name="robots" content="noindex"></head>
    <body><main><p>404</p><a href="/ko/">한국어 홈</a><a href="/en/">English home</a></main></body></html>`;
}

function emptyPlan(probes: LiveProbe[] = []): LivePlan {
  return {
    probes,
    localizedRoutes: [],
    activeRedirects: [],
    absentRoutes: probes.filter((probe) => probe.kind === 'not-found').map((probe) => probe.route),
    tokamakRoutes: probes.filter((probe) => probe.kind === 'tokamak-page').map((probe) => probe.route),
    calculusRoutes: [
      '/tokamak/ko/blog/integrated-understanding-of-calculus-symbols/',
      '/tokamak/en/blog/integrated-understanding-of-calculus-symbols/'
    ],
    missingRoute: `/__root-live-check-missing-${expectedSha}/`
  };
}

function alternateRoutes(route: string) {
  const ko = route.startsWith('/ko/') ? route : route.replace('/en/', '/ko/');
  const en = route.startsWith('/en/') ? route : route.replace('/ko/', '/en/');
  return { ko, en, 'x-default': ko };
}

function localizedProbe(overrides: Partial<LocalizedProbe> & Pick<LocalizedProbe, 'route' | 'locale'>): LocalizedProbe {
  return {
    kind: 'localized',
    alternateRoutes: alternateRoutes(overrides.route),
    expectedFragments: [],
    unselectedContent: [],
    identity: { kind: 'none' },
    ...overrides
  };
}

function rootHomeJsonLd(websiteAuthor = 'https://hoonseokyoon.github.io/#person'): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': 'https://hoonseokyoon.github.io/#person',
        name: 'Hoonseok Yoon',
        url: 'https://hoonseokyoon.github.io/',
        sameAs: ['https://github.com/hoonseokyoon']
      },
      {
        '@type': 'WebSite',
        '@id': 'https://hoonseokyoon.github.io/#website',
        url: 'https://hoonseokyoon.github.io/',
        author: { '@id': websiteAuthor }
      }
    ]
  });
}

function localizedHtml(options: {
  route: string;
  locale: 'ko' | 'en';
  canonical?: string;
  jsonLd?: string;
  extra?: string;
}): string {
  const pair = alternateRoutes(options.route);
  return `<!doctype html>
    <html lang="${options.locale}"><head>
      <link rel="modulepreload" href="/_app/immutable/entry/start.fixture.js">
      <link rel="canonical" href="${options.canonical ?? `https://hoonseokyoon.github.io${options.route}`}">
      <link rel="alternate" hreflang="ko" href="https://hoonseokyoon.github.io${pair.ko}">
      <link rel="alternate" hreflang="en" href="https://hoonseokyoon.github.io${pair.en}">
      <link rel="alternate" hreflang="x-default" href="https://hoonseokyoon.github.io${pair['x-default']}">
      <meta property="og:image" content="https://hoonseokyoon.github.io/social-card.png">
      <meta property="og:image:alt" content="Hoonseok Yoon — Personal Record">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:image" content="https://hoonseokyoon.github.io/social-card.png">
      ${options.jsonLd ? `<script type="application/ld+json">${options.jsonLd}</script>` : ''}
      ${options.extra ?? ''}
    </head><body>
      <a href="https://hoonseokyoon.github.io/tokamak/${options.locale}/">Tokamak</a>
    </body></html>`;
}

function tokamakCalculusHtml(
  route: string,
  locale: 'ko' | 'en',
  postingAuthor = 'https://hoonseokyoon.github.io/#person'
): string {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': 'https://hoonseokyoon.github.io/#person',
        url: 'https://hoonseokyoon.github.io/'
      },
      {
        '@type': 'WebSite',
        '@id': 'https://hoonseokyoon.github.io/tokamak/#website',
        author: { '@id': 'https://hoonseokyoon.github.io/#person' }
      },
      {
        '@type': 'BlogPosting',
        url: `https://hoonseokyoon.github.io${route}`,
        author: { '@id': postingAuthor }
      }
    ]
  };
  return `<!doctype html><html lang="${locale}"><head>
    <link rel="canonical" href="https://hoonseokyoon.github.io${route}">
    <script type="application/ld+json">${JSON.stringify(graph)}</script>
    </head><body><a class="brand-author" href="https://hoonseokyoon.github.io/">by Hoonseok Yoon</a></body></html>`;
}

describe('trusted live-check input boundary', () => {
  it('accepts only the fixed HTTPS root origin and an exact lower-case SHA', () => {
    expect(normalizeTrustedBase('https://hoonseokyoon.github.io')).toBe(trustedLiveBase);
    expect(normalizeTrustedBase(trustedLiveBase)).toBe(trustedLiveBase);
    expect(assertExpectedSha(expectedSha)).toBe(expectedSha);
    expect(parseLiveArguments(['--base', trustedLiveBase, '--expected-sha', expectedSha])).toEqual({
      base: trustedLiveBase,
      expectedSha
    });
    expect(resolveTrustedRoute(trustedLiveBase, '/tokamak/en/')).toBe('https://hoonseokyoon.github.io/tokamak/en/');

    for (const invalid of [
      'http://hoonseokyoon.github.io/',
      'https://user@hoonseokyoon.github.io/',
      'https://@hoonseokyoon.github.io/',
      'https://hoonseokyoon.github.io:443/',
      'https://hoonseokyoon.github.io/tokamak/',
      'https://hoonseokyoon.github.io/?',
      'https://hoonseokyoon.github.io/?page=1',
      'https://hoonseokyoon.github.io/#',
      'https://hoonseokyoon.github.io/#fragment',
      'https://hoonseokyoon.github.io.evil.example/'
    ]) {
      expect(() => normalizeTrustedBase(invalid), invalid).toThrow();
    }
    expect(() => assertExpectedSha(expectedSha.toUpperCase())).toThrow(/lower-case/);
    expect(() => assertExpectedSha(expectedSha.slice(1))).toThrow(/exactly 40/);
    expect(() => resolveTrustedRoute(trustedLiveBase, '//evil.example/')).toThrow(/Unsafe/);
    expect(() => parseLiveArguments(['--expected-sha', expectedSha, '--expected-sha', expectedSha])).toThrow(
      /only once/
    );
  });
});

describe('catalog and policy-derived plan', () => {
  it('derives canonical, redirect, removed, fragment, and controlled Tokamak probes', () => {
    const plan = createLivePlan(expectedSha);

    expect(plan.localizedRoutes).toEqual(
      expect.arrayContaining(['/ko/', '/en/', '/ko/projects/tokamak/', '/en/outputs/'])
    );
    expect(plan.localizedRoutes).toHaveLength(10);
    expect(plan.activeRedirects).toEqual(
      expect.arrayContaining([
        { route: '/', target: '/ko/' },
        { route: '/repositories/', target: '/en/outputs/#software' },
        {
          route: '/blog/2024/Integrated-Understanding-of-Calculus-Symbols/',
          target: '/tokamak/en/blog/integrated-understanding-of-calculus-symbols/'
        }
      ])
    );
    expect(plan.absentRoutes).toEqual(expect.arrayContaining(['/publications/', '/teaching/', '/feed.xml']));
    expect(plan.calculusRoutes).toEqual([
      '/tokamak/ko/blog/integrated-understanding-of-calculus-symbols/',
      '/tokamak/en/blog/integrated-understanding-of-calculus-symbols/'
    ]);
    expect(plan.tokamakRoutes).toEqual(
      expect.arrayContaining([
        '/tokamak/ko/',
        '/tokamak/en/',
        '/tokamak/en/categories/paper-review/',
        ...plan.calculusRoutes
      ])
    );
    const outputs = plan.probes.find(
      (probe): probe is LocalizedProbe => probe.kind === 'localized' && probe.route === '/en/outputs/'
    );
    expect(outputs?.expectedFragments).toEqual(['software']);
    expect(plan.missingRoute).toBe(`/__root-live-check-missing-${expectedSha}/`);
    expect(new Set(plan.probes.map((probe) => probe.route)).size).toBe(plan.probes.length);
  });
});

describe('release marker and request execution', () => {
  it('waits through a stale marker and succeeds only on the exact fresh bytes', async () => {
    let markerRequests = 0;
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      expect(new URL(String(input)).pathname).toBe(releaseMarkerRoute);
      markerRequests += 1;
      return jsonResponse(marker(markerRequests === 1 ? staleSha : expectedSha));
    });
    const sleep = vi.fn(async () => undefined);

    const summary = await runLivePlan(
      {
        base: trustedLiveBase,
        expectedSha,
        preflightAttempts: 2,
        preflightDelayMs: 0,
        fetchImpl,
        sleep
      },
      emptyPlan()
    );

    expect(summary).toMatchObject({ preflightRounds: 2, preflightRequests: 2, probes: 0 });
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('uses manual redirects, no-store, timeout signals, and a cache buster for every request', async () => {
    const probe: LiveProbe = { kind: 'not-found', route: '/retired/', customDocument: false };
    const calls: Array<{ url: URL; init: RequestInit | undefined }> = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push({ url, init });
      return url.pathname === releaseMarkerRoute ? jsonResponse(marker()) : htmlResponse(notFoundHtml(), 404);
    });

    await runLivePlan(
      {
        base: trustedLiveBase,
        expectedSha,
        preflightAttempts: 1,
        preflightDelayMs: 0,
        attempts: 1,
        fetchImpl
      },
      emptyPlan([probe])
    );

    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.url.origin).toBe('https://hoonseokyoon.github.io');
      expect(call.url.searchParams.get('__root_live_check')).toMatch(new RegExp(`^${expectedSha}-\\d+$`));
      expect(call.init).toMatchObject({ cache: 'no-store', redirect: 'manual' });
      expect(call.init?.headers).toMatchObject({
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'user-agent': 'root-live-verifier/1.0'
      });
      expect(call.init?.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('bounds concurrency and retries transient failures with aggregate accounting', async () => {
    const probes: LiveProbe[] = ['/gone-a/', '/gone-b/', '/gone-c/'].map((route) => ({
      kind: 'not-found',
      route,
      customDocument: false
    }));
    let active = 0;
    let maximumActive = 0;
    const attempts = new Map<string, number>();
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.pathname === releaseMarkerRoute) return jsonResponse(marker());
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await Promise.resolve();
      const count = (attempts.get(url.pathname) ?? 0) + 1;
      attempts.set(url.pathname, count);
      active -= 1;
      if (url.pathname === '/gone-a/' && count === 1) return htmlResponse('still present', 200);
      return htmlResponse(notFoundHtml(), 404);
    });
    const sleep = vi.fn(async () => undefined);

    const summary = await runLivePlan(
      {
        base: trustedLiveBase,
        expectedSha,
        concurrency: 2,
        attempts: 2,
        retryDelayMs: 0,
        preflightAttempts: 1,
        preflightDelayMs: 0,
        fetchImpl,
        sleep
      },
      emptyPlan(probes)
    );

    expect(maximumActive).toBe(2);
    expect(summary).toMatchObject({ probes: 3, attempts: 4, retriedProbes: 1, concurrency: 2 });
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('aggregates final route, status, attempt, and reason for independent failures', async () => {
    const probes: LiveProbe[] = ['/still-here-a/', '/still-here-b/'].map((route) => ({
      kind: 'not-found',
      route,
      customDocument: false
    }));
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      return url.pathname === releaseMarkerRoute
        ? jsonResponse(marker())
        : htmlResponse('<!doctype html><html><body>still here</body></html>', 200);
    });

    await expect(
      runLivePlan(
        {
          base: trustedLiveBase,
          expectedSha,
          concurrency: 2,
          attempts: 2,
          retryDelayMs: 0,
          preflightAttempts: 1,
          preflightDelayMs: 0,
          fetchImpl,
          sleep: async () => undefined
        },
        emptyPlan(probes)
      )
    ).rejects.toThrow(
      /failed for 2\/2 probes:[\s\S]*\/still-here-a\/[\s\S]*status 200, 2 attempts[\s\S]*\/still-here-b\//
    );
  });
});

describe('semantic response contracts', () => {
  it('accepts a complete root home then reports canonical, payload, locale, and identity regressions together', () => {
    const route = '/ko/';
    const probe = localizedProbe({
      route,
      locale: 'ko',
      identity: { kind: 'home' },
      unselectedContent: ['UNSELECTED ENGLISH PROSE']
    });
    const valid = localizedHtml({ route, locale: 'ko', jsonLd: rootHomeJsonLd() });
    expect(() =>
      validateLiveProbe(probe, htmlResponse(valid), encoder.encode(valid), resolveTrustedRoute(trustedLiveBase, route))
    ).not.toThrow();

    const invalid = localizedHtml({
      route,
      locale: 'ko',
      canonical: 'https://hoonseokyoon.github.io/en/',
      jsonLd: rootHomeJsonLd('https://hoonseokyoon.github.io/#wrong-person'),
      extra: '<script>{"evidence":"private"}</script><p>UNSELECTED ENGLISH PROSE</p>'
    });
    expect(() =>
      validateLiveProbe(
        probe,
        htmlResponse(invalid),
        encoder.encode(invalid),
        resolveTrustedRoute(trustedLiveBase, route)
      )
    ).toThrow(/canonical[\s\S]*internal catalog field evidence[\s\S]*unselected locale[\s\S]*shared Person ID/);
  });

  it('checks the separately served SvelteKit data payload for private and unselected fields', () => {
    const probe: LocalizedDataProbe = {
      kind: 'localized-data',
      route: '/ko/__data.json',
      pageRoute: '/ko/',
      locale: 'ko',
      unselectedContent: ['UNSELECTED ENGLISH PROSE']
    };
    const valid = '{"type":"data","data":{"locale":"ko"}}';
    expect(() =>
      validateLiveProbe(probe, response(valid, 200, 'application/json'), encoder.encode(valid))
    ).not.toThrow();

    const invalid = '{"evidence":"private","copy":"UNSELECTED ENGLISH PROSE"}';
    expect(() => validateLiveProbe(probe, response(invalid, 200, 'application/json'), encoder.encode(invalid))).toThrow(
      /internal catalog field evidence[\s\S]*unselected locale content/
    );
  });

  it('requires controlled Tokamak calculus pages to retain visible and structured shared authorship', () => {
    const route = '/tokamak/en/blog/integrated-understanding-of-calculus-symbols/';
    const probe: TokamakPageProbe = { kind: 'tokamak-page', route, role: 'calculus', locale: 'en' };
    const valid = tokamakCalculusHtml(route, 'en');
    expect(() => validateLiveProbe(probe, htmlResponse(valid), encoder.encode(valid))).not.toThrow();

    const invalid = tokamakCalculusHtml(route, 'en', 'https://hoonseokyoon.github.io/tokamak/#person');
    expect(() => validateLiveProbe(probe, htmlResponse(invalid), encoder.encode(invalid))).toThrow(
      /BlogPosting JSON-LD is not authored by the shared Person/
    );
  });
});
