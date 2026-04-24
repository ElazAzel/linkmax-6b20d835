const DEFAULT_RETURN_TO = '/dashboard';
const CALLBACK_PATH = '/auth/callback';

export function getSafeReturnTo(
  returnTo: string | null | undefined,
  fallback = DEFAULT_RETURN_TO
): string {
  if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
    return returnTo;
  }

  return fallback;
}

export function buildAuthCallbackRedirect(origin: string, returnTo?: string): string {
  const url = new URL(CALLBACK_PATH, origin);
  url.searchParams.set('returnTo', getSafeReturnTo(returnTo, DEFAULT_RETURN_TO));

  return url.toString();
}

export function readOAuthParams(location: Location = window.location) {
  const hashParams = new URLSearchParams(location.hash.substring(1));
  const searchParams = new URLSearchParams(location.search);

  return {
    error: hashParams.get('error') || searchParams.get('error'),
    errorDescription:
      hashParams.get('error_description') || searchParams.get('error_description'),
    returnTo: getSafeReturnTo(
      hashParams.get('returnTo') || searchParams.get('returnTo'),
      DEFAULT_RETURN_TO
    ),
  };
}
