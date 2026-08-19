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

      // Каркас приложения смонтирован (root не пустой)
      await expect(page.locator('#root')).not.toBeEmpty();
      // Есть хотя бы один заголовок или основной контент
      await expect(page.locator('h1, main, [role="main"]').first()).toBeVisible({ timeout: 15_000 });

      expect(fatal, `fatal errors on ${route}: ${fatal.join(' | ')}`).toHaveLength(0);
    });
  }
});
