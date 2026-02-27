/**
 * ZoneDealsScreen - Kanban pipeline for zone deals with DnD
 */
import { memo, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Filter from 'lucide-react/dist/esm/icons/filter';
import { toast } from 'sonner';
import type { ZoneDeal } from '@/types/zones';
import { DealKanbanColumn } from './deals/DealKanbanColumn';
import { DealCard } from './deals/DealCard';
import { DealDetailSheet } from './deals/DealDetailSheet';

interface ZoneDealsScreenProps {
  zoneId: string;
}

export const ZoneDealsScreen = memo(function ZoneDealsScreen({ zoneId }: ZoneDealsScreenProps) {
  const { t } = useTranslation();
  const { deals, stages, loading, createDeal, updateDeal, moveDealToStage, addActivity } = useZoneDeals(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<ZoneDeal | null>(null);
  const [activeDragDeal, setActiveDragDeal] = useState<ZoneDeal | null>(null);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: '', contact_id: '', value_amount: 0, next_step: '' });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const map = new Map<string, ZoneDeal[]>();
    stages.forEach((s) => map.set(s.id, []));
    const openDeals = deals.filter((d) => {
      if (d.status !== 'open') return false;
      if (filterOverdue && (!d.next_step_at || new Date(d.next_step_at) >= new Date())) return false;
      return true;
    });
    openDeals.forEach((d) => {
      if (d.stage_id && map.has(d.stage_id)) {
        map.get(d.stage_id)!.push(d);
      } else if (stages.length > 0) {
        const first = stages[0];
        if (!map.has(first.id)) map.set(first.id, []);
        map.get(first.id)!.push(d);
      }
    });
    return map;
  }, [deals, stages, filterOverdue]);

  const handleDragStart = useCallback((event: any) => {
    const deal = event.active.data.current?.deal as ZoneDeal | undefined;
    setActiveDragDeal(deal || null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const targetStageId = over.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === targetStageId) return;

    try {
      await moveDealToStage(dealId, targetStageId);
      const stage = stages.find((s) => s.id === targetStageId);
      if (stage) {
        await addActivity(dealId, 'stage_change', `Moved to ${stage.name}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [deals, stages, moveDealToStage, addActivity]);

  const handleCreate = async () => {
    if (!newDeal.title.trim()) return;
    try {
      const defaultStage = stages.find((s) => s.is_default) || stages[0];
      await createDeal({
        title: newDeal.title,
        contact_id: newDeal.contact_id || null,
        value_amount: newDeal.value_amount,
        next_step: newDeal.next_step || null,
        stage_id: defaultStage?.id || null,
        status: 'open',
        currency: 'KZT',
      } as any);
      setCreateOpen(false);
      setNewDeal({ title: '', contact_id: '', value_amount: 0, next_step: '' });
      toast.success(t('zones.deals.created', 'Deal created'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Keep selectedDeal in sync with latest data
  const currentSelectedDeal = useMemo(() => {
    if (!selectedDeal) return null;
    return deals.find((d) => d.id === selectedDeal.id) || selectedDeal;
  }, [selectedDeal, deals]);

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('zones.deals.title', 'Deals Pipeline')}</h1>
        <div className="flex gap-2">
          <Button
            variant={filterOverdue ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterOverdue(!filterOverdue)}
          >
            <Filter className="h-4 w-4 mr-1" />
            {t('zones.deals.overdue', 'Overdue')}
          </Button>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t('zones.deals.newDeal', 'New Deal')}
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="outline" className="text-sm py-1 px-3">
          {deals.filter((d) => d.status === 'open').length} {t('zones.deals.open', 'open')}
        </Badge>
        <Badge variant="outline" className="text-sm py-1 px-3 border-green-500/30 text-green-600">
          {deals.filter((d) => d.status === 'won').length} {t('zones.deals.won', 'won')}
        </Badge>
        <Badge variant="outline" className="text-sm py-1 px-3 border-red-500/30 text-red-600">
          {deals.filter((d) => d.status === 'lost').length} {t('zones.deals.lost', 'lost')}
        </Badge>
        <Badge variant="outline" className="text-sm py-1 px-3 text-primary">
          {deals
            .filter((d) => d.status === 'open')
            .reduce((sum, d) => sum + (d.value_amount || 0), 0)
            .toLocaleString()}{' '}
          KZT
        </Badge>
      </div>

      {/* Kanban Board with DnD */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
          {stages.map((stage) => (
            <DealKanbanColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage.get(stage.id) || []}
              onDealClick={setSelectedDeal}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDragDeal && <DealCard deal={activeDragDeal} onClick={() => { }} />}
        </DragOverlay>
      </DndContext>

      {/* Create Deal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.deals.newDeal', 'New Deal')}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('zones.deals.newDealDescription', 'Fill in the information to create a new deal in the pipeline')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('zones.deals.dealTitle', 'Title')}</Label>
              <Input value={newDeal.title} onChange={(e) => setNewDeal((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.deals.contact', 'Contact')}</Label>
              <Select value={newDeal.contact_id} onValueChange={(v) => setNewDeal((p) => ({ ...p, contact_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('zones.deals.selectContact', 'Select contact')} />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('zones.deals.value', 'Value (KZT)')}</Label>
              <Input
                type="number"
                value={newDeal.value_amount}
                onChange={(e) => setNewDeal((p) => ({ ...p, value_amount: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.deals.nextStep', 'Next step')}</Label>
              <Input
                value={newDeal.next_step}
                onChange={(e) => setNewDeal((p) => ({ ...p, next_step: e.target.value }))}
                placeholder={t('zones.deals.nextStepPlaceholder', 'Call back tomorrow')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleCreate} disabled={!newDeal.title.trim()}>
              {t('common.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Detail Sheet */}
      <DealDetailSheet
        deal={currentSelectedDeal}
        stages={stages}
        open={!!selectedDeal}
        onOpenChange={(open) => !open && setSelectedDeal(null)}
        onMoveDealToStage={moveDealToStage}
        onUpdateDeal={updateDeal}
        onAddActivity={addActivity}
      />
    </div>
  );
});

export default ZoneDealsScreen;
