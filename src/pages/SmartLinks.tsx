/**
 * SmartLinks dashboard (`/dashboard/smart-links`).
 *
 * Минимальный CRUD-панель поверх `smart_links`. Держим её отдельно от
 * основного DashboardV2, чтобы не расширять tab-модель дашборда без нужды —
 * фича свежая (P1) и требует изолированного цикла обкатки.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, Copy, ExternalLink, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/user/useAuth';
import {
  buildSmartLinkUrl,
  createSmartLink,
  deleteSmartLink,
  isValidSmartLinkSlug,
  listMySmartLinks,
  updateSmartLink,
  type SmartLink,
} from '@/lib/growth/smart-links';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

export default function SmartLinks() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: '',
    target_url: '',
    campaign: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
  });

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoading(true);
    listMySmartLinks(user.id)
      .then((rows) => { if (mounted) setItems(rows); })
      .catch((e) => toast.error(e?.message ?? 'Не удалось загрузить SmartLinks'))
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [user]);

  const origin = useMemo(
    () => (typeof window !== 'undefined' ? window.location.origin : 'https://lnkmx.my'),
    []
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!isValidSmartLinkSlug(form.slug)) {
      toast.error('Slug: a-z, 0-9, "-", "_", 2–64 символа');
      return;
    }
    try {
      new URL(form.target_url);
    } catch {
      toast.error('Некорректный target URL');
      return;
    }
    setSaving(true);
    try {
      const created = await createSmartLink(user.id, {
        slug: form.slug.trim().toLowerCase(),
        target_url: form.target_url.trim(),
        campaign: form.campaign.trim() || null,
        utm_source: form.utm_source.trim() || null,
        utm_medium: form.utm_medium.trim() || null,
        utm_campaign: form.utm_campaign.trim() || null,
      });
      setItems((prev) => [created, ...prev]);
      setForm({ slug: '', target_url: '', campaign: '', utm_source: '', utm_medium: '', utm_campaign: '' });
      toast.success('SmartLink создан');
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(row: SmartLink) {
    try {
      const updated = await updateSmartLink(row.id, { is_active: !row.is_active });
      setItems((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Ошибка');
    }
  }

  async function handleDelete(row: SmartLink) {
    if (!confirm(`Удалить SmartLink /s/${row.slug}?`)) return;
    try {
      await deleteSmartLink(row.id);
      setItems((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Ошибка удаления');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard"><ArrowLeft className="w-4 h-4 mr-1" />Дашборд</Link>
          </Button>
        </div>

        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">SmartLinks</h1>
          <p className="text-sm text-muted-foreground">
            Короткие ссылки с UTM-атрибуцией и счётчиком кликов. Публичный формат:{' '}
            <code className="text-xs">{origin}/s/&lt;slug&gt;</code>
          </p>
        </header>

        <Card className="p-4 sm:p-6">
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="promo-fall" required />
            </div>
            <div className="sm:col-span-1">
              <Label htmlFor="target_url">Target URL *</Label>
              <Input id="target_url" type="url" value={form.target_url} onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))} placeholder="https://example.com/landing" required />
            </div>
            <div>
              <Label htmlFor="utm_source">utm_source</Label>
              <Input id="utm_source" value={form.utm_source} onChange={(e) => setForm((f) => ({ ...f, utm_source: e.target.value }))} placeholder="instagram" />
            </div>
            <div>
              <Label htmlFor="utm_medium">utm_medium</Label>
              <Input id="utm_medium" value={form.utm_medium} onChange={(e) => setForm((f) => ({ ...f, utm_medium: e.target.value }))} placeholder="bio" />
            </div>
            <div>
              <Label htmlFor="utm_campaign">utm_campaign</Label>
              <Input id="utm_campaign" value={form.utm_campaign} onChange={(e) => setForm((f) => ({ ...f, utm_campaign: e.target.value }))} placeholder="autumn-2026" />
            </div>
            <div>
              <Label htmlFor="campaign">Campaign name</Label>
              <Input id="campaign" value={form.campaign} onChange={(e) => setForm((f) => ({ ...f, campaign: e.target.value }))} placeholder="Осенний оффер" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Создать
              </Button>
            </div>
          </form>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Мои ссылки</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground text-center">Пока нет SmartLinks. Создайте первый выше.</Card>
          ) : (
            <div className="space-y-2">
              {items.map((row) => {
                const publicUrl = buildSmartLinkUrl(row.slug, origin);
                return (
                  <Card key={row.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-sm font-medium truncate">/s/{row.slug}</code>
                        {!row.is_active && <span className="text-xs text-muted-foreground">(отключён)</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">→ {row.target_url}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {row.click_count} кликов · {row.conversion_count} конверсий
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch checked={row.is_active} onCheckedChange={() => handleToggle(row)} aria-label="Активна" />
                      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Ссылка скопирована'); }} aria-label="Скопировать">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild aria-label="Открыть">
                        <a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} aria-label="Удалить">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
