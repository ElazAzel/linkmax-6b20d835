/**
 * ChangePasswordDialog - Dialog for changing user password
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChangePasswordDialog = memo(function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const { handleError } = useAppError();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!newPassword) {
      newErrors.newPassword = t('settings.password.required', 'Password is required');
    } else if (newPassword.length < 8) {
      newErrors.newPassword = t('settings.password.minLength', 'Password must be at least 8 characters');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('settings.password.confirmRequired', 'Please confirm your password');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('settings.password.mismatch', 'Passwords do not match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast.success(t('settings.password.success', 'Password updated successfully'));
      onOpenChange(false);
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    } catch (error: any) {
      console.error('Password update error:', error);
      handleError(error, t('settings.password.error', 'Failed to update password'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {t('settings.password.title', 'Change Password')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.password.description', 'Enter your new password below')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">
              {t('settings.password.newPassword', 'New Password')}
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }}
                placeholder="••••••••"
                className={errors.newPassword ? 'border-destructive' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">
              {t('settings.password.confirmPassword', 'Confirm Password')}
            </Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              placeholder="••••••••"
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {t('settings.password.hint', 'Use at least 8 characters with a mix of letters and numbers')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? t('common.loading', 'Loading...') : t('settings.password.submit', 'Update Password')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
