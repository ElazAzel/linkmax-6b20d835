import { test, expect } from '@playwright/test';

test.describe('landing examples use real page styling', () => {
  for (const name of ['Aruzhan Nails', 'Dana English', 'Timur Shot']) {
    test(`renders ${name} with the public profile and block grid`, async ({ page }, testInfo) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('tab', { name }).click();
      const demo = page.getByRole('tabpanel', { name });
      await expect(demo).toHaveClass(/lm-page/);
      await expect(demo.getByRole('heading', { name, level: 1 })).toBeVisible();
      await expect(demo.locator('.lm-profile-row')).toBeVisible();
      await expect(demo.locator('[data-lm-grid]').first()).toBeAttached();
      await expect(demo).toHaveClass(name === 'Timur Shot' ? /\bdark\b/ : /lm-typography/);
      const tokens = await demo.evaluate(element => {
        const style = getComputedStyle(element);
        return { primary: style.getPropertyValue('--primary').trim(), font: style.getPropertyValue('--lm-body-font').trim() };
      });
      expect(tokens.primary).toBeTruthy();
      expect(tokens.primary).not.toContain('#');
      expect(tokens.font).toBeTruthy();
      await demo.screenshot({ path: testInfo.outputPath('demo.png') });
    });
  }
});
