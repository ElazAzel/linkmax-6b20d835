import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import { KxMark } from './primitives';

const LANGS = ['ru', 'kk', 'en'] as const;

interface Props {
  onLogin: () => void;
  onSignup: () => void;
}

export function KxHeader({ onLogin, onSignup }: Props) {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lang = (i18n.language || 'ru').slice(0, 2);
  const nextLang = LANGS[(LANGS.indexOf(lang as typeof LANGS[number]) + 1) % LANGS.length] ?? 'ru';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const nav = [
    { href: '/gallery', label: t('landing.kx.nav.examples', 'Примеры') },
    { href: '/pricing', label: t('landing.kx.nav.pricing', 'Тарифы') },
    { href: '#faq', label: t('landing.kx.nav.faq', 'Вопросы') },
  ];

  const switchLang = () => void i18n.changeLanguage(nextLang);

  return (
    <>
      <header className="kx-header" data-scrolled={scrolled || open}>
        <div className="kx-wrap flex h-16 items-center justify-between gap-6 md:h-20">
          <a href="/" className="shrink-0" aria-label="LinkMAX"><KxMark /></a>

          <nav className="hidden items-center gap-1 md:flex" aria-label={t('landing.kx.nav.label', 'Навигация')}>
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="rounded-full px-4 py-2 text-[15px] text-[var(--kx-muted)] transition-colors hover:text-[var(--kx-text)]">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={switchLang} className="kx-btn kx-btn-ghost !h-11 !px-4 uppercase" aria-label={t('landing.kx.nav.language', 'Сменить язык')}>
              {lang}
            </button>
            <button type="button" onClick={onLogin} className="kx-btn kx-btn-ghost !h-11">{t('landing.kx.nav.login', 'Войти')}</button>
            <button type="button" onClick={onSignup} className="kx-btn kx-btn-primary !h-11">{t('landing.kx.nav.create', 'Создать страницу')}</button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <button type="button" onClick={switchLang} className="h-11 w-11 rounded-full text-sm font-semibold uppercase text-[var(--kx-muted)]" aria-label={t('landing.kx.nav.language', 'Сменить язык')}>
              {lang}
            </button>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="grid h-11 w-11 place-items-center rounded-full"
              aria-expanded={open}
              aria-controls="kx-menu"
              aria-label={open ? t('landing.kx.nav.close', 'Закрыть меню') : t('landing.kx.nav.open', 'Открыть меню')}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      <div id="kx-menu" className="kx-menu md:hidden" data-open={open} aria-hidden={!open}>
        {nav.map((item) => (
          <a key={item.href} href={item.href} className="kx-menu-link" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            {item.label}
          </a>
        ))}
        <div className="mt-auto grid gap-3">
          <button type="button" onClick={() => { setOpen(false); onSignup(); }} className="kx-btn kx-btn-primary !h-14 w-full" tabIndex={open ? 0 : -1}>
            {t('landing.kx.nav.create', 'Создать страницу')}
          </button>
          <button type="button" onClick={() => { setOpen(false); onLogin(); }} className="kx-btn kx-btn-ghost !h-14 w-full" tabIndex={open ? 0 : -1}>
            {t('landing.kx.nav.login', 'Войти')}
          </button>
        </div>
      </div>
    </>
  );
}
