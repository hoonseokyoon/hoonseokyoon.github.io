import { expect, test, type Page } from '@playwright/test';

async function expectNoUnexpectedHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    root: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(result.root, `root overflow at ${result.viewport}px`).toBeLessThanOrEqual(result.viewport + 1);
  expect(result.body, `body overflow at ${result.viewport}px`).toBeLessThanOrEqual(result.viewport + 1);
}

test('root is a noindex static locale redirect', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('http-equiv="refresh" content="0;url=/ko/"');
  expect(html).toContain('name="robots" content="noindex, follow"');
  expect(html).toContain('href="https://hoonseokyoon.github.io/ko/"');
});

test('localized home exposes the approved public record in both languages', async ({ page }) => {
  await page.goto('/ko/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  const primaryNavigation = page.getByRole('navigation', { name: '주요 메뉴' });
  await expect(primaryNavigation).toBeVisible();
  await expect(primaryNavigation.getByRole('link', { name: '지식', exact: true })).toHaveAttribute(
    'href',
    'https://hoonseokyoon.github.io/tokamak/ko/'
  );
  await expect(page.getByRole('heading', { level: 1, name: 'Hoonseok Yoon' })).toBeVisible();
  await expect(page.getByText('개인 이력과 프로젝트 기록', { exact: true })).toBeVisible();

  const projects = page.locator('section[aria-labelledby="selected-projects-title"]');
  await expect(projects.getByRole('heading', { level: 3, name: 'Tokamak' })).toBeVisible();
  await expect(
    projects.getByText(
      '공부 글과 기술 설명을 Project → SubProject → LearningNode 구조로 연결하는 이중 언어 지식 사이트입니다.',
      { exact: true }
    )
  ).toBeVisible();
  await expect(projects.getByText('0 지식', { exact: true })).toHaveCount(0);

  const outputs = page.locator('section[aria-labelledby="recent-outputs-title"]');
  await expect(outputs.getByRole('heading', { level: 3, name: 'Tokamak SvelteKit 사이트' })).toBeVisible();
  await expect(
    outputs.getByText('모든 페이지를 미리 렌더링해 GitHub Pages에서 제공하는 이중 언어 지식 사이트입니다.', {
      exact: true
    })
  ).toBeVisible();

  const knowledge = page.locator('section[aria-labelledby="knowledge-gateway-title"]');
  await expect(knowledge.getByRole('heading', { name: '설명과 학습 기록은 Tokamak에 있습니다.' })).toBeVisible();
  await expect(knowledge.getByRole('link', { name: /Tokamak에서 지식 탐색/ })).toHaveAttribute(
    'href',
    'https://hoonseokyoon.github.io/tokamak/ko/'
  );
  await expect(page.getByRole('heading', { name: '개인 콘텐츠 공개 확인이 필요합니다.' })).toHaveCount(0);

  const english = page.getByRole('navigation', { name: '언어 선택' }).getByRole('link', { name: 'EN' });
  await english.click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('A record of personal history and projects', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Tokamak SvelteKit Site' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Explanations and study notes live in Tokamak.' })).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Knowledge', exact: true })
  ).toHaveAttribute('href', 'https://hoonseokyoon.github.io/tokamak/en/');

  await page.getByRole('navigation', { name: 'Language selection' }).getByRole('link', { name: 'KO' }).click();
  await expect(page).toHaveURL(/\/ko\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
});

test('language switch preserves a core route', async ({ page }) => {
  await page.goto('/ko/outputs/');
  await page.getByRole('navigation', { name: '언어 선택' }).getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/outputs\/$/);
  await expect(page.getByRole('heading', { name: 'Outputs' })).toBeVisible();
});

