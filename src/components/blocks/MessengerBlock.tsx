import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Send from 'lucide-react/dist/esm/icons/send';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Phone from 'lucide-react/dist/esm/icons/phone';
import type { MessengerBlock as MessengerBlockType } from '@/types/page';
import { supabase } from '@/platform/supabase/client';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { SectionHeader } from '@/components/blocks/shells/BlockShell';
import { EmptyBlockHint } from '@/components/blocks/shells/EmptyBlockHint';
import { useRenderContext } from '@/contexts/RenderContext';
import { messengerPhoneDigits, whatsappHref } from '@/lib/blocks/messenger-links';

interface MessengerBlockProps {
  block: MessengerBlockType;
  pageOwnerId?: string;
  onClick?: () => void;
}

export const MessengerBlock = memo(function MessengerBlock({ block, pageOwnerId, onClick }: MessengerBlockProps) {
  const { i18n, t } = useTranslation();
  const renderMode = useRenderContext();
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);

  const getMessengerUrl = (platform: string, username: string, message?: unknown) => {
    const urls: Record<string, string> = {
      whatsapp: whatsappHref(username, message, i18n.language) ?? '#',
      telegram: `https://t.me/${username.replace(/^@+/, '')}`,
      viber: `viber://chat?number=%2B${messengerPhoneDigits(username)}`,
      wechat: `weixin://dl/chat?${username}`,
    };
    return urls[platform] || '#';
  };

  const getPlatformName = (platform: string) => {
    const names: Record<string, string> = {
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      viber: 'Viber',
      wechat: 'WeChat',
    };
    return names[platform] || platform;
  };

  // Links are real <a href> so crawlers see them, visitors can long-press to
  // copy, and iOS opens them inside the tap. Tracking never delays the open.
  const handleMessengerClick = (platform: string, username: string) => {
    onClick?.();
    if (!pageOwnerId) return;
    void supabase.functions.invoke('create-lead', {
      body: {
        pageOwnerId,
        name: `${getPlatformName(platform)} Contact`,
        source: 'messenger',
        notes: `Clicked ${getPlatformName(platform)} link: @${username}`,
        metadata: { platform, username },
      },
    }).catch((error: unknown) => console.error('Failed to create lead from messenger click:', error));
  };

  const messengers = (block.messengers || []).filter((m) => (m.username || '').trim());

  if (messengers.length === 0) {
    // Owners see what to fill in; it used to collapse to a 2px strip in the editor.
    if (renderMode === 'live') return null;
    return <EmptyBlockHint icon={<MessageCircle className="h-4 w-4" aria-hidden />}>{t('blocks.messenger.emptyHint', 'Добавьте WhatsApp или Telegram')}</EmptyBlockHint>;
  }

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {title && <SectionHeader className="px-5 pt-4 mb-1" icon={<MessageCircle className="h-4 w-4" />} title={title} />}

      <ul className="divide-y divide-border/60 px-5 py-2">
        {messengers.map((messenger, index) => {
          const href = getMessengerUrl(messenger.platform, messenger.username, messenger.message);
          return (
            <li key={`${messenger.platform}-${index}`}>
              <a
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                onClick={() => handleMessengerClick(messenger.platform, messenger.username)}
                className="-mx-2 flex min-h-14 items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]">
                  {messenger.platform === 'whatsapp' && <MessageCircle className="h-5 w-5 text-[#25D366]" />}
                  {messenger.platform === 'telegram' && <Send className="h-5 w-5 text-[#0088cc]" />}
                  {messenger.platform === 'viber' && <Phone className="h-5 w-5 text-[#7360f2]" />}
                  {messenger.platform === 'wechat' && <MessageCircle className="h-5 w-5 text-[#07C160]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{getPlatformName(messenger.platform)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {messenger.platform === 'whatsapp' || messenger.platform === 'viber'
                      ? `+${messengerPhoneDigits(messenger.username)}`
                      : messenger.username.replace(/^@*/, '@')}
                  </span>
                </span>
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
});
