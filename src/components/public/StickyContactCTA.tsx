/**
 * StickyContactCTA — Quiet Bento (Sprint E)
 * Mobile-only floating glass capsule with primary contact actions.
 * Surfaces the first phone / WhatsApp / Telegram contact found in page blocks.
 * Hidden if no contacts are detected, on tablet+ widths, or after the user
 * dismisses it for the session.
 */
import { memo, useMemo, useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { cn } from '@/lib/utils/utils';
import Phone from 'lucide-react/dist/esm/icons/phone';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Send from 'lucide-react/dist/esm/icons/send';
import X from 'lucide-react/dist/esm/icons/x';
import type { Block } from '@/types/page';

interface Contact {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  blocks: Block[] | undefined;
  pageId?: string;
}

const DISMISS_KEY = 'lnkmx:sticky-cta-dismissed';

function extractContacts(blocks: Block[] | undefined): Contact[] {
  if (!blocks?.length) return [];
  const out: Contact[] = [];
  const seen = new Set<string>();
  const push = (c: Contact) => {
    if (seen.has(c.href)) return;
    seen.add(c.href);
    out.push(c);
  };

  for (const b of blocks) {
    if (b.type === 'messenger') {
      const list = (b as { messengers?: Array<{ platform: string; username: string; message?: string }> }).messengers ?? [];
      for (const m of list) {
        const u = (m.username || '').replace(/\s+/g, '').replace(/^@/, '');
        if (!u) continue;
        if (m.platform === 'whatsapp') {
          const digits = u.replace(/[^\d]/g, '');
          if (digits) push({ label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/${digits}${m.message ? `?text=${encodeURIComponent(m.message)}` : ''}` });
        } else if (m.platform === 'telegram') {
          push({ label: 'Telegram', icon: Send, href: `https://t.me/${u}` });
        }
      }
    }
    if (b.type === 'button' || b.type === 'link') {
      const url = (b as { url?: string }).url;
      if (!url) continue;
      if (url.startsWith('tel:')) push({ label: 'Позвонить', icon: Phone, href: url });
      else if (url.includes('wa.me/') || url.includes('whatsapp.com')) push({ label: 'WhatsApp', icon: MessageCircle, href: url });
      else if (url.includes('t.me/')) push({ label: 'Telegram', icon: Send, href: url });
    }
  }
  return out.slice(0, 3);
}

export const StickyContactCTA = memo(function StickyContactCTA({ blocks, pageId }: Props) {
  const contacts = useMemo(() => extractContacts(blocks), [blocks]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const v = storage.session.get<string>(`${DISMISS_KEY}:${pageId ?? 'global'}`);
    if (v === '1') setDismissed(true);
  }, [pageId]);

  if (!contacts.length || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    storage.session.set(`${DISMISS_KEY}:${pageId ?? 'global'}`, '1');
  };

  return (
    <div
      className={cn(
        'sm:hidden fixed left-1/2 -translate-x-1/2 z-40',
        'bottom-[max(env(safe-area-inset-bottom,0),1rem)]',
        'flex items-center gap-1 rounded-pill border border-hairline',
        'bg-background/80 backdrop-blur-xl shadow-lift px-1.5 py-1.5',
        'animate-in fade-in slide-in-from-bottom-2 duration-300',
      )}
      role="region"
      aria-label="Quick contact"
    >
      {contacts.map((c) => {
        const Icon = c.icon;
        return (
          <a
            key={c.href}
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-3 rounded-pill text-sm font-medium',
              'bg-foreground text-background hover:opacity-90 transition-opacity active:scale-95',
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{c.label}</span>
          </a>
        );
      })}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Скрыть"
        className="inline-flex items-center justify-center h-9 w-9 rounded-pill text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
});
