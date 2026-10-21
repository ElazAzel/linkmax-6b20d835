import { test, expect } from '@playwright/test';

/**
 * Smoke-набор: публичные маршруты должны отвечать даже если бэкенд недоступен.
 * Проверяем, что приложение не падает в белый экран и рендерит каркас.
 */
const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/gallery',
  '/customers',
  '/auth',
  '/dlya/salon-krasoty',
  '/alternatives/linktree',
];

test.describe('public routes smoke', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      const fatal: string[] = [];
      page.on('pageerror', (err) => fatal.push(err.message));

      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response?.status() ?? 200).toBeLessThan(400);

      // TanStack Start renders the document itself; there is no Vite #root.
      await expect(page.locator('h1, main, [role="main"]').first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole('heading', { name: "This page didn't load" })).toHaveCount(0);

      expect(fatal, `fatal errors on ${route}: ${fatal.join(' | ')}`).toHaveLength(0);
    });
  }
});

test.describe('private route access', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const route of ['/admin', '/admin/translations', '/admin/language-algorithms', '/admin/templates/new', '/dashboard/home']) {
    test(`requires sign-in for ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/auth(?:[/?#]|$)/, { timeout: 15_000 });
    });
  }
});
