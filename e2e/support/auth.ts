export const AUTHENTICATED_E2E_SKIP_REASON =
  'E2E_TEST_EMAIL and E2E_TEST_PASSWORD are required for authenticated E2E coverage';

export const hasE2ECredentials = Boolean(
  process.env.E2E_TEST_EMAIL?.trim() && process.env.E2E_TEST_PASSWORD?.trim(),
);
