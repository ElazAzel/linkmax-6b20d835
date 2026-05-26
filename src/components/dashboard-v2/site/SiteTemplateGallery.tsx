/**
 * SiteTemplateGallery — Sprint 1 (Global Plan).
 * Dialog with ready-made multi-page site templates. Applying a template
 * batch-creates the sub-pages it defines, each seeded with composed blocks.
 *
 * Respects Starter limit: pages are taken in order until the user's remaining
 * sub-page slots are filled; Pro users get the full template.
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import User from 'lucide-react/dist/esm/icons/user';
import Coffee from 'lucide-react/dist/esm/icons/coffee';
import GraduationCap from 'lucide-react/dist/esm/icons/graduation-cap';
import Image from 'lucide-react/dist/esm/icons/image';
import Rocket from 'lucide-react/dist/esm/icons/rocket';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  SITE_TEMPLATES,
  buildPageBlocks,
  type SiteTemplate,
  type SiteTemplateId,
} from '@/lib/sections/site-templates';
import { useApplySiteTemplate } from '@/hooks/sites/useSite';

const ICONS = {
  briefcase: Briefcase,
  user: User,
  coffee: Coffee,
  'graduation-cap': GraduationCap,
  image: Image,
  rocket: Rocket,
} as const;

interface SiteTemplateGalleryProps {
  siteId: string | undefined;
  userId: string | undefined;
  /** How many sub-pages the user can still create (Infinity for Pro). */
  remainingSlots: number;
  /** Whether the trigger button should be disabled (e.g. no remaining slots). */
  disabled?: boolean;
}

export const SiteTemplateGallery = memo(function SiteTemplateGallery({
  siteId,
  userId,
  remainingSlots,
  disabled = false,
}: SiteTemplateGalleryProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SiteTemplateId | null>(null);
  const apply = useApplySiteTemplate(siteId, userId);

  const handleApply = async (tpl: SiteTemplate) => {
    if (!siteId || !userId) return;
    // Trim to remaining slots so we never violate Starter limit.
    const pages = tpl.pages.slice(0, Math.max(0, remainingSlots)).map((p) => ({
      path: p.path,
      title: t(p.titleKey, p.titleFallback),
      seedBlocks: buildPageBlocks(p.sections),
    }));
    if (pages.length === 0) {
      toast.error(
        t(
          'siteTemplates.noSlots',
          'Нет свободных страниц. Удалите лишние или обновитесь до Pro.',
        ),
      );
      return;
    }
    const res = await apply.mutateAsync(pages);
    if (res.created > 0) {
      toast.success(
        t('siteTemplates.appliedToast', 'Создано страниц: {{n}}', { n: res.created }),
      );
      setOpen(false);
      setSelected(null);
    } else if (res.skipped.length > 0) {
      toast.error(
        t('siteTemplates.allSkipped', 'Все страницы шаблона уже существуют'),
      );
    } else {
      toast.error(t('siteTemplates.applyError', 'Не удалось применить шаблон'));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSelected(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl"
          disabled={disabled}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          {t('siteTemplates.trigger', 'Шаблон сайта')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t('siteTemplates.title', 'Готовые шаблоны сайта')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'siteTemplates.subtitle',
              'Выберите шаблон — мы создадим страницы и наполним их секциями. Контент потом легко поменять.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto py-2">
          {SITE_TEMPLATES.map((tpl) => {
            const Icon = ICONS[tpl.icon];
            const isSelected = selected === tpl.id;
            const pagesToCreate = Math.min(tpl.pages.length, remainingSlots);
            const trimmed = pagesToCreate < tpl.pages.length;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelected(tpl.id)}
                className={[
                  'text-left rounded-2xl p-4 transition-all border',
                  isSelected
                    ? 'border-foreground/40 bg-muted/60 ring-2 ring-foreground/10'
                    : 'border-border/60 bg-background hover:bg-muted/40',
                ].join(' ')}
                aria-pressed={isSelected}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                      tpl.accent ?? 'bg-muted text-foreground',
                    ].join(' ')}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {t(tpl.labelKey, tpl.labelFallback)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {t(tpl.descKey, tpl.descFallback)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tpl.pages.map((p, i) => (
                    <Badge
                      key={p.path}
                      variant={i < pagesToCreate ? 'secondary' : 'outline'}
                      className="text-[10px] font-normal"
                    >
                      {t(p.titleKey, p.titleFallback)}
                    </Badge>
                  ))}
                </div>
                {trimmed && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {t(
                      'siteTemplates.trimmedHint',
                      'На Starter добавим первые {{n}} страниц. Pro — все.',
                      { n: pagesToCreate },
                    )}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t('common.cancel', 'Отмена')}
          </Button>
          <Button
            disabled={!selected || apply.isPending || remainingSlots === 0}
            onClick={() => {
              const tpl = SITE_TEMPLATES.find((s) => s.id === selected);
              if (tpl) void handleApply(tpl);
            }}
          >
            {apply.isPending
              ? t('siteTemplates.applying', 'Создаём…')
              : t('siteTemplates.apply', 'Применить шаблон')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
