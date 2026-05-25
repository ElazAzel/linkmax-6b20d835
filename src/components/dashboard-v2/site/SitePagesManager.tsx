/**
 * SitePagesManager — Sprint 1: Multi-Page Foundation.
 * Lets the user list, add, and open sub-pages of their site.
 * Self-contained: fetches its own site + page list via hooks.
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Plus from 'lucide-react/dist/esm/icons/plus';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Home from 'lucide-react/dist/esm/icons/home';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/user/useAuth';
import {
  useMySite,
  useSitePages,
  useCreateSubPage,
  useDeleteSubPage,
  useSetPagePublished,
} from '@/hooks/sites/useSite';
import { SECTION_PRESETS, getSectionPreset, type SectionPresetId } from '@/lib/sections/section-presets';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PATH_RX = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

function normalizePath(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export const SitePagesManager = memo(function SitePagesManager() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const { data: site, isLoading: siteLoading } = useMySite(userId);
  const { data: pages = [], isLoading: pagesLoading } = useSitePages(site?.id);
  const createSubPage = useCreateSubPage(site?.id, userId);
  const deleteSubPage = useDeleteSubPage(site?.id);
  const setPublished = useSetPagePublished(site?.id);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');
  const [sectionId, setSectionId] = useState<SectionPresetId>('hero');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);

  const homePage = pages.find((p) => p.is_home);
  const subPages = pages.filter((p) => !p.is_home);

  const handleTogglePublish = async (pageId: string, current: boolean) => {
    const ok = await setPublished.mutateAsync({ pageId, isPublished: !current });
    if (ok) {
      toast.success(
        !current
          ? t('dashboard.sitePages.publishedToast', 'Страница опубликована')
          : t('dashboard.sitePages.unpublishedToast', 'Страница снята с публикации'),
      );
    } else {
      toast.error(t('dashboard.sitePages.toggleError', 'Не удалось изменить статус'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const ok = await deleteSubPage.mutateAsync(pendingDelete.id);
    if (ok) {
      toast.success(t('dashboard.sitePages.deleted', 'Страница удалена'));
    } else {
      toast.error(t('dashboard.sitePages.deleteError', 'Не удалось удалить страницу'));
    }
    setPendingDelete(null);
  };

  const handleCreate = async () => {
    const normalized = normalizePath(path || title);
    if (!PATH_RX.test(normalized)) {
      toast.error(
        t(
          'dashboard.sitePages.invalidPath',
          'Путь должен содержать только латинские буквы, цифры и дефис'
        )
      );
      return;
    }
    if (subPages.some((p) => p.page_path === normalized)) {
      toast.error(t('dashboard.sitePages.pathTaken', 'Такой путь уже существует'));
      return;
    }
    const preset = getSectionPreset(sectionId);
    const seedBlocks = preset ? preset.build() : [];
    const result = await createSubPage.mutateAsync({
      pagePath: normalized,
      title: title.trim() || normalized,
      seedBlocks,
    });
    if (result) {
      toast.success(t('dashboard.sitePages.created', 'Страница создана'));
      setOpen(false);
      setTitle('');
      setPath('');
      setSectionId('hero');
    } else {
      toast.error(t('dashboard.sitePages.createError', 'Не удалось создать страницу'));
    }
  };

  if (siteLoading || pagesLoading || !site) return null;

  return (
    <Card className="border-0 shadow-none bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-medium">
            {t('dashboard.sitePages.title', 'Страницы сайта')}
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-xl">
                <Plus className="w-4 h-4 mr-1" />
                {t('dashboard.sitePages.add', 'Добавить')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {t('dashboard.sitePages.newTitle', 'Новая страница сайта')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="sub-title">
                    {t('dashboard.sitePages.titleLabel', 'Название')}
                  </Label>
                  <Input
                    id="sub-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('dashboard.sitePages.titlePh', 'Например: О нас')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-path">
                    {t('dashboard.sitePages.pathLabel', 'Путь (URL)')}
                  </Label>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-muted-foreground">
                      /{homePage?.slug || 'username'}/p/
                    </span>
                    <Input
                      id="sub-path"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      placeholder="about"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'dashboard.sitePages.pathHint',
                      'Латиница, цифры, дефисы. До 40 символов.'
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-section">
                    {t('dashboard.sitePages.sectionLabel', 'Стартовая секция')}
                  </Label>
                  <Select value={sectionId} onValueChange={(v: string) => setSectionId(v as SectionPresetId)}>
                    <SelectTrigger id="sub-section">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_PRESETS.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {t(s.labelKey, s.labelFallback)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      getSectionPreset(sectionId)?.descKey || '',
                      getSectionPreset(sectionId)?.descFallback || ''
                    )}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  {t('common.cancel', 'Отмена')}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createSubPage.isPending || (!title.trim() && !path.trim())}
                >
                  {t('dashboard.sitePages.create', 'Создать')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {homePage && (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-background">
            <Home className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {homePage.title || homePage.slug}
              </div>
              <div className="text-xs text-muted-foreground truncate">/{homePage.slug}</div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {t('dashboard.sitePages.home', 'Главная')}
            </Badge>
          </div>
        )}
        {subPages.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 px-2">
            {t(
              'dashboard.sitePages.empty',
              'Пока нет дополнительных страниц. Добавьте «О нас», «Цены», «Контакты» — и получите полноценный сайт.'
            )}
          </p>
        )}
        {subPages.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-background">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{p.title || p.page_path}</div>
              <div className="text-xs text-muted-foreground truncate">
                /{homePage?.slug}/p/{p.page_path}
              </div>
            </div>
            {p.is_published ? (
              <Badge variant="secondary" className="text-xs">
                {t('dashboard.sitePages.published', 'Опубликована')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                {t('dashboard.sitePages.draft', 'Черновик')}
              </Badge>
            )}
            {p.is_published && homePage && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() =>
                  window.open(`/${homePage.slug}/p/${p.page_path}`, '_blank', 'noopener')
                }
                aria-label={t('common.open', 'Открыть')}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
});
