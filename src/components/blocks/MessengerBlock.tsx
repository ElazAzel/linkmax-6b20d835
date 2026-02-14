import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, ExternalLink, Phone } from 'lucide-react';
import type { MessengerBlock as MessengerBlockType } from '@/types/page';
import { supabase } from '@/platform/supabase/client';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface MessengerBlockProps {
  block: MessengerBlockType;
  pageOwnerId?: string;
  onClick?: () => void;
}

export const MessengerBlock = memo(function MessengerBlock({ block, pageOwnerId, onClick }: MessengerBlockProps) {
  const { i18n } = useTranslation();
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);

  const getMessengerIcon = (platform: string) => {
    const icons: Record<string, string> = {
      whatsapp: '🟢',
      telegram: '✈️',
      viber: '🟣',
      wechat: '💬',
    };
    return icons[platform] || '💬';
  };

  const getMessengerUrl = (platform: string, username: string, message?: string) => {
    const encodedMessage = message ? encodeURIComponent(message) : '';
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/${username}${message ? `?text=${encodedMessage}` : ''}`,
      telegram: `https://t.me/${username}`,
      viber: `viber://chat?number=${username}`,
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

  const handleMessengerClick = async (platform: string, username: string, message?: string) => {
    // Track analytics click
    onClick?.();

    if (pageOwnerId) {
      try {
        await supabase.functions.invoke('create-lead', {
          body: {
            pageOwnerId,
            name: `${getPlatformName(platform)} Contact`,
            source: 'messenger',
            notes: `Clicked ${getPlatformName(platform)} link: @${username}`,
            metadata: { platform, username }
          }
        });
      } catch (error) {
        console.error('Failed to create lead from messenger click:', error);
      }
    }

    const url = getMessengerUrl(platform, username, message);
    // Delay to ensure tracking request is sent before navigation
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }, 15);
  };

  const messengers = block.messengers || [];

  // Compact horizontal layout for mobile
  const isSingleMessenger = messengers.length === 1;

  if (messengers.length === 0) {
    return null;
  }

  return (
    <div
      className="w-full rounded-[2rem] glass-card border border-white/10 shadow-glass p-5 relative overflow-hidden group"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {/* Background glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors duration-500" />

      <div className="relative z-10">
        {title && (
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-sm shadow-primary/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg text-gradient leading-tight">{title}</h3>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {messengers.map((messenger, index) => (
            <button
              key={index}
              onClick={() => handleMessengerClick(messenger.platform, messenger.username, messenger.message)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl",
                "glass-card backdrop-blur-md border-white/10 shadow-glass",
                "transition-all duration-300 hover:scale-[1.02] hover:shadow-glass-lg active:scale-[0.98]",
                "group/item overflow-hidden relative text-left w-full"
              )}
            >
              <div className="flex-shrink-0 relative z-10">
                {messenger.platform === 'whatsapp' && <MessageCircle className="h-6 w-6 text-[#25D366]" />}
                {messenger.platform === 'telegram' && <Send className="h-6 w-6 text-[#0088cc]" />}
                {messenger.platform === 'viber' && <Phone className="h-6 w-6 text-[#7360f2]" />}
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="font-bold text-sm tracking-wide uppercase text-foreground/90">
                  {getPlatformName(messenger.platform)}
                </div>
                {messenger.username && (
                  <div className="text-xs text-muted-foreground/60 truncate font-medium mt-0.5">
                    {messenger.username}
                  </div>
                )}
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground/30 group-hover/item:text-primary transition-colors duration-300 relative z-10" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
