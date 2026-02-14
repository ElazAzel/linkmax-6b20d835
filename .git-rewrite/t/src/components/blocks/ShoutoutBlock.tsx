import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { supabase } from '@/platform/supabase/client';

interface ShoutoutBlockProps {
  userId: string;
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

export function ShoutoutBlock({ userId, message, style }: ShoutoutBlockProps) {
  const { i18n } = useTranslation();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

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
    ? getTranslatedString(message, lang)
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

  // If user not found, show fallback with provided data
  if (!user) {
    return (
      <Card 
        className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
        style={style}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Megaphone className="h-3 w-3" />
            <span>Рекомендую</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Пользователь не найден
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
          <span>Рекомендую</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/30">
            <AvatarImage src={user.avatar_url || ''} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {user.display_name?.[0] || user.username?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {user.display_name || user.username}
            </p>
            {displayMessage && (
              <p className="text-sm text-muted-foreground line-clamp-2">
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
