import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send } from 'lucide-react';
import type { MessengerBlock as MessengerBlockType } from '@/types/page';
import { supabase } from '@/platform/supabase/client';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface MessengerBlockProps {
  block: MessengerBlockType;
  pageOwnerId?: string;
}

export const MessengerBlock = memo(function MessengerBlock({ block, pageOwnerId }: MessengerBlockProps) {
  const { i18n } = useTranslation();
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);

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
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Compact horizontal layout for mobile
  const isSingleMessenger = block.messengers.length === 1;

  return (
    <div 
      className="w-full rounded-xl bg-card border border-border shadow-sm p-3"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm">{title}</h3>
        </div>
      )}
      
      <div className={cn(
        "flex gap-2",
        isSingleMessenger ? "flex-col" : "flex-wrap"
      )}>
        {block.messengers.map((messenger, index) => (
          <button
            key={index}
            onClick={() => handleMessengerClick(messenger.platform, messenger.username, messenger.message)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5",
              "rounded-full border border-border",
              "hover:border-primary hover:shadow-sm",
              "transition-all active:scale-[0.98]",
              "bg-background/50",
              isSingleMessenger ? "w-full justify-center" : "flex-1 min-w-[120px] justify-center"
            )}
          >
            <span className="text-lg">{getMessengerIcon(messenger.platform)}</span>
            <span className="font-medium text-sm">{getPlatformName(messenger.platform)}</span>
            <Send className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
          </button>
        ))}
      </div>
    </div>
  );
});
