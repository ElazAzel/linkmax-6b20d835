import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for lnkmx Grid Blocks
 * Ensures "Liquid Glass" design system remains consistent across deployments.
 */
test.describe('Visual Regression: Grid Blocks', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to homepage or a specific test page
        await page.goto('/');
        // Inject some delay for framer-motion animations to settle
        await page.waitForTimeout(1000);
    });

    test('desktop: grid blocks should maintain glassmorphism styles', async ({ page }) => {
        // Target the main renderer area
        const renderer = page.locator('main, .grid-blocks-renderer').first();

        // Check if the renderer is present
        if (await renderer.count() > 0) {
            await expect(renderer).toHaveScreenshot('grid-blocks-desktop.png', {
                maxDiffPixelRatio: 0.05,
            });
        } else {
            console.log('Grid blocks renderer not found on this page, skipping screenshot comparison.');
        }
    });

    test('mobile: grid layout check', async ({ page }) => {
        // Set viewport to a common mobile size
        await page.setViewportSize({ width: 390, height: 844 });
        await page.reload();
        await page.waitForTimeout(1000);

        // Full page screenshot to check responsiveness
        await expect(page).toHaveScreenshot('grid-blocks-mobile.png', {
            fullPage: true,
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
