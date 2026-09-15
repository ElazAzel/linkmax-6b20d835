import { test, expect } from '@playwright/test';
import { AUTHENTICATED_E2E_SKIP_REASON, hasE2ECredentials } from './support/auth';

test.skip(!hasE2ECredentials, AUTHENTICATED_E2E_SKIP_REASON);

test.describe('Zone Monetization Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard/zone-settings');
    });

    test('should allow navigating to billing and seeing plans', async ({ page }) => {
        await page.getByRole('tab', { name: /Billing|Оплата/i }).click();

        await expect(page.locator('[data-testid="zone-plan-selector"]')).toBeVisible();
        await expect(page.locator('[data-testid="zone-plan-selector"]')).toContainText(/Current Plan|Текущий/i);
    });

    test('should initiate upgrade session', async ({ page }) => {
        await page.route('**/functions/v1/create-payment-session*', async (route) => {
            await route.fulfill({
                json: {
                    success: true,
                    paymentUrl: 'https://auth.robokassa.ru/Merchant/Index.aspx?fake=true',
                    orderId: 'fake-zone-order',
                },
            });
        });

        await page.getByRole('tab', { name: /Billing|Оплата/i }).click();

        const upgradeButton = page
            .locator('[data-testid="zone-plan-selector"] button')
            .filter({ hasText: /Upgrade|Улучшить|Повысить/i })
            .first();
        await expect(upgradeButton).toBeVisible();
        await upgradeButton.click();
    });
});
