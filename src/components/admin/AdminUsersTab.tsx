import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminUsers, useSetUserTier, useExtendTrial, useSetPremiumExpiry, useToggleVerification, type AdminUserData, type AdminPremiumTier } from '@/hooks/admin/useAdminUsers';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import Search from 'lucide-react/dist/esm/icons/search';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import Flame from 'lucide-react/dist/esm/icons/flame';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check';
import { useQueryClient } from '@tanstack/react-query';

function getTierFromUser(user: AdminUserData): AdminPremiumTier {
  if (!user.is_premium) return 'free';
  if (user.premium_tier === 'business') return 'business';
  return 'pro';
}

const TIER_BADGE_VARIANTS: Record<AdminPremiumTier, 'secondary' | 'default' | 'destructive'> = {
  free: 'secondary',
  pro: 'default',
  business: 'destructive',
};

const TIER_LABELS: Record<AdminPremiumTier, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
};

export function AdminUsersTab() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { data: users, isLoading, isFetching } = useAdminUsers();
  const setTier = useSetUserTier();
  const extendTrial = useExtendTrial();
  const setPremiumExpiry = useSetPremiumExpiry();
  const toggleVerification = useToggleVerification();
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
                <TableHead>Тариф</TableHead>
                <TableHead>Подписка до</TableHead>
                <TableHead>{t('admin.trialUntil') || 'Триал до'}</TableHead>
                <TableHead>{t('admin.streak') || 'Стрик'}</TableHead>
                <TableHead>{t('admin.registered') || 'Дата'}</TableHead>
                <TableHead>{t('admin.actions') || 'Действия'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((adminUser: AdminUserData) => {
                const currentTier = getTierFromUser(adminUser);
                return (
                  <TableRow key={adminUser.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            {adminUser.display_name || adminUser.username || 'Без имени'}
                            {adminUser.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                          </p>
                          <p className="text-sm text-muted-foreground">@{adminUser.username || 'unknown'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TIER_BADGE_VARIANTS[currentTier]}>
                        {TIER_LABELS[currentTier]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {adminUser.premium_expires_at ? (
                        <span className={new Date(adminUser.premium_expires_at) > new Date() ? 'text-green-600' : 'text-muted-foreground line-through'}>
                          {format(new Date(adminUser.premium_expires_at), 'dd.MM.yyyy', { locale: getDateLocale() })}
                        </span>
                      ) : (
                        currentTier !== 'free' ? <span className="text-muted-foreground">∞</span> : '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {adminUser.trial_ends_at ? (
                        <span className={new Date(adminUser.trial_ends_at) > new Date() ? 'text-green-600' : 'text-muted-foreground'}>
                          {format(new Date(adminUser.trial_ends_at), 'dd.MM.yyyy', { locale: getDateLocale() })}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {adminUser.current_streak > 0 && (
                        <div className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span>{adminUser.current_streak}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(adminUser.created_at), 'dd.MM.yyyy', { locale: getDateLocale() })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Tier selector */}
                        <Select
                          value={currentTier}
                          onValueChange={(v: string) => setTier.mutate({ userId: adminUser.id, tier: v as AdminPremiumTier })}
                          disabled={setTier.isPending}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Subscription duration */}
                        <Select onValueChange={(v: string) => setPremiumExpiry.mutate({ userId: adminUser.id, days: parseInt(v) })}>
                          <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Подписка" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">+30 дней</SelectItem>
                            <SelectItem value="90">+90 дней</SelectItem>
                            <SelectItem value="180">+180 дней</SelectItem>
                            <SelectItem value="365">+1 год</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Trial */}
                        <Select onValueChange={(v: string) => extendTrial.mutate({ userId: adminUser.id, days: parseInt(v) })}>
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Триал" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">+7 дней</SelectItem>
                            <SelectItem value="14">+14 дней</SelectItem>
                            <SelectItem value="30">+30 дней</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Verification toggle */}
                        <Button
                          size="sm"
                          variant={adminUser.is_verified ? 'outline' : 'secondary'}
                          onClick={() => toggleVerification.mutate({ userId: adminUser.id, currentStatus: !!adminUser.is_verified })}
                          disabled={toggleVerification.isPending}
                          title={adminUser.is_verified ? 'Снять верификацию' : 'Верифицировать'}
                        >
                          <BadgeCheck className={`h-4 w-4 ${adminUser.is_verified ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
