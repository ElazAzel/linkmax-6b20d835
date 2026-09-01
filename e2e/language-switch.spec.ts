import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

async function openLanguageMenu(page: Parameters<typeof test>[0]['page']) {
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    const mobileMenuTrigger = page.getByRole('button', { name: /открыть меню|open menu/i });
    const mobileCloseTrigger = page.getByRole('button', { name: /закрыть меню|close menu/i });
    if (!(await mobileCloseTrigger.isVisible().catch(() => false))) {
      await expect(mobileMenuTrigger).toBeVisible({ timeout: 30_000 });
      await mobileMenuTrigger.click();
    }
  }

  const trigger = page.locator('[data-testid="language-switcher-trigger"]:visible').first();
  await expect(trigger).toBeVisible({ timeout: 30_000 });
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
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('inkmax_v2_i18nextLng'))).toBe(languageCode);
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function resetLanguageToRu(page: Parameters<typeof test>[0]['page']) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.setItem('inkmax_v2_i18nextLng', 'ru');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
}

async function dismissCookieConsent(page: Parameters<typeof test>[0]['page']) {
  const consent = page.getByRole('dialog', { name: /cookie|согласие/i });
  const decision = consent.getByRole('button', { name: /отклон|прин|reject|accept/i }).first();

  await decision.waitFor({ state: 'visible', timeout: 2_500 }).catch(() => undefined);
  if (await decision.isVisible().catch(() => false)) {
    await decision.click();
  }
}

test.describe('Language switcher', () => {
  test.setTimeout(60_000);

  test('updates landing page copy', async ({ page }) => {
    await resetLanguageToRu(page);
    await dismissCookieConsent(page);

    await expect(page.getByTestId('landing-hero-badge')).toHaveText('Для специалистов и сервисного бизнеса', { timeout: 20_000 });
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

  test('preserves language across public pages', async ({ page }) => {
    await resetLanguageToRu(page);
    await dismissCookieConsent(page);

    await switchLanguage(page, 'en');
    await page.goto('/pricing');
    await expect(page.getByTestId('pricing-title')).toHaveText('Choose the right tariff', { timeout: 20_000 });
    await expect(page.getByTestId('pricing-description')).toHaveText('Unlock all the features of LinkMAX.my for your business');

    await page.goto('/alternatives');
    await expect(page.getByTestId('alternatives-hero-badge')).toHaveText('Comparison guide');
    await expect(page.getByTestId('alternatives-hero-title')).toHaveText('LinkMAX vs Linktree, Taplink, Carrd, Beacons');
    await expect(page.getByTestId('alternatives-hero-description')).toContainText('what tasks is LinkMAX suitable for');
  });
});