test('record headings follow their containing section hierarchy', async ({ page }) => {
  await page.goto('/ko/projects/');
  await expect(page.getByRole('heading', { level: 2, name: '진행 중' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Tokamak' })).toBeVisible();

  await page.goto('/ko/timeline/');
  await expect(page.getByRole('heading', { level: 2, name: 'Tokamak 프로젝트 시작' })).toBeVisible();
});

test('Tokamak project detail connects the approved project, output, and timeline', async ({ page }) => {
  await page.goto('/ko/projects/tokamak/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1, name: 'Tokamak' })).toBeVisible();
  await expect(
    page.getByText(
      '공부 글과 기술 설명을 Project → SubProject → LearningNode 구조로 연결하는 이중 언어 지식 사이트입니다.',
      { exact: true }
    )
  ).toBeVisible();
  await expect(page.locator('.project-role')).toContainText('기획, 정보 구조 설계, 개발 및 운영');
  await expect(page.getByRole('link', { name: /website/ }).first()).toHaveAttribute(
    'href',
    'https://hoonseokyoon.github.io/tokamak/'
  );
  await expect(page.getByRole('heading', { name: '관련 산출물' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Tokamak SvelteKit 사이트' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '관련 이력' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Tokamak 프로젝트 시작' })).toBeVisible();
  const koKnowledge = page.locator('aside[aria-labelledby="project-tokamak-knowledge-title"]');
  await expect(koKnowledge.getByRole('heading', { name: '관련 지식 · Tokamak' })).toBeVisible();
  await expect(koKnowledge.getByText('과정에서 만든 지식', { exact: true })).toBeVisible();
  await expect(koKnowledge.getByRole('link', { name: /상미분방정식 6부작/ })).toHaveAttribute(
    'href',
    'https://hoonseokyoon.github.io/tokamak/ko/projects/ordinary-differential-equations/'
  );
  await expect(koKnowledge.getByRole('link', { name: /상미분방정식 6부작/ })).toHaveAttribute('lang', 'ko');
  await expect(
    page.locator('a[href="https://hoonseokyoon.github.io/tokamak/en/projects/ordinary-differential-equations/"]')
  ).toHaveCount(0);

  await page.getByRole('navigation', { name: '언어 선택' }).getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/projects\/tokamak\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByText(
      'A bilingual knowledge site connecting study notes and technical explanations through a Project → SubProject → LearningNode structure.',
      { exact: true }
    )
  ).toBeVisible();
  await expect(page.locator('.project-role')).toContainText(
    'Planning, information architecture, development, and maintenance'
  );
  const enKnowledge = page.locator('aside[aria-labelledby="project-tokamak-knowledge-title"]');
  await expect(enKnowledge.getByRole('heading', { name: 'Related knowledge · Tokamak' })).toBeVisible();
  await expect(enKnowledge.getByText('Knowledge produced', { exact: true })).toBeVisible();
  await expect(enKnowledge.getByRole('link', { name: /Six-part ODE series/ })).toHaveAttribute(
    'href',
    'https://hoonseokyoon.github.io/tokamak/en/projects/ordinary-differential-equations/'
  );
  await expect(enKnowledge.getByRole('link', { name: /Six-part ODE series/ })).toHaveAttribute('lang', 'en');
  await expect(
    page.locator('a[href="https://hoonseokyoon.github.io/tokamak/ko/projects/ordinary-differential-equations/"]')
  ).toHaveCount(0);
});

test('static compatibility documents contain canonical and visible destinations', async ({ request }) => {
  const expectations = [
    ['/projects/', '/en/projects/'],
    ['/blog/', '/tokamak/en/'],
    ['/review/', '/tokamak/en/categories/paper-review/'],
    ['/cv/', '/en/timeline/'],
    ['/repositories/', '/en/outputs/#software'],
    [
      '/blog/2024/Integrated-Understanding-of-Calculus-Symbols/',
      '/tokamak/en/blog/integrated-understanding-of-calculus-symbols/'
    ]
  ] as const;

  for (const [path, target] of expectations) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain(`content="0;url=${target}"`);
    expect(html).toContain(`href="${target}"`);
    expect(html).toContain('name="robots" content="noindex, follow"');
  }
});

test('unapproved publications compatibility route remains absent', async ({ request }) => {
  const response = await request.get('/publications/');
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).not.toContain('http-equiv="refresh"');
  expect(html).toContain('페이지를 찾을 수 없습니다.');
});

test('320px shell has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  await page.goto('/ko/');
  await expectNoUnexpectedHorizontalOverflow(page);
  await page.goto('/ko/projects/tokamak/');
  await expect(page.getByRole('link', { name: /상미분방정식 6부작/ })).toBeVisible();
  await expectNoUnexpectedHorizontalOverflow(page);
});

test('navigation remains usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/ko/projects/');
    await expect(page.getByRole('heading', { name: '프로젝트' })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: '주요 메뉴' }).getByRole('link', { name: '지식', exact: true })
    ).toHaveAttribute('href', 'https://hoonseokyoon.github.io/tokamak/ko/');
    await page.goto('http://127.0.0.1:4173/ko/projects/tokamak/');
    await expect(page.getByRole('link', { name: /상미분방정식 6부작/ })).toHaveAttribute(
      'href',
      'https://hoonseokyoon.github.io/tokamak/ko/projects/ordinary-differential-equations/'
    );
    await page.getByRole('navigation', { name: '언어 선택' }).getByRole('link', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en\/projects\/tokamak\/$/);
    await expect(page.getByRole('link', { name: /Six-part ODE series/ })).toHaveAttribute(
      'href',
      'https://hoonseokyoon.github.io/tokamak/en/projects/ordinary-differential-equations/'
    );
  } finally {
    await context.close();
  }
});
