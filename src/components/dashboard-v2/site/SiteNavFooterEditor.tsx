/**
 * SiteNavFooterEditor — Sprint 1: Navigation Builder + Sitewide Footer editor.
 * Lets the owner reorder/hide pages in the public nav and configure the footer.
 * Stores everything in site.settings (no DB migration required).
 */
import { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowUp from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDown from 'lucide-react/dist/esm/icons/arrow-down';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  readSiteNav,
  readSiteFooter,
  readSiteRedirects,
  type SiteFooterLink,
  type SiteRedirect,
} from '@/services/sites';
import type { Site } from '@/types/site';
import type { SitePageSummary } from '@/types/site';
import { useUpdateSiteNav, useUpdateSiteFooter, useUpdateSiteRedirects } from '@/hooks/sites/useSite';

interface Props {
  site: Site | null | undefined;
  pages: SitePageSummary[];
  userId: string | undefined;
}

export const SiteNavFooterEditor = memo(function SiteNavFooterEditor({ site, pages, userId }: Props) {
  const { t } = useTranslation();
  const updateNav = useUpdateSiteNav(site?.id, userId);
  const updateFooter = useUpdateSiteFooter(site?.id, userId);
  const updateRedirects = useUpdateSiteRedirects(site?.id, userId);

  // ----- NAV state (subset of subPages — home is always pinned, not editable) -----
  const subPages = useMemo(() => pages.filter((p) => !p.is_home), [pages]);
  const initialNav = useMemo(() => readSiteNav(site?.settings ?? {}), [site?.settings]);

  // Ordered list of subPages applying nav.order
  const [order, setOrder] = useState<string[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    const byId = new Map(subPages.map((p) => [p.id, p] as const));
    const orderedIds: string[] = [];
    for (const id of initialNav.order) {
      if (byId.has(id)) {
        orderedIds.push(id);
        byId.delete(id);
      }
    }
    for (const p of byId.values()) orderedIds.push(p.id);
    setOrder(orderedIds);
    setHidden(new Set(initialNav.hidden));
  }, [initialNav.order, initialNav.hidden, subPages]);

  const move = (id: string, dir: -1 | 1) => {
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const toggleHidden = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveNav = async () => {
    const ok = await updateNav.mutateAsync({ order, hidden: Array.from(hidden) });
    if (ok) toast.success(t('siteNav.savedToast', 'Меню сайта обновлено'));
    else toast.error(t('siteNav.saveError', 'Не удалось сохранить меню'));
  };

  // ----- FOOTER state -----
  const initialFooter = useMemo(() => readSiteFooter(site?.settings ?? {}), [site?.settings]);
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');
  const [copyright, setCopyright] = useState('');
  const [links, setLinks] = useState<SiteFooterLink[]>([]);

  useEffect(() => {
    setEnabled(initialFooter.enabled);
    setText(initialFooter.text || '');
    setCopyright(initialFooter.copyright || '');
    setLinks(initialFooter.links || []);
  }, [initialFooter.enabled, initialFooter.text, initialFooter.copyright, initialFooter.links]);

  const addLink = () => {
    if (links.length >= 8) return;
    setLinks((p) => [...p, { label: '', url: '' }]);
  };
  const removeLink = (idx: number) => setLinks((p) => p.filter((_, i) => i !== idx));
  const updateLink = (idx: number, patch: Partial<SiteFooterLink>) =>
    setLinks((p) => p.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const saveFooter = async () => {
    const cleaned = links
      .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label && l.url);
    const ok = await updateFooter.mutateAsync({
      enabled,
      text: text.trim(),
      copyright: copyright.trim(),
      links: cleaned,
    });
    if (ok) toast.success(t('siteFooter.savedToast', 'Футер сохранён'));
    else toast.error(t('siteFooter.saveError', 'Не удалось сохранить футер'));
  };

  if (!site) return null;

  return (
    <Card className="border-0 shadow-none bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
          {t('siteNav.title', 'Меню и футер сайта')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- Navigation Builder --- */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">{t('siteNav.subtitle', 'Порядок страниц в меню')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('siteNav.hint', 'Главная страница всегда первой. Скрытые пункты не показываются в навигации.')}
              </p>
            </div>
            <Button size="sm" variant="default" className="rounded-xl" onClick={saveNav} disabled={updateNav.isPending}>
              {t('common.save', 'Сохранить')}
            </Button>
          </div>

          {subPages.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 px-2">
              {t('siteNav.empty', 'Подстраниц пока нет — добавьте их выше, чтобы настроить меню.')}
            </p>
          ) : (
            <div className="space-y-1.5">
              {order.map((id, idx) => {
                const p = subPages.find((x) => x.id === id);
                if (!p) return null;
                const isHidden = hidden.has(id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-background"
                  >
                    <div className="flex flex-col gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        disabled={idx === 0}
                        onClick={() => move(id, -1)}
                        aria-label={t('siteNav.moveUp', 'Выше')}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        disabled={idx === order.length - 1}
                        onClick={() => move(id, 1)}
                        aria-label={t('siteNav.moveDown', 'Ниже')}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${isHidden ? 'text-muted-foreground line-through' : ''}`}>
                        {p.title || p.page_path}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">/p/{p.page_path}</div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => toggleHidden(id)}
                      aria-label={
                        isHidden
                          ? t('siteNav.show', 'Показать в меню')
                          : t('siteNav.hide', 'Скрыть из меню')
                      }
                      title={
                        isHidden
                          ? t('siteNav.show', 'Показать в меню')
                          : t('siteNav.hide', 'Скрыть из меню')
                      }
                    >
                      {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* --- Sitewide Footer Editor --- */}
        <section className="space-y-3 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between gap-3 pt-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{t('siteFooter.title', 'Футер сайта')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('siteFooter.hint', 'Показывается внизу всех страниц сайта.')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="footer-enabled" />
              <Button size="sm" variant="default" className="rounded-xl" onClick={saveFooter} disabled={updateFooter.isPending}>
                {t('common.save', 'Сохранить')}
              </Button>
            </div>
          </div>

          {enabled && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="footer-text" className="text-xs">
                  {t('siteFooter.textLabel', 'Текст / описание')}
                </Label>
                <Textarea
                  id="footer-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('siteFooter.textPh', 'Краткое описание, миссия или контактная фраза')}
                  rows={2}
                  maxLength={300}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">
                  {t('siteFooter.linksLabel', 'Ссылки')} ({links.length}/8)
                </Label>
                <div className="space-y-2">
                  {links.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={l.label}
                        onChange={(e) => updateLink(i, { label: e.target.value })}
                        placeholder={t('siteFooter.linkLabelPh', 'Название')}
                        className="flex-1"
                        maxLength={40}
                      />
                      <Input
                        value={l.url}
                        onChange={(e) => updateLink(i, { url: e.target.value })}
                        placeholder="https://… / mailto:… / /p/about"
                        className="flex-[2]"
                        maxLength={400}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeLink(i)}
                        aria-label={t('common.delete', 'Удалить')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  {links.length < 8 && (
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={addLink}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {t('siteFooter.addLink', 'Добавить ссылку')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="footer-copy" className="text-xs">
                  {t('siteFooter.copyrightLabel', 'Копирайт')}
                </Label>
                <Input
                  id="footer-copy"
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                  placeholder={`© ${new Date().getFullYear()} ${site.name}`}
                  maxLength={120}
                />
              </div>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
});
