import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Check from 'lucide-react/dist/esm/icons/check';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/user/useAuth';
import { cn } from '@/lib/utils/utils';

interface DeviceAccountSwitcherProps {
  className?: string;
  onAddAccount?: () => void;
  compact?: boolean;
}

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || '?';
}

export function DeviceAccountSwitcher({ className, onAddAccount, compact = false }: DeviceAccountSwitcherProps) {
  const { t } = useTranslation();
  const { user, deviceAccounts, switchDeviceAccount, removeDeviceAccount, signOut } = useAuth();
  const [switchingUserId, setSwitchingUserId] = useState<string | null>(null);
  const [accountToRemove, setAccountToRemove] = useState<string | null>(null);

  const otherAccounts = deviceAccounts.filter((account) => account.userId !== user?.id);
  const hasAccounts = deviceAccounts.length > 0;

  const handleSwitch = async (userId: string) => {
    if (userId === user?.id || switchingUserId) return;
    setSwitchingUserId(userId);
    const { error } = await switchDeviceAccount(userId);
    setSwitchingUserId(null);

    if (error) {
      toast.error(t('auth.accountSwitchFailed', 'Не удалось переключиться. Войдите в аккаунт заново.'));
      return;
    }

    toast.success(t('auth.accountSwitched', 'Аккаунт переключен'));
  };

  const handleAddAccount = async () => {
    if (user) await signOut({ localOnly: true });
    onAddAccount?.();
  };

  const accountPendingRemoval = deviceAccounts.find((account) => account.userId === accountToRemove);

  if (!hasAccounts && !onAddAccount) return null;

  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-card', className)}>
      <div className="border-b border-border/50 px-4 py-3">
        <div className="text-sm font-bold">{t('auth.deviceAccounts', 'Аккаунты на этом устройстве')}</div>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            {t('auth.deviceAccountsHint', 'Можно быстро переключаться между аккаунтами без повторного ввода пароля.')}
          </p>
        )}
      </div>

      {hasAccounts && (
        <div className="divide-y divide-border/40">
          {deviceAccounts.map((account) => {
            const isCurrent = account.userId === user?.id;
            const isSwitching = switchingUserId === account.userId;

            return (
              <div key={account.userId} className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10 rounded-md">
                  <AvatarImage src={account.avatarUrl || ''} alt={account.email} />
                  <AvatarFallback className="rounded-md bg-primary/10 text-primary font-bold">
                    {getInitial(account.displayName || account.email)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="min-h-11 min-w-0 flex-1 rounded-lg py-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                  onClick={() => handleSwitch(account.userId)}
                  disabled={isCurrent || isSwitching}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  <div className="truncate text-sm font-semibold">
                    {account.displayName || account.email}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{account.email}</div>
                </button>
                {isCurrent ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => handleSwitch(account.userId)}
                    disabled={isSwitching}
                  >
                    {isSwitching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('auth.switch', 'Сменить')}
                  </Button>
                )}
                {!isCurrent && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label={t('auth.removeSavedAccount', 'Убрать аккаунт из списка')}
                    onClick={() => setAccountToRemove(account.userId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {onAddAccount && (
        <div className="p-3">
          <Button type="button" variant="outline" className="w-full gap-2 rounded-md" onClick={handleAddAccount}>
            <Plus className="h-4 w-4" />
            {otherAccounts.length > 0
              ? t('auth.addAnotherAccount', 'Добавить еще аккаунт')
              : t('auth.useAnotherAccount', 'Войти под другим аккаунтом')}
          </Button>
        </div>
      )}

      <AlertDialog open={Boolean(accountPendingRemoval)} onOpenChange={(open) => !open && setAccountToRemove(null)}>
        <AlertDialogContent className="max-w-sm rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('auth.removeSavedAccountTitle', 'Remove this account from the device?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('auth.removeSavedAccountDescription', 'The account will remain available, but signing in again will require authentication.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (accountPendingRemoval) removeDeviceAccount(accountPendingRemoval.userId);
                setAccountToRemove(null);
              }}
            >
              {t('auth.removeSavedAccount', 'Remove account')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
