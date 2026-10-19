import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { supabase } from '@/platform/supabase/client';
import { BrandMark } from '@/components/brand/BrandMark';
import { slugWhileTyping, sanitizeSlug, validateSlug } from '@/lib/utils/slug';
import { isReservedSlug } from '@/lib/routing/reserved-slugs';

/** The wordmark from the logo: "lnkmx.my" with the orange dot. */
export function KxMark({ className }: { className?: string }) {
  return (
    <span className={`kx-mark inline-flex items-center gap-2.5 ${className ?? ''}`} aria-label="LinkMAX">
      <BrandMark size={30} tile={false} className="shrink-0" />
      <span aria-hidden="true">lnkmx<i>.</i>my</span>
    </span>
  );
}

/**
 * Fades a section in the first time it scrolls into view. Server HTML and
 * no-JS crawlers get the content visible; only nodes below the fold are
 * hidden, and only after hydration.
 */
export function Reveal({ children, delay = 0, className, as: Tag = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li' }) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<'idle' | 'pending' | 'shown'>('idle');
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    if (node.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setState('pending');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setState('shown');
        observer.disconnect();
      }
    }, { rootMargin: '0px 0px -10% 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={className}
      data-reveal={state === 'idle' ? undefined : state}
      style={{ '--rd': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** Cycles words with a slide-up; the server renders the first word. */
export function RotatingWord({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [{ index, previous }, setWord] = useState<{ index: number; previous: number | null }>({ index: 0, previous: null });
  useEffect(() => {
    if (words.length < 2) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setWord(({ index: current }) => ({ index: (current + 1) % words.length, previous: current }));
    }, interval);
    return () => window.clearInterval(timer);
  }, [words.length, interval]);
  return (
    <span className="kx-rotor" aria-live="off">
      {previous !== null && previous !== index && (
        <span key={`out-${previous}-${index}`} data-state="out" aria-hidden="true">{words[previous]}</span>
      )}
      <span key={`in-${index}`} data-state={previous === null ? undefined : 'in'}>{words[index]}</span>
    </span>
  );
}

export function Marquee({ items, direction = 'left', speed = 48 }: { items: string[]; direction?: 'left' | 'right'; speed?: number }) {
  // Two identical tracks make the loop seamless; the copy is hidden from readers.
  return (
    <div className="kx-marquee" data-dir={direction} style={{ '--kx-speed': `${speed}s` } as CSSProperties}>
      {[0, 1].map((copy) => (
        <ul key={copy} className="kx-marquee-track" aria-hidden={copy === 1 ? true : undefined}>
          {items.map((item) => <li key={item} className="kx-chip">{item}</li>)}
        </ul>
      ))}
    </div>
  );
}

type SlugState = 'empty' | 'invalid' | 'checking' | 'free' | 'taken';

/** Debounced check against published pages; unpublished conflicts are caught at signup. */
function useSlugState(slug: string): SlugState {
  const [state, setState] = useState<SlugState>('empty');
  useEffect(() => {
    if (!slug) { setState('empty'); return; }
    if (!validateSlug(slug).valid) { setState('invalid'); return; }
    if (isReservedSlug(slug)) { setState('taken'); return; }
    setState('checking');
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const { data, error } = await supabase.from('pages').select('slug').eq('slug', slug).limit(1);
        if (cancelled) return;
        setState(error ? 'free' : data && data.length > 0 ? 'taken' : 'free');
      } catch {
        if (!cancelled) setState('free');
      }
    }, 450);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [slug]);
  return state;
}

export function ClaimForm({ onSubmit, id, tone = 'dark' }: { onSubmit: (slug?: string) => void; id: string; tone?: 'dark' | 'accent' }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const slug = sanitizeSlug(value);
  const state = useSlugState(slug);
  const hint: Record<SlugState, string> = {
    empty: t('landing.kx.claim.hint', 'Бесплатно. Без карты. Адрес остаётся за тобой.'),
    invalid: t('landing.kx.claim.invalid', 'Латиница, цифры и дефис, от 3 до 30 символов.'),
    checking: t('landing.kx.claim.checking', 'Проверяем…'),
    free: t('landing.kx.claim.free', 'lnkmx.my/{{slug}} свободен. Забирай.', { slug }),
    taken: t('landing.kx.claim.taken', 'Этот адрес уже занят. Попробуй другой.'),
  };
  // 'checking' blocks too: submitting mid-check would skip the availability result.
  const blocked = state === 'taken' || state === 'invalid' || state === 'checking';
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (blocked) return;
        onSubmit(slug || undefined);
      }}
      className="w-full"
    >
      <label htmlFor={id} className="sr-only">{t('landing.kx.claim.label', 'Короткий адрес твоей страницы')}</label>
      <div className="kx-claim" data-state={state === 'free' ? 'free' : state === 'taken' ? 'taken' : undefined}>
        <span className="kx-claim-prefix">lnkmx.my/</span>
        <input
          id={id}
          value={value}
          onChange={(event) => setValue(slugWhileTyping(event.target.value))}
          placeholder={t('landing.kx.claim.placeholder', 'yourname')}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="url"
          aria-describedby={`${id}-hint`}
        />
        <button type="submit" className={`kx-btn ${tone === 'accent' ? 'kx-btn-accent' : 'kx-btn-primary'}`} disabled={blocked} style={blocked && state !== 'checking' ? { opacity: 0.5 } : undefined}>
          {t('landing.kx.claim.cta', 'Забрать адрес')}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p
        id={`${id}-hint`}
        className="mt-3 pl-2 text-sm"
        style={{ color: state === 'free' ? 'var(--kx-ok)' : state === 'taken' || state === 'invalid' ? '#ff6b6b' : tone === 'accent' ? 'rgb(0 0 0 / .65)' : 'var(--kx-muted)' }}
        aria-live="polite"
      >
        {hint[state]}
      </p>
    </form>
  );
}
