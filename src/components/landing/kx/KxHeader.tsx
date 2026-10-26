import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';
import { KxMark } from './primitives';
import { Button } from '@/components/ui/button';

/** Each language named in itself, so anyone finds their own. Static: server and browser must render the same text. */
const NATIVE_NAMES: Record<string, string> = {
  ru: 'Русский', en: 'English', kk: 'Қазақша', de: 'Deutsch', uk: 'Українська', uz: "O'zbekcha", be: 'Беларуская',
  es: 'Español', fr: 'Français', it: 'Italiano', pt: 'Português', zh: '中文', tr: 'Türkçe', ja: '日本語', ko: '한국어', ar: 'العربية',
};

function LanguageSelect({ value, onChange, label, className }: { value: string; onChange: (code: string) => void; label: string; className?: string }) {
  return (
    <label className={`relative inline-flex ${className ?? ''}`}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="pointer-events-none grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-semibold uppercase">{value}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      >
        {SUPPORTED_LANGUAGES.map((code) => <option key={code} value={code}>{NATIVE_NAMES[code] ?? code}</option>)}
      </select>
    </label>
  );
}

interface Props {
  onLogin: () => void;
  onSignup: () => void;
}

export function KxHeader({ onLogin, onSignup }: Props) {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lang = (i18n.language || 'ru').slice(0, 2);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        document.getElementById('kx-menu-toggle')?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const nav = [
    { href: '/gallery', label: t('landing.kx.nav.examples', 'Примеры') },
    { href: '/pricing', label: t('landing.kx.nav.pricing', 'Тарифы') },
    { href: '#faq', label: t('landing.kx.nav.faq', 'Вопросы') },
  ];

  const switchLang = (code: string) => void i18n.changeLanguage(code);

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
            <LanguageSelect value={lang} onChange={switchLang} label={t('landing.kx.nav.language', 'Сменить язык')} className="rounded-full bg-[var(--kx-surface-2)] hover:bg-[#262626]" />
            <Button type="button" variant="ghost" onClick={onLogin} className="kx-btn kx-btn-ghost !h-11">{t('landing.kx.nav.login', 'Войти')}</Button>
            <Button type="button" onClick={onSignup} className="kx-btn kx-btn-primary !h-11">{t('landing.kx.nav.create', 'Создать страницу')}</Button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <LanguageSelect value={lang} onChange={switchLang} label={t('landing.kx.nav.language', 'Сменить язык')} className="text-[var(--kx-muted)]" />
            <Button
              id="kx-menu-toggle"
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="grid h-11 w-11 place-items-center rounded-full"
              aria-expanded={open}
              aria-controls="kx-menu"
              aria-label={open ? t('landing.kx.nav.close', 'Закрыть меню') : t('landing.kx.nav.open', 'Открыть меню')}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
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
          <Button type="button" onClick={() => { setOpen(false); onSignup(); }} className="kx-btn kx-btn-primary !h-14 w-full" tabIndex={open ? 0 : -1}>
            {t('landing.kx.nav.create', 'Создать страницу')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => { setOpen(false); onLogin(); }} className="kx-btn kx-btn-ghost !h-14 w-full" tabIndex={open ? 0 : -1}>
            {t('landing.kx.nav.login', 'Войти')}
          </Button>
        </div>
      </div>
    </>
  );
}
