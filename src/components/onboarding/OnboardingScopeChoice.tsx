/**
 * OnboardingScopeChoice — Sprint 1 (Global Plan).
 * First-time gate that asks the user whether they want a single page
 * (link-in-bio classic) or a full multi-page site from a template.
 *
 * Routes the user accordingly:
 *  - "single" → opens AIBuilderWizard (existing flow)
 *  - "site"   → navigates to dashboard?tab=pages&action=site-template
 *
 * Choice is non-destructive: dismissing snoozes via the same storage key
 * as the AI Builder wizard.
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

interface Props {
  open: boolean;
  onChooseSingle: () => void;
  onClose: () => void;
}

export const OnboardingScopeChoice = memo(function OnboardingScopeChoice({
  open,
  onChooseSingle,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSite = () => {
    onClose();
    navigate('/dashboard?tab=pages&action=site-template', { replace: false });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 mb-2 inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            {t('onboardingScope.eyebrow', 'С чего начнём')}
          </div>
          <DialogTitle className="text-xl">
            {t('onboardingScope.title', 'Одна страница или полноценный сайт?')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'onboardingScope.subtitle',
              'Можно начать с лёгкой link-in-bio страницы или сразу собрать сайт из готового шаблона.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onChooseSingle}
            className="text-left rounded-2xl p-4 border border-border/60 bg-background hover:bg-muted/40 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-foreground/5 flex items-center justify-center mb-3">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div className="text-sm font-medium">
              {t('onboardingScope.singleTitle', 'Одна страница')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                'onboardingScope.singleDesc',
                'Классическая link-in-bio: блоки, контакты, мессенджеры. Быстрый старт.',
              )}
            </p>
          </button>

          <button
            type="button"
            onClick={handleSite}
            className="text-left rounded-2xl p-4 border border-foreground/30 bg-muted/40 hover:bg-muted/60 transition-all ring-1 ring-foreground/5"
          >
            <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center mb-3">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div className="text-sm font-medium flex items-center gap-1.5">
              {t('onboardingScope.siteTitle', 'Сайт из шаблона')}
              <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                {t('onboardingScope.recommended', 'Рекомендуем')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                'onboardingScope.siteDesc',
                'Несколько готовых страниц (Главная, Услуги, FAQ) с навигацией и футером.',
              )}
            </p>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('onboardingScope.later', 'Позже')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
