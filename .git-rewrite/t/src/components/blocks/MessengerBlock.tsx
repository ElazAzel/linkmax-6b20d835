import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send } from 'lucide-react';
import type { MessengerBlock as MessengerBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

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

  return (
    <Card className="p-6">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
      )}
      <div className="grid gap-3">
        {block.messengers.map((messenger, index) => (
          <button
            key={index}
            onClick={() => handleMessengerClick(messenger.platform, messenger.username, messenger.message)}
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary transition-all hover:shadow-md bg-card text-left w-full"
          >
            <span className="text-2xl">{getMessengerIcon(messenger.platform)}</span>
            <div className="flex-1">
              <div className="font-medium">{getPlatformName(messenger.platform)}</div>
              <div className="text-sm text-muted-foreground">@{messenger.username}</div>
            </div>
            <Send className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </Card>
  );
});
