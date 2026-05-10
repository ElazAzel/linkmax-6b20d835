/**
 * ZoneNotificationBell - Bell icon with unread badge + popover for zone notifications
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneNotifications } from '@/hooks/zones/useZoneNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Bell from 'lucide-react/dist/esm/icons/bell';
import CheckCheck from 'lucide-react/dist/esm/icons/check-check';
import Users from 'lucide-react/dist/esm/icons/users';
import Target from 'lucide-react/dist/esm/icons/target';
import Info from 'lucide-react/dist/esm/icons/info';
import { formatRelativeTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/utils';

interface Props {
  zoneId: string;
}

const typeIcons: Record<string, typeof Info> = {
  new_contact: Users,
  new_deal: Target,
  info: Info,
};

export const ZoneNotificationBell = memo(function ZoneNotificationBell({ zoneId }: Props) {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead, markAllRead } = useZoneNotifications(zoneId);

  const bellLabel =
    unreadCount > 0
      ? t('zone.notifications.ariaLabelUnread', {
          defaultValue: 'Уведомления, {{count}} непрочитанных',
          count: unreadCount,
        })
      : t('zone.notifications.ariaLabel', 'Уведомления');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label={bellLabel}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-xs font-bold bg-destructive text-destructive-foreground border-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only" aria-live="polite">
            {unreadCount > 0
              ? t('zone.notifications.unreadCount', {
                  defaultValue: '{{count}} непрочитанных уведомлений',
                  count: unreadCount,
                })
              : ''}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <p className="text-xs font-bold">{t('zone.notifications.title', 'Уведомления')}</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-muted-foreground"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="h-3 w-3" />
              {t('zone.notifications.markAllRead', 'Прочитать все')}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {t('zone.notifications.empty', 'Нет уведомлений')}
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {notifications.map(n => {
                const Icon = typeIcons[n.type] || Info;
                return (
                  <button
                    key={n.id}
                    className={cn(
                      "w-full text-left p-3 flex items-start gap-2.5 hover:bg-muted/30 transition-colors",
                      !n.is_read && "bg-primary/5"
                    )}
                    onClick={() => !n.is_read && markAsRead(n.id)}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0 mt-0.5",
                      !n.is_read ? "bg-primary/10" : "bg-muted/30"
                    )}>
                      <Icon className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs truncate", !n.is_read ? "font-bold" : "font-medium")}>{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(n.created_at, 'ru')}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
});
