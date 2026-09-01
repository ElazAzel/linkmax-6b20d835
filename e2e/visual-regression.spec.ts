import { test, expect } from '@playwright/test';

test.skip(process.platform !== 'win32', 'Visual baselines are currently maintained for the Windows Chromium renderer.');
test.skip(({ browserName }) => browserName !== 'chromium', 'Visual baselines are captured on Chromium only.');

async function prepareLanding(page: import('@playwright/test').Page) {
    await page.goto('/');
    await expect(page.getByTestId('landing-hero-title')).toBeVisible({ timeout: 30_000 });

    const consent = page.getByRole('dialog', { name: /cookie|согласие/i });
    if (await consent.isVisible().catch(() => false)) {
        await consent.getByRole('button').first().click();
    }
}

/**
 * Visual Regression Tests for lnkmx Grid Blocks
 * Ensures "Liquid Glass" design system remains consistent across deployments.
 */
test.describe('Visual Regression: Grid Blocks', () => {

    test.beforeEach(async ({ page }) => {
        await prepareLanding(page);
    });

    test('desktop: grid blocks should maintain glassmorphism styles', async ({ page }) => {
        await expect(page).toHaveScreenshot('grid-blocks-desktop.png', {
            maxDiffPixelRatio: 0.05,
        });
    });

    test('mobile: grid layout check', async ({ page }) => {
        // Set viewport to a common mobile size
        await page.setViewportSize({ width: 390, height: 844 });
        await page.reload();
        await expect(page.getByTestId('landing-hero-title')).toBeVisible({ timeout: 30_000 });

        await expect(page).toHaveScreenshot('grid-blocks-mobile.png', {
            maxDiffPixelRatio: 0.05,
        });
    });

    test('analytics card visual consistency', async ({ page }) => {
        // If we are on a page with analytics (like dashboard)
        // Note: requires auth, so we check for public visibility first
        const analyticsFunnel = page.locator('.conversion-funnel-card').first();

        if (await analyticsFunnel.count() > 0) {
            await expect(analyticsFunnel).toHaveScreenshot('conversion-funnel.png', {
                maxDiffPixelRatio: 0.05,
            });
        }
    });
});
