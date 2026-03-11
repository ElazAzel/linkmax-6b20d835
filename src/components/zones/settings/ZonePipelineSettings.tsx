import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { toast } from 'sonner';
import type { ZonePipeline } from '@/types/zones';

export const ZonePipelineSettings = memo(function ZonePipelineSettings({ zoneId }: { zoneId: string }) {
  const { t } = useTranslation();
  const { pipelines, createPipeline, updatePipeline, deletePipeline } = useZoneDeals(zoneId);
  const [isEditing, setIsEditing] = useState<ZonePipeline | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createPipeline({ name: name.trim(), is_default: pipelines.length === 0, order_index: pipelines.length });
      toast.success(t('zones.settings.pipelines.created', 'Воронка создана'));
      setIsCreating(false);
      setName('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!isEditing || !name.trim()) return;
    setLoading(true);
    try {
      await updatePipeline(isEditing.id, { name: name.trim() });
      toast.success(t('zones.settings.pipelines.updated', 'Воронка обновлена'));
      setIsEditing(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (pipelines.length <= 1) {
      toast.error(t('zones.settings.pipelines.cannotDeleteLast', 'Нельзя удалить последнюю воронку'));
      return;
    }
    if (!confirm(t('zones.settings.pipelines.confirmDelete', 'Вы уверены? Удаление воронки может затронуть связанные сделки.'))) return;
    
    try {
      await deletePipeline(id);
      toast.success(t('zones.settings.pipelines.deleted', 'Воронка удалена'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{t('zones.settings.pipelines.description', 'Управляйте пайплайнами для организации процессов продаж и обслуживания.')}</p>
        <Button size="sm" onClick={() => { setIsCreating(true); setName(''); }}>
          <Plus className="h-4 w-4 mr-1" />
          {t('zones.settings.pipelines.add', 'Добавить воронку')}
        </Button>
      </div>

      <div className="space-y-2">
        {pipelines.map(pipeline => (
          <Card key={pipeline.id} className="bg-card">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{pipeline.name}</p>
                {pipeline.is_default && <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{t('zones.settings.pipelines.default', 'По умолчанию')}</span>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setIsEditing(pipeline); setName(pipeline.name); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" disabled={pipelines.length <= 1} onClick={() => handleDelete(pipeline.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {pipelines.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm border rounded-lg border-dashed">
            {t('zones.settings.pipelines.empty', 'Нет созданных воронок')}
          </div>
        )}
      </div>

      <Dialog open={isCreating || !!isEditing} onOpenChange={(v) => { if (!v) { setIsCreating(false); setIsEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? t('zones.settings.pipelines.edit', 'Редактировать воронку') : t('zones.settings.pipelines.create', 'Новая воронка')}</DialogTitle>
            <DialogDescription className="sr-only">Edit or create pipeline settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('zones.settings.pipelines.nameLabel', 'Название воронки')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Вторичные продажи" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreating(false); setIsEditing(null); }}>
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button onClick={isEditing ? handleUpdate : handleCreate} disabled={!name.trim() || loading}>
              {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {t('common.save', 'Сохранить')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
