import { test as setup, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AUTHENTICATED_E2E_SKIP_REASON, hasE2ECredentials } from './support/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

// Ensure we start with a clean state for authentication
setup.use({ storageState: { cookies: [], origins: [] } });
setup.setTimeout(120_000);

setup('authenticate', async ({ page }) => {
  const testEmail = process.env.E2E_TEST_EMAIL ?? '';
  const testPassword = process.env.E2E_TEST_PASSWORD ?? '';
  setup.skip(!hasE2ECredentials, AUTHENTICATED_E2E_SKIP_REASON);

  // Log console messages from the browser
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('error')) {
      console.log('BROWSER CONSOLE:', msg.text());
    }
  });

  console.log('Navigating to /auth...');
  await page.goto('/auth', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Wait for React to hydrate and page to be stable
  await page.waitForTimeout(2000);

  // The current auth screen can render the unified email-access form directly.
  // Keep the legacy tabbed path as a fallback so the setup remains compatible
  // while auth experiments are rolled out.
  try {
    const visibleEmailInput = page.locator('input[type="email"]:visible').first();

    if (!(await visibleEmailInput.isVisible().catch(() => false))) {
      const expandEmailForm = page.getByTestId('expand-email-form');
      if (await expandEmailForm.isVisible().catch(() => false)) {
        await expandEmailForm.click();
      }

      const signinTab = page.getByTestId('signin-tab');
      if (await signinTab.isVisible().catch(() => false)) {
        await signinTab.click();
      }
    }

    const emailInput = page.locator('input[type="email"]:visible').first();
    const passwordInput = page.locator('input[type="password"]:visible').first();

    await expect(emailInput).toBeVisible({ timeout: 20_000 });
    await emailInput.fill(testEmail);
    await passwordInput.fill(testPassword);
    
    console.log('Filled credentials, pressing Enter...');
    // Pressing Enter is often more reliable than clicking a button that might be obscured
    await passwordInput.press('Enter');

    // Most auth variants redirect immediately. Older variants show an explicit
    // continuation card, which remains supported during the transition.
    const continueToDashboard = page.getByTestId('continue-to-dashboard');
    if (await continueToDashboard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await continueToDashboard.click();
    }
    await page.waitForURL(url => url.pathname.includes('/dashboard') || url.pathname.includes('/onboarding'), { timeout: 60_000 });
    console.log('Successfully authenticated as', testEmail);
    
  } catch (error) {
    console.error('Authentication failed Error:', error.message);
    console.error('Final URL:', page.url());
    
    // Check for any visible error text before taking screenshot
    const errorMsg = await page.locator('.text-destructive, [role="alert"]').first().textContent().catch(() => null);
    if (errorMsg) console.error('Found error message on page:', errorMsg);

    await page.screenshot({ path: 'auth-failure-final.png', fullPage: true });
    throw error;
  }
  
  // Save storage state
  mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
