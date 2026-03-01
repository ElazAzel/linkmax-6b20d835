/**
 * ZoneDealsScreen - Kanban pipeline for zone deals with DnD
 */
import { memo, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneContext } from '@/contexts/ZoneContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
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
  const { members } = useZoneContext();
  const { deals, stages, loading, createDeal, updateDeal, moveDealToStage, addActivity } = useZoneDeals(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<ZoneDeal | null>(null);
  const [activeDragDeal, setActiveDragDeal] = useState<ZoneDeal | null>(null);
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterValueMin, setFilterValueMin] = useState<string>('');
  const [filterValueMax, setFilterValueMax] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({ title: '', contact_id: '', value_amount: 0, next_step: '' });

  /** When user drops deal on last stage, show Won/Lost dialog */
  const [pendingWonLost, setPendingWonLost] = useState<{ deal: ZoneDeal; targetStageId: string } | null>(null);
  const [pendingLostReason, setPendingLostReason] = useState('');
  const [showLostReasonField, setShowLostReasonField] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  // Group deals by stage (with all filters)
  const dealsByStage = useMemo(() => {
    const map = new Map<string, ZoneDeal[]>();
    stages.forEach((s) => map.set(s.id, []));
    const openDeals = deals.filter((d) => {
      if (d.status !== 'open') return false;
      if (filterOverdue && (!d.next_step_at || new Date(d.next_step_at) >= new Date())) return false;
      if (filterAssignee && d.assigned_to !== filterAssignee) return false;
      if (filterDateFrom && d.created_at < filterDateFrom) return false;
      if (filterDateTo && d.created_at > filterDateTo + 'T23:59:59.999Z') return false;
      const val = d.value_amount ?? 0;
      if (filterValueMin !== '' && val < Number(filterValueMin)) return false;
      if (filterValueMax !== '' && val > Number(filterValueMax)) return false;
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
  }, [deals, stages, filterOverdue, filterAssignee, filterDateFrom, filterDateTo, filterValueMin, filterValueMax]);

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

    const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;
    const isLastStage = lastStage && targetStageId === lastStage.id;

    if (isLastStage) {
      setPendingWonLost({ deal, targetStageId });
      return;
    }

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

  const handleConfirmWon = useCallback(async () => {
    if (!pendingWonLost) return;
    const { deal, targetStageId } = pendingWonLost;
    try {
      await moveDealToStage(deal.id, targetStageId);
      await updateDeal(deal.id, { status: 'won' } as Partial<ZoneDeal>);
      await addActivity(deal.id, 'status_change', 'Deal marked as Won');
      toast.success(t('zones.deals.markedWon', 'Deal marked as won!'));
    } catch (err: any) {
      toast.error(err.message);
    }
    setPendingWonLost(null);
  }, [pendingWonLost, moveDealToStage, updateDeal, addActivity, t]);

  const handleConfirmLost = useCallback(async () => {
    if (!pendingWonLost) return;
    const { deal, targetStageId } = pendingWonLost;
    try {
      await moveDealToStage(deal.id, targetStageId);
      await updateDeal(deal.id, { status: 'lost', lost_reason: pendingLostReason.trim() || null } as Partial<ZoneDeal>);
      await addActivity(deal.id, 'status_change', `Deal lost: ${pendingLostReason.trim() || 'No reason'}`);
      toast.info(t('zones.deals.markedLost', 'Deal marked as lost'));
    } catch (err: any) {
      toast.error(err.message);
    }
    setPendingWonLost(null);
    setPendingLostReason('');
    setShowLostReasonField(false);
  }, [pendingWonLost, pendingLostReason, moveDealToStage, updateDeal, addActivity, t]);

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
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                {t('zones.deals.filters', 'Filters')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">{t('zones.deals.assignee', 'Assignee')}</Label>
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('zones.deals.allAssignees', 'All')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('zones.deals.allAssignees', 'All')}</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.display_name || m.email || m.user_id?.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('zones.deals.dateFrom', 'From')}</Label>
                    <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('zones.deals.dateTo', 'To')}</Label>
                    <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('zones.deals.valueMin', 'Min value')}</Label>
                    <Input type="number" placeholder="0" value={filterValueMin} onChange={(e) => setFilterValueMin(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('zones.deals.valueMax', 'Max value')}</Label>
                    <Input type="number" placeholder="—" value={filterValueMax} onChange={(e) => setFilterValueMax(e.target.value)} />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setFilterAssignee(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterValueMin(''); setFilterValueMax(''); setFilterOpen(false); }}>
                  {t('zones.deals.clearFilters', 'Clear filters')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
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

      {/* Won/Lost dialog when dropping deal on last stage */}
      <Dialog open={!!pendingWonLost} onOpenChange={(open) => {
        if (!open) { setPendingWonLost(null); setPendingLostReason(''); setShowLostReasonField(false); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.deals.markAsWonOrLost', 'Mark deal as Won or Lost?')}</DialogTitle>
            <DialogDescription>
              {pendingWonLost?.deal.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmWon}>
                {t('zones.deals.win', 'Won')}
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => setShowLostReasonField(true)}>
                {t('zones.deals.lose', 'Lost')}
              </Button>
            </div>
            {showLostReasonField && (
              <div className="space-y-2">
                <Label>{t('zones.deals.lostReason', 'Reason for losing')}</Label>
                <Textarea
                  value={pendingLostReason}
                  onChange={(e) => setPendingLostReason(e.target.value)}
                  placeholder={t('zones.deals.lostReasonPlaceholder', 'Price too high, competitor won...')}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleConfirmLost}>
                    {t('zones.deals.confirmLost', 'Confirm Lost')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowLostReasonField(false)}>
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingWonLost(null); setPendingLostReason(''); setShowLostReasonField(false); }}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default ZoneDealsScreen;
