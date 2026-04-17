import { memo, useState, useCallback } from 'react';
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
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import { toast } from 'sonner';
import type { ZoneDealStage, ZonePipeline } from '@/types/zones';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableStageItemProps {
  stage: ZoneDealStage;
  onEdit: (s: ZoneDealStage) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

const SortableStageItem = ({ stage, onEdit, onDelete, disabled }: SortableStageItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 mb-2 group">
      <div {...attributes} {...listeners} className="cursor-grab p-2 text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      <Card className="flex-1 bg-card">
        <CardContent className="p-3 flex items-center justify-between">
          <span className="text-sm font-medium">{stage.name}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(stage)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(stage.id)} disabled={disabled}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ZonePipelineStageSettings = memo(function ZonePipelineStageSettings({ 
  zoneId, 
  pipeline 
}: { 
  zoneId: string; 
  pipeline: ZonePipeline;
}) {
  const { t } = useTranslation();
  const { stages, createStage, updateStage, deleteStage, reorderStages } = useZoneDeals(zoneId, pipeline.id);
  const [isEditing, setIsEditing] = useState<ZoneDealStage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);
      const newItems = arrayMove(stages, oldIndex, newIndex);
      
      // Update order_index for all
      const reordered = newItems.map((s, idx) => ({ id: s.id, order_index: idx }));
      try {
        await reorderStages(reordered);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createStage({ 
        name: name.trim(), 
        order_index: stages.length,
        pipeline_id: pipeline.id,
        zone_id: zoneId
      });
      toast.success(t('zones.settings.stages.created', 'Этап добавлен'));
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
      await updateStage(isEditing.id, { name: name.trim() });
      toast.success(t('zones.settings.stages.updated', 'Этап обновлен'));
      setIsEditing(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (stages.length <= 1) {
      toast.error(t('zones.settings.stages.cannotDeleteLast', 'Нельзя удалить последний этап'));
      return;
    }
    if (!confirm(t('zones.settings.stages.confirmDelete', 'Вы уверены? Сделки на этом этапе могут быть потеряны или потребуют перемещения.'))) return;
    
    try {
      await deleteStage(id);
      toast.success(t('zones.settings.stages.deleted', 'Этап удален'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">{t('zones.settings.stages.title', 'Этапы воронки')}: {pipeline.name}</h3>
        <Button size="sm" variant="outline" onClick={() => { setIsCreating(true); setName(''); }}>
          <Plus className="h-4 w-4 mr-1" />
          {t('zones.settings.stages.add', 'Добавить этап')}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {stages.map((stage) => (
              <SortableStageItem 
                key={stage.id} 
                stage={stage} 
                onEdit={(s) => { setIsEditing(s); setName(s.name); }} 
                onDelete={handleDelete}
                disabled={stages.length <= 1}
              />
            ))}
            {stages.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-xs border rounded-lg border-dashed">
                {t('zones.settings.stages.empty', 'В этой воронке еще нет этапов')}
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog open={isCreating || !!isEditing} onOpenChange={(v) => { if (!v) { setIsCreating(false); setIsEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? t('zones.settings.stages.edit', 'Редактировать этап') : t('zones.settings.stages.create', 'Новый этап')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('zones.settings.stages.nameLabel', 'Название этапа')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Например: Договор" />
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
