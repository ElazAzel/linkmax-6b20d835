import { test, expect } from '@playwright/test';

async function openLanguageMenu(page: Parameters<typeof test>[0]['page']) {
  await page.getByTestId('language-switcher-trigger').click();
}

async function switchLanguage(page: Parameters<typeof test>[0]['page'], languageCode: 'ru' | 'en' | 'kk') {
  await openLanguageMenu(page);
  await page.getByTestId(`language-option-${languageCode}`).click();
}

async function resetLanguageToRu(page: Parameters<typeof test>[0]['page']) {
  await page.addInitScript(() => {
    window.localStorage.setItem('i18nextLng', 'ru');
  });
}

test.describe('Language switcher', () => {
  test('updates landing page copy', async ({ page }) => {
    await resetLanguageToRu(page);
    await page.goto('/');

    await expect(page.getByTestId('landing-hero-badge')).toHaveText('AI-конструктор мини-сайтов');
    await expect(page.getByTestId('landing-hero-title')).toContainText('Соберите продающий мини-сайт за ~2 минуты');
    await expect(page.getByTestId('landing-hero-description')).toContainText('AI-конструктор сайтов для экспертов');
    await expect(page.getByTestId('landing-hero-primary-cta')).toHaveText('Создать страницу бесплатно');
    await expect(page.getByTestId('landing-hero-secondary-cta')).toHaveText('Посмотреть примеры');

    await switchLanguage(page, 'en');
    await expect(page.getByTestId('landing-hero-badge')).toHaveText('AI Mini-Site Builder');
    await expect(page.getByTestId('landing-hero-title')).toContainText('Build a selling mini-site in ~2 minutes');
    await expect(page.getByTestId('landing-hero-description')).toContainText('AI site builder for experts, freelancers and businesses');
    await expect(page.getByTestId('landing-hero-primary-cta')).toHaveText('Create page for free');
    await expect(page.getByTestId('landing-hero-secondary-cta')).toHaveText('View examples');

    await switchLanguage(page, 'kk');
    await expect(page.getByTestId('landing-hero-badge')).toHaveText('AI мини-сайт конструкторы');
    await expect(page.getByTestId('landing-hero-title')).toContainText('Сатып тұрған мини-сайтты ~2 минутта жинаңыз');
    await expect(page.getByTestId('landing-hero-description')).toContainText('Мамандар, фрилансерлер мен бизнеске арналған');
    await expect(page.getByTestId('landing-hero-primary-cta')).toHaveText('Бетті тегін жасау');
    await expect(page.getByTestId('landing-hero-secondary-cta')).toHaveText('Мысалдарды көру');
  });

  test('preserves language across pages and localizes toast', async ({ page }) => {
    await resetLanguageToRu(page);
    await page.goto('/');

    await switchLanguage(page, 'en');
    await page.goto('/pricing');
    await expect(page.getByTestId('pricing-title')).toHaveText('Choose plan');
    await expect(page.getByTestId('pricing-description')).toHaveText('Unlock all LinkMAX features for your business');

    await page.getByTestId('pricing-plan-basic-cta').click();
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toContainText('The free plan is already active');

    await page.goto('/alternatives');
    await expect(page.getByTestId('alternatives-hero-badge')).toHaveText('2026 Comparison');
    await expect(page.getByTestId('alternatives-hero-title')).toHaveText('LinkMAX vs Linktree vs Taplink');
    await expect(page.getByTestId('alternatives-hero-description')).toContainText('Discover why thousands of users');
  });
});
