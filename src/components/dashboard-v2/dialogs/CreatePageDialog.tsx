/**
 * CreatePageDialog - Dialog for creating a new page
 */
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Crown from 'lucide-react/dist/esm/icons/crown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PageLimits } from '@/hooks/page/useMultiPage';
import { sanitizeSlug, slugifyTitle, slugWhileTyping, validateSlug } from '@/lib/utils/slug';

interface CreatePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limits: PageLimits | null;
  isPremium: boolean;
  onCreatePage: (title: string, slug?: string) => Promise<{ success: boolean; error?: string }>;
  onUpgrade: () => void;
}

export const CreatePageDialog = memo(function CreatePageDialog({
  open,
  onOpenChange,
  limits,
  isPremium,
  onCreatePage,
  onUpgrade,
}: CreatePageDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  // Until the owner edits the address it follows the title (transliterated).
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = limits?.canCreate ?? true;
  const autoSlug = useMemo(() => slugifyTitle(title), [title]);
  const sanitizedSlug = useMemo(() => sanitizeSlug(slugEdited ? slug : autoSlug), [slug, slugEdited, autoSlug]);
  const slugValidation = useMemo(() => {
    if (!sanitizedSlug) return { valid: true };
    return validateSlug(sanitizedSlug);
  }, [sanitizedSlug]);

  useEffect(() => {
    if (open) {
      setTitle('');
      setSlug('');
      setSlugEdited(false);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!title.trim()) {
      setError(t('dashboard.createPage.titleRequired', 'Title is required'));
      return;
    }

    if (slugEdited && sanitizedSlug) {
      if (!slugValidation.valid) {
        setError(t('dashboard.createPage.invalidSlug', 'URL must be 3-30 characters, lowercase letters, numbers, and hyphens only'));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // An automatic address may be taken: let the server add a suffix instead of failing.
      const result = await onCreatePage(title.trim(), slugEdited ? sanitizedSlug || undefined : undefined);

      if (result.success) {
        setTitle('');
        setSlug('');
        onOpenChange(false);
      } else {
        // Translate error
        const errorKey = result.error || 'unknown';
        const errorMessages: Record<string, string> = {
          page_limit_exceeded: t('dashboard.createPage.limitExceeded', 'Page limit exceeded. Upgrade to Pro for more pages.'),
          slug_taken: t('dashboard.createPage.slugTaken', 'This URL is already taken'),
          invalid_slug: t('dashboard.createPage.invalidSlug', 'URL must be 3-30 characters, lowercase letters, numbers, and hyphens only'),
        };
        setError(errorMessages[errorKey] || result.error || t('dashboard.createPage.error', 'Failed to create page'));
      }
    } catch {
      setError(t('dashboard.createPage.error', 'Failed to create page'));
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Keep a trailing hyphen while typing; the final address is sanitized on submit.
    const lenient = slugWhileTyping(value);
    setSlugEdited(true);
    setSlug(lenient);
  };

  const canSubmit = Boolean(title.trim()) && (!slugEdited || slugValidation.valid) && !loading;

  // Show upgrade prompt if can't create
  if (!canCreate && !isPremium) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">
              {t('dashboard.createPage.upgradeTitle', 'Upgrade to Pro')}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t('dashboard.createPage.upgradeDescription', 'Free plan includes 1 page. Upgrade to Pro for up to 6 pages.')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('dashboard.createPage.currentPlan', 'Current plan')}</span>
                <span className="text-sm font-medium">{t('dashboard.createPage.freePlan', 'Free')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('dashboard.createPage.pagesUsed', 'Pages used')}</span>
                <span className="text-sm font-medium">{limits?.currentPages}/{limits?.maxPages}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full h-12 rounded-xl"
              onClick={onUpgrade}
            >
              <Crown className="h-4 w-4 mr-2" />
              {t('dashboard.createPage.upgradeCta', 'Upgrade to Pro')}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dashboard.createPage.title', 'Create new page')}</DialogTitle>
          <DialogDescription>
            {t('dashboard.createPage.description', 'Give your page a name and optional custom URL.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">{t('dashboard.createPage.titleLabel', 'Page title')}</Label>
            <Input
              id="title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) void handleCreate(); }}
              enterKeyHint="go"
              placeholder={t('dashboard.createPage.titlePlaceholder', 'My awesome page')}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t('dashboard.createPage.slugLabel', 'Custom URL (optional)')}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">lnkmx.my/</span>
              <Input
                id="slug"
                value={slugEdited ? slug : autoSlug}
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder={t('dashboard.createPage.slugPlaceholder', 'my-page')}
                className="rounded-xl flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.createPage.slugHint', '3-30 characters, lowercase letters, numbers, and hyphens only')}
            </p>
            {slugEdited && !!sanitizedSlug && !slugValidation.valid && (
              <p className="text-xs text-destructive">
                {t('dashboard.createPage.invalidSlug', 'URL must be 3-30 characters, lowercase letters, numbers, and hyphens only')}
              </p>
            )}
          </div>

          {limits && (
            <div className="text-xs text-muted-foreground text-center">
              {t('dashboard.createPage.remaining', 'You can create {{count}} more page(s)', {
                count: limits.maxPages - limits.currentPages,
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={!canSubmit} className="rounded-xl">
            {loading ? t('common.creating', 'Creating...') : t('dashboard.createPage.create', 'Create page')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
