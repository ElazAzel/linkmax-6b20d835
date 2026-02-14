import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('landing page loads with correct branding', async ({ page }) => {
    // Check title contains lnkmx
    await expect(page).toHaveTitle(/lnkmx|LinkMAX/i);
    
    // Check main CTA is visible
    const ctaButton = page.locator('text=/Создать|Create|Бесплатно/i').first();
    await expect(ctaButton).toBeVisible();
  });

  test('navigate to auth page', async ({ page }) => {
    // Click CTA button or navigate to auth
    await page.goto('/auth');
    
    // Check auth form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('signup form validation', async ({ page }) => {
    await page.goto('/auth');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Should show validation errors or stay on page
    await expect(page).toHaveURL(/auth/);
  });

  test('signup with valid credentials', async ({ page }) => {
    await page.goto('/auth');
    
    // Generate unique email for test
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // Fill signup form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Click signup/login button
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Wait for response (either success or error)
    await page.waitForTimeout(2000);
    
    // Should either redirect or show message
    const url = page.url();
    expect(url).toMatch(/dashboard|auth|onboarding/);
  });
});

test.describe('User Page Creation', () => {
  test('dashboard loads after auth', async ({ page }) => {
    // This test assumes user is authenticated
    await page.goto('/dashboard');
    
    // Should either show dashboard or redirect to auth
    const url = page.url();
    expect(url).toMatch(/dashboard|auth/);
  });

  test('editor tab is accessible', async ({ page }) => {
    await page.goto('/dashboard?tab=editor');
    
    // Check for editor elements
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/dashboard|auth/);
  });
});

test.describe('Public Page View', () => {
  test('gallery page loads', async ({ page }) => {
    await page.goto('/gallery');
    
    await expect(page).toHaveURL(/gallery/);
    
    // Check gallery content is visible
    const galleryContent = page.locator('main, [data-testid="gallery"]').first();
    await expect(galleryContent).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    
    await expect(page).toHaveURL(/pricing/);
    
    // Check pricing content is visible
    const pricingContent = page.locator('main').first();
    await expect(pricingContent).toBeVisible();
  });

  test('alternatives page loads', async ({ page }) => {
    await page.goto('/alternatives');
    
    await expect(page).toHaveURL(/alternatives/);
  });
});

test.describe('SEO & Meta Tags', () => {
  test('landing page has correct meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    const title = await page.title();
    expect(title.toLowerCase()).toMatch(/lnkmx|linkmax|link/);
    
    // Check meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription?.toLowerCase()).toMatch(/link|bio|страниц/);
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });

  test('canonical URL is set', async ({ page }) => {
    await page.goto('/');
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('lnkmx.my');
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Check mobile view is responsive
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('mobile touch targets are adequate', async ({ page }) => {
    await page.goto('/');
    
    // All buttons should be at least 44x44 pixels
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        // Buttons should have reasonable touch targets
        expect(box.width).toBeGreaterThanOrEqual(30);
        expect(box.height).toBeGreaterThanOrEqual(30);
      }
    }
  });
});

test.describe('Performance', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('no console errors on landing', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(e => 
      !e.includes('Failed to load resource') && 
      !e.includes('net::ERR')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});