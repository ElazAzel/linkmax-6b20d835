/**
 * StickyContactCTA — Quiet Bento (Sprint E)
 * Mobile-only floating glass capsule with primary contact actions.
 * Surfaces the first phone / WhatsApp / Telegram contact found in page blocks.
 * Hidden if no contacts are detected, on tablet+ widths, or after the user
 * dismisses it for the session.
 */
import { memo, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/utils';
import { session } from '@/lib/storage';
import Phone from 'lucide-react/dist/esm/icons/phone';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Send from 'lucide-react/dist/esm/icons/send';
import X from 'lucide-react/dist/esm/icons/x';
import type { Block } from '@/types/page';
import { extractPageContacts, type ContactPlatform } from '@/lib/blocks/page-contacts';

interface Props {
  blocks: Block[] | undefined;
  pageId?: string;
}

const DISMISS_KEY = 'lnkmx:sticky-cta-dismissed';

const ICONS: Record<ContactPlatform, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageCircle,
  telegram: Send,
  phone: Phone,
};

export const StickyContactCTA = memo(function StickyContactCTA({ blocks, pageId }: Props) {
  const { t, i18n } = useTranslation();
  // Two at most: three labelled pills plus the close button overflow a phone.
  const contacts = useMemo(() => extractPageContacts(blocks, i18n.language).slice(0, 2), [blocks, i18n.language]);
  const labels: Record<ContactPlatform, string> = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    phone: t('publicPage.contact.call', 'Позвонить'),
  };
  const [dismissed, setDismissed] = useState(false);
  const dismissKey = `${DISMISS_KEY}:${pageId ?? 'global'}`;

  useEffect(() => {
    const value = session.get<string>(dismissKey);
    if (value === '1') setDismissed(true);
  }, [dismissKey]);

  // Shown once the visitor scrolls past the first screen, and hidden while the
  // page's own contact block (messenger / socials) is on screen: it used to
  // duplicate that block and sit over tiles from the very first frame.
  const [scrolled, setScrolled] = useState(false);
  const [contactBlockVisible, setContactBlockVisible] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const targets = Array.from(document.querySelectorAll('[data-lm-cell][data-lm-type="messenger"], [data-lm-cell][data-lm-type="socials"], [data-lm-socials]'));
    let observer: IntersectionObserver | undefined;
    if (targets.length && 'IntersectionObserver' in window) {
      const visible = new Set<Element>();
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
        }
        setContactBlockVisible(visible.size > 0);
      });
      targets.forEach((target) => observer!.observe(target));
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    };
  }, [blocks]);

  if (!contacts.length || dismissed || !scrolled || contactBlockVisible) return null;

  const handleDismiss = () => {
    setDismissed(true);
    session.set(dismissKey, '1');
  };

  return (
    <div
      className={cn(
        'sm:hidden fixed left-1/2 -translate-x-1/2 z-40',
        'bottom-[max(env(safe-area-inset-bottom,0),1rem)]',
        'flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-pill border border-hairline',
        'bg-background/90 backdrop-blur-xl shadow-lift p-1',
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
      )}
      role="region"
      aria-label={t('publicPage.contact.region', 'Быстрая связь')}
    >
      {contacts.map((c) => {
        const Icon = ICONS[c.platform];
        return (
          <a
            key={c.platform}
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className={cn(
              'inline-flex min-w-0 items-center gap-1.5 h-11 px-4 rounded-pill text-sm font-medium',
              'bg-foreground text-background hover:opacity-90 transition-opacity active:scale-95',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{labels[c.platform]}</span>
          </a>
        );
      })}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('publicPage.contact.hide', 'Скрыть')}
        className="inline-flex shrink-0 items-center justify-center h-11 w-11 rounded-pill text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});
