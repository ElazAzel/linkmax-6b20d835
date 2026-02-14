import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUsers, useTogglePremium, useExtendTrial, AdminUserData } from '@/hooks/useAdminUsers';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import { Search, Loader2, RefreshCw, Flame } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function AdminUsersTab() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: users, isLoading, isFetching } = useAdminUsers();
  const togglePremium = useTogglePremium();
  const extendTrial = useExtendTrial();
  const [searchQuery, setSearchQuery] = useState('');

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'kk': return kk;
      default: return enUS;
    }
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.searchUsers') || 'Поиск пользователей...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {t('admin.refresh') || 'Обновить'}
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.user') || 'Пользователь'}</TableHead>
                <TableHead>{t('admin.status') || 'Статус'}</TableHead>
                <TableHead>{t('admin.trialUntil') || 'Триал до'}</TableHead>
                <TableHead>{t('admin.streak') || 'Стрик'}</TableHead>
                <TableHead>{t('admin.registered') || 'Дата'}</TableHead>
                <TableHead>{t('admin.actions') || 'Действия'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.display_name || user.username || 'Без имени'}</p>
                      <p className="text-sm text-muted-foreground">@{user.username || 'unknown'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_premium ? 'default' : 'secondary'}>
                      {user.is_premium ? 'Premium' : 'Free'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.trial_ends_at ? (
                      <span className={new Date(user.trial_ends_at) > new Date() ? 'text-green-600' : 'text-muted-foreground'}>
                        {format(new Date(user.trial_ends_at), 'dd.MM.yyyy', { locale: getDateLocale() })}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {user.current_streak > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span>{user.current_streak}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(user.created_at), 'dd.MM.yyyy', { locale: getDateLocale() })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={user.is_premium ? 'destructive' : 'default'}
                        onClick={() => togglePremium.mutate({ userId: user.id, currentStatus: user.is_premium })}
                        disabled={togglePremium.isPending}
                      >
                        {togglePremium.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (user.is_premium ? 'Убрать Premium' : 'Дать Premium')}
                      </Button>
                      <Select onValueChange={(v) => extendTrial.mutate({ userId: user.id, days: parseInt(v) })}>
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="+Триал" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">+7 дней</SelectItem>
                          <SelectItem value="14">+14 дней</SelectItem>
                          <SelectItem value="30">+30 дней</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('admin.noUsersFound') || 'Пользователи не найдены'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
