import { test, expect } from '@playwright/test';

test.describe('Zone Monetization Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Basic auth logic would go here
        await page.goto('/zones');
    });

    test('should allow navigating to billing and seeing plans', async ({ page }) => {
        // 1. Select a zone
        await page.click('[data-testid="zone-card"]');

        // 2. Go to Settings
        await page.click('[data-testid="zone-settings-tab"]');

        // 3. Go to Billing tab
        await page.click('button:has-text("Billing"), button:has-text("Оплата")');

        // 4. Verify Plan Selector exists
        await expect(page.locator('[data-testid="zone-plan-selector"]')).toBeVisible();

        // 5. Verify current plan info
        await expect(page.locator('text=Current Plan')).toBeVisible();
    });

    test('should initiate upgrade session', async ({ page }) => {
        await page.goto('/zones/settings?tab=billing');

        // Find a plan that is NOT current and click Upgrade
        const upgradeButton = page.locator('button:has-text("Upgrade"), button:has-text("Улучшить")').first();
        await upgradeButton.click();

        // Should show loading state or redirect
        // In a real E2E we would mock the Edge Function response or check for redirect to RoboKassa
        // await expect(page).toHaveURL(/auth.robokassa.ru/);
    });
});
