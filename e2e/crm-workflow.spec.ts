import { test, expect } from '@playwright/test';
import { AUTHENTICATED_E2E_SKIP_REASON, hasE2ECredentials } from './support/auth';

test.skip(!hasE2ECredentials, AUTHENTICATED_E2E_SKIP_REASON);

test.describe('CRM Workflow Smoke Test', () => {
    const openMobileMenu = async (page: import('@playwright/test').Page) => {
        const menuButton = page.locator('button[aria-label="Меню"], button[aria-label="Menu"]').first();
        if (await menuButton.isVisible()) {
            await menuButton.click();
        }
    };

    const clickZoneTab = async (page: import('@playwright/test').Page, testId: string) => {
        const tab = page.getByTestId(testId);
        if (!await tab.isVisible()) {
            await openMobileMenu(page);
        }
        await expect(tab).toBeVisible({ timeout: 10000 });
        await tab.click();
    };

    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        
        // Wait for main dashboard container to be visible instead of generic loader
        // This ensures the page is actually mounted
        await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

        await clickZoneTab(page, 'zone-dashboard-tab');
    });

    test('should navigate through CRM core screens', async ({ page }) => {
        // 1. Contacts
        await clickZoneTab(page, 'zone-contacts-tab');
        
        // Check for title - wait for it to be visible as screen loads lazily
        await expect(page.getByTestId('zone-contacts-title')).toBeVisible({ timeout: 10000 });

        // 2. Deals
        await clickZoneTab(page, 'zone-deals-tab');
        await expect(page.getByTestId('zone-deals-title')).toBeVisible({ timeout: 10000 });

        // 3. Tasks
        await clickZoneTab(page, 'zone-tasks-tab');
        await expect(page.getByTestId('zone-tasks-title')).toBeVisible({ timeout: 10000 });
    });

    test('should open deal details and check for documents integration', async ({ page }) => {
        await clickZoneTab(page, 'zone-deals-tab');
        
        // Wait for deal cards
        const dealCard = page.getByTestId('deal-card').first();
        
        // If deals exist, check the details
        if (await dealCard.isVisible()) {
            await dealCard.click();
            
            // Documents tab in Deal Sheet
            const docsTab = page.locator('button:has-text("Документы"), button:has-text("Documents")').first();
            await expect(docsTab).toBeVisible();
            await docsTab.click();
            
            // Create Document button (EDO)
            const createBtn = page.locator('button:has-text("Создать"), button:has-text("Create")').first();
            await expect(createBtn).toBeVisible();
        } else {
            console.log('Note: No deal cards found in this zone, skipping details check.');
        }
    });
});
