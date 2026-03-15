import { test, expect } from '@playwright/test';

const EDITOR_ROUTE = '/dashboard/home?tab=editor';

async function openAddBlockSheetFromFab(page: import('@playwright/test').Page) {
  await page.locator('[data-onboarding="add-block"]').click();
}

async function getAddBlockDialog(page: import('@playwright/test').Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe('Add block sheet — desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'Desktop-only scenario');

  test('open/close in 3 ways, insert block with auto-close, and reset search on reopen', async ({ page }) => {
    await page.goto(EDITOR_ROUTE);

    // 1) Open via floating add button, close via sheet close button
    await openAddBlockSheetFromFab(page);
    const firstDialog = await getAddBlockDialog(page);
    await expect(firstDialog).toHaveScreenshot('editor-add-sheet-desktop-open-fab.png');
    await firstDialog.getByRole('button', { name: /close/i }).click();
    await expect(firstDialog).toBeHidden();

    // 2) Open via insert-between button, close via Escape
    await page.getByRole('button', { name: 'Insert block here' }).first().click();
    const secondDialog = await getAddBlockDialog(page);
    await secondDialog.getByRole('textbox').fill('text');
    await page.keyboard.press('Escape');
    await expect(secondDialog).toBeHidden();

    // 3) Open via floating add button again, close by clicking overlay
    await openAddBlockSheetFromFab(page);
    const thirdDialog = await getAddBlockDialog(page);
    await page.mouse.click(20, 20);
    await expect(thirdDialog).toBeHidden();

    // Add block and verify auto-close
    await openAddBlockSheetFromFab(page);
    const insertDialog = await getAddBlockDialog(page);
    const visibleBlockButtons = insertDialog
      .locator('button:has(span)')
      .filter({ hasNot: insertDialog.locator('[class*="cursor-not-allowed"]') });
    await visibleBlockButtons.first().click();
    await expect(insertDialog).toBeHidden();

    // Reopen and verify search reset
    await openAddBlockSheetFromFab(page);
    const reopenDialog = await getAddBlockDialog(page);
    await expect(reopenDialog.getByRole('textbox')).toHaveValue('');
    await expect(reopenDialog).toHaveScreenshot('editor-add-sheet-desktop-reopen-reset.png');
  });
});

test.describe('Add block sheet — mobile viewport', () => {
  test.skip(({ isMobile }) => !isMobile, 'Mobile-only scenario');

  test('open, add block with auto-close and keep search reset on reopen', async ({ page }) => {
    await page.goto(EDITOR_ROUTE);

    await openAddBlockSheetFromFab(page);
    const dialog = await getAddBlockDialog(page);
    await expect(dialog).toHaveScreenshot('editor-add-sheet-mobile-open.png');

    await dialog.getByRole('textbox').fill('text');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await openAddBlockSheetFromFab(page);
    const reopenDialog = await getAddBlockDialog(page);
    await expect(reopenDialog.getByRole('textbox')).toHaveValue('');

    const visibleBlockButtons = reopenDialog
      .locator('button:has(span)')
      .filter({ hasNot: reopenDialog.locator('[class*="cursor-not-allowed"]') });
    await visibleBlockButtons.first().click();
    await expect(reopenDialog).toBeHidden();

    await openAddBlockSheetFromFab(page);
    const finalDialog = await getAddBlockDialog(page);
    await expect(finalDialog.getByRole('textbox')).toHaveValue('');
    await expect(finalDialog).toHaveScreenshot('editor-add-sheet-mobile-reopen-reset.png');
  });
});
