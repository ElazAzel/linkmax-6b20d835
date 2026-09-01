import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function openLanguageMenu(page: Parameters<typeof test>[0]['page']) {
  const trigger = page.getByTestId('language-switcher-trigger');
  await expect(trigger).toBeVisible();
  if ((await trigger.getAttribute('data-state')) !== 'open') {
    await trigger.click();
  }
  await expect(trigger).toHaveAttribute('data-state', 'open');
}

async function switchLanguage(page: Parameters<typeof test>[0]['page'], languageCode: 'ru' | 'en' | 'kk') {
  await openLanguageMenu(page);
  await page.getByTestId(`language-option-${languageCode}`).click();
  await expect(page.getByTestId('language-switcher-trigger')).toHaveAttribute(
    'aria-label',
    new RegExp(languageCode === 'ru' ? 'Русский' : languageCode === 'en' ? 'English' : 'Қазақша')
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function resetLanguageToRu(page: Parameters<typeof test>[0]['page']) {
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('inkmax_v2_i18nextLng')) {
      window.localStorage.setItem('inkmax_v2_i18nextLng', 'ru');
    }
  });
}

async function dismissCookieConsent(page: Parameters<typeof test>[0]['page']) {
  const consent = page.getByRole('dialog', { name: /cookie|согласие/i });
  if (await consent.isVisible().catch(() => false)) {
    await consent.getByRole('button').first().click();
  }
}

test.describe('Language switcher', () => {
  test('updates landing page copy', async ({ page }) => {
    await resetLanguageToRu(page);
    await page.goto('/');
    await dismissCookieConsent(page);

    await expect(page.getByTestId('landing-hero-badge')).toHaveText('Для специалистов и сервисного бизнеса');
    await expect(page.getByTestId('landing-hero-title')).toContainText('Клиент выбирает, записывается и оплачивает — по одной ссылке');
    await expect(page.getByTestId('landing-hero-description')).toContainText('LinkMAX помогает пройти весь путь без лишней переписки');
    await expect(page.getByTestId('landing-hero-primary-cta')).toHaveText('Создать бесплатно');
    await expect(page.getByTestId('landing-hero-secondary-cta')).toHaveText('посмотреть примеры');

    await switchLanguage(page, 'en');
    await expect(page.getByTestId('landing-hero-badge')).toHaveText('For independent professionals and service businesses');
    await expect(page.getByTestId('landing-hero-title')).toContainText('Clients choose, book and pay — through one link');
    await expect(page.getByTestId('landing-hero-description')).toContainText('LinkMAX keeps the journey clear without endless messages');
    await expect(page.getByTestId('landing-hero-primary-cta')).toHaveText('Start for free');
    await expect(page.getByTestId('landing-hero-secondary-cta')).toHaveText('see examples');

    await switchLanguage(page, 'kk');
    await expect(page.getByTestId('landing-hero-badge')).toHaveText('Мамандар мен қызмет көрсету бизнесіне');
    await expect(page.getByTestId('landing-hero-title')).toContainText('Клиент таңдайды, жазылады және төлейді — бәрі бір сілтемеде');
    await expect(page.getByTestId('landing-hero-description')).toContainText('LinkMAX клиент жолын артық хат-хабарсыз түсінікті етеді');
    await expect(page.getByTestId('landing-hero-primary-cta')).toHaveText('Тегін бастау');
    await expect(page.getByTestId('landing-hero-secondary-cta')).toHaveText('мысалдарды көру');
  });

  test('preserves language across pages and localizes toast', async ({ page }) => {
    await resetLanguageToRu(page);
    await page.goto('/');
    await dismissCookieConsent(page);

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
