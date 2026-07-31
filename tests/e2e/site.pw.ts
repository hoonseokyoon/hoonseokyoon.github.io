import { expect, test } from '@playwright/test';

test('root redirects to the default locale', async ({ request }) => {
  const response = await request.get('/');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('http-equiv="refresh" content="0;url=/ko/"');
});

test('home reads as a CV in both languages', async ({ page }) => {
  await page.goto('/ko/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await expect(page.getByRole('heading', { level: 1, name: 'Hoonseok Yoon' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '관심 분야' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '기술' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tokamak' }).first()).toBeVisible();

  await page.getByRole('navigation', { name: '언어 선택' }).getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Focus' })).toBeVisible();
});

test('language switch preserves the current route', async ({ page }) => {
  await page.goto('/ko/outputs/');
  await page.getByRole('navigation', { name: '언어 선택' }).getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/outputs\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Outputs' })).toBeVisible();
});

test('project detail links out to the related Tokamak knowledge', async ({ page }) => {
  await page.goto('/ko/projects/tokamak/');
  await expect(page.getByRole('heading', { level: 1, name: 'Tokamak' })).toBeVisible();
  await expect(page.getByRole('link', { name: /상미분방정식 6부작/ })).toHaveAttribute(
    'href',
    'https://hoonseokyoon.github.io/tokamak/ko/projects/ordinary-differential-equations/'
  );
});

test('index pages render their records', async ({ page }) => {
  await page.goto('/ko/timeline/');
  await expect(page.getByRole('heading', { level: 2, name: 'Tokamak 프로젝트 시작' })).toBeVisible();
  // Records nest under their group heading, so they are h3 here.
  await page.goto('/ko/projects/');
  await expect(page.getByRole('heading', { level: 2, name: '진행 중' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Tokamak' })).toBeVisible();
});

test('layout survives a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  for (const path of ['/ko/', '/ko/projects/tokamak/']) {
    await page.goto(path);
    const { viewport, scroll } = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    expect(scroll, `horizontal overflow on ${path}`).toBeLessThanOrEqual(viewport + 1);
  }
});
