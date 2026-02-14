import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CommunityBlock as CommunityBlockType } from '@/types/page';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getI18nText } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';
import { Users, Crown, Star, Heart, Zap, Lock, ExternalLink } from 'lucide-react';

interface CommunityBlockProps {
  block: CommunityBlockType;
}

const iconMap = {
  users: Users,
  crown: Crown,
  star: Star,
  heart: Heart,
  zap: Zap,
  lock: Lock,
};

const styleConfig = {
  default: {
    card: 'bg-card border-border',
    badge: 'bg-primary/10 text-primary',
    button: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  premium: {
    card: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-600',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600',
  },
  exclusive: {
    card: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30',
    badge: 'bg-purple-500/20 text-purple-600',
    button: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600',
  },
};

export const CommunityBlock = React.memo(function CommunityBlock({ block }: CommunityBlockProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const title = block.title ? getI18nText(block.title, currentLang) : t('blocks.community.defaultTitle', 'Мой закрытый клуб');
  const description = block.description ? getI18nText(block.description, currentLang) : '';
  const buttonText = block.buttonText ? getI18nText(block.buttonText, currentLang) : t('blocks.community.join', 'Вступить');
  
  const style = block.style || 'default';
  const styles = styleConfig[style];
  const IconComponent = iconMap[block.icon || 'users'];

  const handleJoin = () => {
    if (block.telegramLink) {
      window.open(block.telegramLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className={cn('w-full transition-all shadow-sm hover:shadow-md', styles.card)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
            style === 'premium' && 'bg-gradient-to-br from-amber-500 to-orange-500',
            style === 'exclusive' && 'bg-gradient-to-br from-purple-500 to-pink-500',
            style === 'default' && 'bg-primary'
          )}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg">{title}</h3>
              {style === 'premium' && (
                <Badge className={styles.badge}>
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              {style === 'exclusive' && (
                <Badge className={styles.badge}>
                  <Lock className="w-3 h-3 mr-1" />
                  Exclusive
                </Badge>
              )}
            </div>

            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}

            {block.memberCount && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {block.memberCount}
              </p>
            )}
          </div>
        </div>

        {/* Join Button */}
        <Button 
          className={cn('w-full mt-4', styles.button)}
          onClick={handleJoin}
        >
          {buttonText}
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
});
