import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

// Ensure we start with a clean state for authentication
setup.use({ storageState: { cookies: [], origins: [] } });
setup.setTimeout(120_000);

setup('authenticate', async ({ page }) => {
  const testEmail = process.env.E2E_TEST_EMAIL ?? '';
  const testPassword = process.env.E2E_TEST_PASSWORD ?? '';
  setup.skip(!testEmail || !testPassword, 'E2E_TEST_EMAIL and E2E_TEST_PASSWORD are required for authenticated E2E coverage');

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

  // The initial auth screen is signup with the email form collapsed.
  try {
    await page.getByTestId('expand-email-form').click({ timeout: 20_000 });
    const signinTab = page.getByTestId('signin-tab');
    await expect(signinTab).toBeVisible({ timeout: 20000 });
    await signinTab.click();
    console.log('Signin tab is visible');

    // Fill signin form
    await page.getByTestId('signin-email-input').fill(testEmail);
    const passwordInput = page.getByTestId('signin-password-input');
    await passwordInput.fill(testPassword);
    
    console.log('Filled credentials, pressing Enter...');
    // Pressing Enter is often more reliable than clicking a button that might be obscured
    await passwordInput.press('Enter');

    // Successful sign-in shows a confirmation card; navigation is explicit.
    const continueToDashboard = page.getByTestId('continue-to-dashboard');
    await expect(continueToDashboard).toBeVisible({ timeout: 60_000 });
    await continueToDashboard.click();
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
  await page.context().storageState({ path: authFile });
});
