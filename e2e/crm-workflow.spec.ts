import { test, expect } from '@playwright/test';

test.describe('CRM Workflow Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/dashboard');
        
        // Wait for main dashboard container to be visible instead of generic loader
        // This ensures the page is actually mounted
        await expect(page.locator('main')).toBeVisible({ timeout: 15000 });

        // Ensure we are in a zone.
        const zoneDashboardTab = page.getByTestId('zone-dashboard-tab');
        
        // If zone items are not visible, try to select a zone
        if (!await zoneDashboardTab.isVisible()) {
            console.log('Zone items not found in sidebar, checking if they appear after a short wait...');
            await page.waitForTimeout(2000);
        }

        // If STILL not visible, try selecting from switcher
        if (!await zoneDashboardTab.isVisible()) {
            console.log('Zone items still not found, triggering switcher...');
            // Zone switcher has Building2 icon
            const switcher = page.locator('button:has(.lucide-building-2), button:has-text("Select zone"), button:has-text("Выбрать зону")').first();
            if (await switcher.isVisible()) {
                await switcher.click();
                await page.waitForTimeout(1000); // Wait for dropdown animation
                const firstZone = page.getByTestId('zone-card').first();
                if (await firstZone.isVisible()) {
                    await firstZone.click();
                }
            }
        }
        
        // Final expectation: we must see at least one zone-prefixed tab
        await expect(page.getByTestId('zone-dashboard-tab')).toBeVisible({ timeout: 10000 });
    });

    test('should navigate through CRM core screens', async ({ page }) => {
        // 1. Contacts
        const contactsTab = page.getByTestId('zone-contacts-tab');
        await expect(contactsTab).toBeVisible();
        await contactsTab.click();
        
        // Check for title - wait for it to be visible as screen loads lazily
        await expect(page.getByTestId('zone-contacts-title')).toBeVisible({ timeout: 10000 });

        // 2. Deals
        const dealsTab = page.getByTestId('zone-deals-tab');
        await expect(dealsTab).toBeVisible();
        await dealsTab.click();
        await expect(page.getByTestId('zone-deals-title')).toBeVisible({ timeout: 10000 });

        // 3. Tasks
        const tasksTab = page.getByTestId('zone-tasks-tab');
        await expect(tasksTab).toBeVisible();
        await tasksTab.click();
        await expect(page.getByTestId('zone-tasks-title')).toBeVisible({ timeout: 10000 });
    });

    test('should open deal details and check for documents integration', async ({ page }) => {
        await page.getByTestId('zone-deals-tab').click();
        
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
