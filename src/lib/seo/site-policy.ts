export const SEARCH_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const PRIVATE_PATH = /^\/(?:auth|dashboard(?:-v2)?|admin|editor|dev|crm|settings|install|team|join|invites|purchase|booking\/manage|events\/checkin|review\/request|\.lovable)(?:\/|$)/;

export function siteRobots(pathname: string) {
  return PRIVATE_PATH.test(pathname) ? 'noindex, nofollow' : SEARCH_ROBOTS;
}

export function requestLanguage(pathname: string, search = ''): 'ru' | 'en' | 'kk' | 'uz' {
  const query = new URLSearchParams(search);
  const language = pathname.match(/^\/(ru|en|kk|uz)(?:\/|$)/)?.[1] || query.get('lang') || query.get('lng');
  return language === 'en' || language === 'kk' || language === 'uz' ? language : 'ru';
}
