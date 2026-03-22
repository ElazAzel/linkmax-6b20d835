import { test, expect } from '@playwright/test';

test.describe('CRM Workflow Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
        // In real E2E we'd handle login here.
        // For now we assume the session is active or we are in a dev environment.
        await page.goto('/dashboard');

        // Navigate to Zones if not already there
        const zonesLink = page.locator('text=/Zones|Зоны/i');
        if (await zonesLink.isVisible()) {
            await zonesLink.click();
        }
    });

    test('should navigate through CRM core screens', async ({ page }) => {
        // 1. Pick a zone
        const zoneCard = page.locator('[data-testid="zone-card"]').first();
        if (await zoneCard.isVisible()) {
            await zoneCard.click();
        }

        // 2. Check Contacts Screen
        const contactsTab = page.locator('[data-testid="zone-contacts-tab"]');
        await expect(contactsTab).toBeVisible();
        await contactsTab.click();
        await expect(page.locator('[data-testid="zone-contacts-title"]')).toBeVisible();

        // 3. Check Deals (Kanban)
        const dealsTab = page.locator('[data-testid="zone-deals-tab"]');
        await expect(dealsTab).toBeVisible();
        await dealsTab.click();

        // Verify Kanban title
        await expect(page.locator('[data-testid="zone-deals-title"]')).toBeVisible();

        // 4. Check Tasks
        const tasksTab = page.locator('[data-testid="zone-tasks-tab"]');
        await expect(tasksTab).toBeVisible();
        await tasksTab.click();
        await expect(page.locator('[data-testid="zone-tasks-title"]')).toBeVisible();
    });

    test('should open deal details and check for EDO integration', async ({ page }) => {
        await page.click('[data-testid="zone-deals-tab"]');

        // Click first deal if exists
        const dealCard = page.locator('[data-testid="deal-card"]').first();
        if (await dealCard.isVisible()) {
            await dealCard.click();

            // Check for Documents (EDO) tab in sheet
            const docsTab = page.locator('button:has-text("Документы"), button:has-text("Documents")');
            await expect(docsTab).toBeVisible();
            await docsTab.click();

            // Verify "Create Document" button
            await expect(page.locator('button:has-text("Создать"), button:has-text("Create")')).toBeVisible();
        }
    });
});
