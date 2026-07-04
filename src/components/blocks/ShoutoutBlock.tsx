import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { supabase } from '@/platform/supabase/client';

interface ShoutoutBlockProps {
  /** Accepts full block object (manifest-driven) or legacy individual props */
  block?: { userId: string; message?: string | { ru?: string; en?: string; kk?: string }; blockStyle?: any };
  /** @deprecated Use block prop instead */
  userId?: string;
  /** @deprecated Use block prop instead */
  message?: string | { ru?: string; en?: string; kk?: string };
  style?: {
    backgroundColor?: string;
    borderRadius?: string;
  };
}

interface UserInfo {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function ShoutoutBlock({ block, userId: legacyUserId, message: legacyMessage, style }: ShoutoutBlockProps) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Support both manifest-driven (block prop) and legacy (individual props)
  const userId = block?.userId ?? legacyUserId ?? '';
  const message = block?.message ?? legacyMessage;

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase
        .from('user_profiles')
        .select('username, display_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      
      setUser(data);
      setLoading(false);
    }

    if (userId) {
      loadUser();
    }
  }, [userId]);

  const lang = i18n.language as SupportedLanguage;
  const displayMessage = typeof message === 'object' 
    ? getI18nText(message, lang)
    : message;

  if (loading) {
    return (
      <Card className="animate-pulse" style={style}>
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-muted" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card 
        className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
        style={style}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Megaphone className="h-3 w-3" />
            <span>{t('blocks.shoutout.recommend', 'Рекомендую')}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('blocks.shoutout.userNotFound', 'Пользователь не найден')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleClick = () => {
    if (user.username) {
      window.open(`/${user.username}`, '_blank');
    }
  };

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
      style={style}
      onClick={handleClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Megaphone className="h-3 w-3" />
          <span>{t('blocks.shoutout.recommend', 'Рекомендую')}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/30">
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {user.display_name?.[0] || user.username?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-snug break-words hyphens-auto">
              {user.display_name || user.username}
            </p>
            {displayMessage && (
              <p className="text-sm text-muted-foreground leading-relaxed break-words hyphens-auto">
                {displayMessage}
              </p>
            )}
          </div>
          
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
