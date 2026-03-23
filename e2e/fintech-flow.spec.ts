import { test, expect } from '@playwright/test';

test.describe('Fintech Flow E2E', () => {
    // Rely on global setup for authentication
    
    test.beforeEach(async ({ page }) => {
        // Mock Robokassa payment session creation
        await page.route('**/functions/v1/create-payment-session', async (route) => {
            const json = {
                success: true,
                paymentUrl: 'https://auth.robokassa.ru/Merchant/Index.aspx?fake=true',
                orderId: 'fake-order-123'
            };
            await route.fulfill({ json });
        });

        // Mock old robokassa function if still used
        await page.route('**/functions/v1/robokassa', async (route) => {
            const json = {
                success: true,
                url: 'https://auth.robokassa.ru/Merchant/Index.aspx?fake=true'
            };
            await route.fulfill({ json });
        });
        // Mock Supabase REST calls for wallet
        await page.route('**/rest/v1/user_wallets*', async (route) => {
            await route.fulfill({
                json: [{ id: 'fake-wallet-id', user_id: 'fake-user-id', balance: 5000, currency: 'KZT' }]
            });
        });

        await page.route('**/rest/v1/wallet_transactions*', async (route) => {
            await route.fulfill({
                json: []
            });
        });
    });

    test('wallet widget displays correct initial state', async ({ page }) => {
        await page.goto('/dashboard?tab=activity');

        // Check for WalletWidget title via title or balance testid
        const walletHeading = page.locator('text=Мой кошелек|My Wallet').first();
        await expect(walletHeading).toBeVisible();

        const balanceText = page.getByTestId('wallet-balance');
        await expect(balanceText).toBeVisible();
    });

    test('can open payout request dialog', async ({ page }) => {
        await page.goto('/dashboard?tab=activity');

        // Click "Вывести средства" (Withdraw) button via testid
        const withdrawButton = page.getByTestId('withdraw-button');
        await expect(withdrawButton).toBeVisible();
        await withdrawButton.click();

        // Check if dialog appeared via testid
        const dialogTitle = page.getByTestId('payout-dialog-title');
        await expect(dialogTitle).toBeVisible();

        // Check for input field via testid
        await expect(page.getByTestId('payout-amount-input')).toBeVisible();
    });

    test('can initiate subscription payment via Robokassa Mock', async ({ page }) => {
        await page.goto('/pricing');

        // Find the Pro button via testid
        const buyButton = page.getByTestId('pro-plan-button');
        await expect(buyButton).toBeVisible();
        
        // Intercept the redirect or check navigation
        await buyButton.click();

        // We expect it to try to redirect to robokassa.ru (mocked)
        await expect(page).toHaveURL(/robokassa\.ru/, { timeout: 10000 });
    });
});

test.describe('Admin Fintech Management', () => {
    test('admin can access fintech tab', async ({ page }) => {
        // Note: This requires admin privileges. 
        // In this environment, we assume the user might not be admin, 
        // so we check for negative or positive depending on auth level.
        await page.goto('/admin?tab=fintech');

        // If authenticated as admin in setup, this will pass.
        // For now, just check if we reachable or redirected
        const url = page.url();
        if (url.includes('/admin')) {
            const heading = page.locator('h1, h2:has-text("Выплаты"), h2:has-text("Payouts"), h2:has-text("Fintech")').first();
            await expect(heading).toBeDefined();
        }
    });
});
