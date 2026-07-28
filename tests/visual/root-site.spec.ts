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

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Preview fixture');
});

for (const width of [1440, 1024, 901, 900, 681, 680, 390, 320]) {
  test(`${width}px fixture keeps all records inside the viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByRole('heading', { name: 'Fixture Person' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '선별 프로젝트' })).toBeVisible();
    await expect(
      page.locator('#fixture-software').getByRole('link', {
        name: /Fixture source package with a deliberately long canonical title/
      })
    ).toBeVisible();
    await expectNoUnexpectedHorizontalOverflow(page);
  });
}

test('681/680 boundary switches project cards from flexible grid to one column', async ({ page }) => {
  const grid = page.locator('.project-grid');
  await page.setViewportSize({ width: 681, height: 900 });
  expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns)).not.toBe('none');
  await page.setViewportSize({ width: 680, height: 900 });
  expect((await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns)).split(' ').length).toBe(1);
});

test('source-language Output is marked as English inside the Korean fixture', async ({ page }) => {
  await expect(page.locator('#fixture-software')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#fixture-software .language-badge')).toHaveText('EN');
});

test('timeline and Output knowledge links keep localized targets and unique accessible headings', async ({ page }) => {
  const timeline = page.locator('#fixture-project-period');
  const output = page.locator('#fixture-software');

  await expect(timeline.getByRole('link', { name: '합성 지식 프로젝트' })).toHaveAttribute(
    'href',
    'https://hoonseokyoon.github.io/tokamak/ko/projects/fixture-knowledge-project/'
  );
  await expect(output.getByRole('link', { name: 'Synthetic output notes' })).toHaveAttribute(
    'href',
    'https://hoonseokyoon.github.io/tokamak/en/categories/fixture-output-notes/'
  );
  await expect(output.getByRole('link', { name: 'Synthetic output notes' })).toHaveAttribute('lang', 'en');

  const headingIds = await page
    .locator('.record-knowledge :is(h3, h4)')
    .evaluateAll((headings) => headings.map((heading) => heading.id));
  expect(headingIds).toEqual([
    'timeline-fixture-project-period-knowledge-title',
    'output-fixture-software-knowledge-title'
  ]);
  expect(new Set(headingIds).size).toBe(headingIds.length);
  await expect(timeline.locator('.record-knowledge')).toHaveAttribute('lang', 'ko');
  await expect(output.locator('.record-knowledge')).toHaveAttribute('lang', 'ko');
});

test('fixture record headings remain below their section headings', async ({ page }) => {
  await expect(page.locator('#projects').getByRole('heading', { level: 2, name: '선별 프로젝트' })).toBeVisible();
  await expect(
    page.locator('#projects').getByRole('heading', {
      level: 3,
      name: '경로와 콘텐츠 계약을 검증하는 합성 프로젝트'
    })
  ).toBeVisible();
  await expect(page.locator('#timeline').getByRole('heading', { level: 3, name: '합성 프로젝트 진행' })).toBeVisible();
});
