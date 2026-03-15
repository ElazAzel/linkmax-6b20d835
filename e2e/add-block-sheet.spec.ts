import { test, expect } from '@playwright/test';

test.skip(({ browserName }) => browserName !== 'chromium', 'Visual add-block regression is captured on Chromium baseline only.');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

type ViewportName = keyof typeof VIEWPORTS;

async function openEditorWithAddBlock(page: import('@playwright/test').Page) {
  await page.goto('/admin/templates/new');
  await page.waitForLoadState('networkidle');

  const trigger = page.getByTestId('add-block-trigger').first();
  await expect(trigger).toBeVisible({ timeout: 15000 });
  return trigger;
}

async function openSheet(page: import('@playwright/test').Page, trigger: import('@playwright/test').Locator) {
  await trigger.click();
  await expect(page.getByTestId('add-block-sheet')).toBeVisible();
}

for (const [name, viewport] of Object.entries(VIEWPORTS) as [ViewportName, { width: number; height: number }][]) {
  test.describe(`Add block sheet (${name})`, () => {
    test.use({ viewport });

    test('open/close sheet via close button, overlay and ESC', async ({ page }) => {
      const trigger = await openEditorWithAddBlock(page);

      await openSheet(page, trigger);
      await expect(page).toHaveScreenshot(`add-block-${name}-opened.png`, { fullPage: true, maxDiffPixelRatio: 0.05 });

      await page.getByTestId('add-block-sheet-close').click();
      await expect(page.getByTestId('add-block-sheet')).toBeHidden();

      await openSheet(page, trigger);
      await page.mouse.click(20, 20);
      await expect(page.getByTestId('add-block-sheet')).toBeHidden();

      await openSheet(page, trigger);
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('add-block-sheet')).toBeHidden();
    });

    test('insert block closes sheet and reopen resets empty search', async ({ page }) => {
      const trigger = await openEditorWithAddBlock(page);

      await openSheet(page, trigger);

      const search = page.getByTestId('add-block-search');
      await search.fill('text');
      await expect(search).toHaveValue('text');
      await expect(page).toHaveScreenshot(`add-block-${name}-search-filled.png`, { fullPage: true, maxDiffPixelRatio: 0.05 });

      await page.getByTestId('add-block-option-text').click();
      await expect(page.getByTestId('add-block-sheet')).toBeHidden();

      await expect(page).toHaveScreenshot(`add-block-${name}-after-insert.png`, { fullPage: true, maxDiffPixelRatio: 0.05 });

      await trigger.click();
      await expect(page.getByTestId('add-block-sheet')).toBeVisible();
      await expect(page.getByTestId('add-block-search')).toHaveValue('');
      await expect(page).toHaveScreenshot(`add-block-${name}-reopen-empty-search.png`, { fullPage: true, maxDiffPixelRatio: 0.05 });
    });
  });
}
