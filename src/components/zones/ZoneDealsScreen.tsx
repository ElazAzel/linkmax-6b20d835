/**
 * ZoneDealsScreen - Kanban pipeline for zone deals with DnD
 */
import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { useZoneDeals, useZonePipelineAutoInit } from '@/hooks/zones/useZoneDeals';
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
import { Checkbox } from '@/components/ui/checkbox';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Download from 'lucide-react/dist/esm/icons/download';
import Filter from 'lucide-react/dist/esm/icons/filter';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import { toast } from 'sonner';
import { generateId } from '@/lib/utils/generateId';
import type { ZoneDeal } from '@/types/zones';
import { useZoneDealFields } from '@/hooks/zones/useZoneDealFields';
import { DealKanbanColumn } from './deals/DealKanbanColumn';
import { DealCard } from './deals/DealCard';
import { DealDetailSheet } from './deals/DealDetailSheet';
import { ZonePipelineSettings } from './settings/ZonePipelineSettings';
import { useAppError } from '@/hooks/useAppError';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '@/platform/native/haptics';
import { posthog } from '@/lib/posthog';

interface ZoneDealsScreenProps {
  zoneId: string;
}

interface DealsFilterPreset {
  id: string;
  name: string;
  filters: {
    filterOverdue: boolean;
    filterAssignee: string;
    filterDateFrom: string;
    filterDateTo: string;
    filterValueMin: string;
    filterValueMax: string;
  };
}

export const ZoneDealsScreen = memo(function ZoneDealsScreen({ zoneId }: ZoneDealsScreenProps) {
  const { t } = useTranslation();
  const { handleError } = useAppError();
  const { members } = useZoneContext();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [pipelineMgmtOpen, setPipelineMgmtOpen] = useState(false);
  const { contacts } = useZoneContacts(zoneId);
  const { fields: dealFields } = useZoneDealFields(zoneId);
  // Auto-create default pipeline when zone has none
  useZonePipelineAutoInit(zoneId);
  const [selectedDealIds, setSelectedDealIds] = useState<Set<string>>(new Set());

  const toggleDealSelection = useCallback((id: string, selected: boolean) => {
    setSelectedDealIds(prev => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const { deals, stages, pipelines, loading, createDeal, updateDeal, moveDealToStage, addActivity, createPipeline, updatePipeline, deletePipeline, bulkDeleteDeals, bulkMoveDealsToStage } = useZoneDeals(zoneId, selectedPipelineId);

  // Restore selected pipeline from localStorage
  useEffect(() => {
    if (!selectedPipelineId && pipelines.length > 0) {
      const stored = typeof window !== 'undefined'
        ? window.localStorage.getItem(`lnkmx_pipeline_${zoneId}`)
        : null;
      const def = (stored && pipelines.find(p => p.id === stored))
        || pipelines.find(p => p.is_default)
        || pipelines[0];
      if (def) setSelectedPipelineId(def.id);
    }
  }, [pipelines, selectedPipelineId, zoneId]);

  // Persist selected pipeline to localStorage
  useEffect(() => {
    if (selectedPipelineId && typeof window !== 'undefined') {
      window.localStorage.setItem(`lnkmx_pipeline_${zoneId}`, selectedPipelineId);
    }
  }, [selectedPipelineId, zoneId]);

  const currentStages = useMemo(() => {
    if (!selectedPipelineId) return stages;
    return stages.filter(s => s.pipeline_id === selectedPipelineId);
  }, [stages, selectedPipelineId]);

  const currentDeals = useMemo(() => {
    if (!selectedPipelineId) return deals;
    return deals.filter(d => d.pipeline_id === selectedPipelineId || !d.pipeline_id);
  }, [deals, selectedPipelineId]);
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
  const [newDeal, setNewDeal] = useState({ title: '', contact_id: '', value_amount: 0, next_step: '', custom_fields: {} as Record<string, any> });

  // Saved filter presets (per zone, local to browser)
  const [filterPresets, setFilterPresets] = useState<DealsFilterPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  /** When user drops deal on last stage, show Won/Lost dialog */
  const [pendingWonLost, setPendingWonLost] = useState<{ deal: ZoneDeal; targetStageId: string } | null>(null);
  const [pendingLostReason, setPendingLostReason] = useState('');
  const [showLostReasonField, setShowLostReasonField] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const storageKey = useMemo(
    () => `lnkmx_zone_deals_presets_${zoneId}`,
    [zoneId]
  );

  // Load presets from localStorage
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as DealsFilterPreset[];
        setFilterPresets(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const clearPresetSelection = () => {
    if (selectedPresetId) {
      setSelectedPresetId('');
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (!preset) return;

    setSelectedPresetId(presetId);
    setFilterOverdue(preset.filters.filterOverdue);
    setFilterAssignee(preset.filters.filterAssignee);
    setFilterDateFrom(preset.filters.filterDateFrom);
    setFilterDateTo(preset.filters.filterDateTo);
    setFilterValueMin(preset.filters.filterValueMin);
    setFilterValueMax(preset.filters.filterValueMax);
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) return;

    const newPreset: DealsFilterPreset = {
      id: generateId(),
      name,
      filters: {
        filterOverdue,
        filterAssignee,
        filterDateFrom,
        filterDateTo,
        filterValueMin,
        filterValueMax,
      },
    };

    const updated = [...filterPresets, newPreset];
    setFilterPresets(updated);
    setSelectedPresetId(newPreset.id);
    setPresetDialogOpen(false);

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(updated));
      }
    } catch {
      // ignore storage errors
    }
  };

  // Group deals by stage (with all filters)
  const dealsByStage = useMemo(() => {
    const map = new Map<string, ZoneDeal[]>();
    currentStages.forEach((s) => map.set(s.id, []));
    const openDeals = currentDeals.filter((d) => {
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
      } else if (currentStages.length > 0) {
        const first = currentStages[0];
        if (!map.has(first.id)) map.set(first.id, []);
        map.get(first.id)!.push(d);
      }
    });
    return map;
  }, [currentDeals, currentStages, filterOverdue, filterAssignee, filterDateFrom, filterDateTo, filterValueMin, filterValueMax]);

  const handleDragStart = useCallback(async (event: any) => {
    const deal = event.active.data.current?.deal as ZoneDeal | undefined;
    setActiveDragDeal(deal || null);
    hapticLight();
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const targetStageId = over.id as string;
    const deal = currentDeals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === targetStageId) return;

    const lastStage = currentStages.length > 0 ? currentStages[currentStages.length - 1] : null;
    const isLastStage = lastStage && targetStageId === lastStage.id;

    if (isLastStage) {
      hapticMedium();
      setPendingWonLost({ deal, targetStageId });
      return;
    }

    try {
      hapticSuccess();
      await moveDealToStage(dealId, targetStageId);
      const stage = currentStages.find((s) => s.id === targetStageId);
      if (stage) {
        await addActivity(dealId, 'stage_change', `Moved to ${stage.name}`);
      }
    } catch (err: any) {
      hapticError();
      handleError(err);
    }
  }, [currentDeals, currentStages, moveDealToStage, addActivity]);

  const handleConfirmWon = useCallback(async () => {
    if (!pendingWonLost) return;
    const { deal, targetStageId } = pendingWonLost;
    try {
      await moveDealToStage(deal.id, targetStageId);
      await updateDeal(deal.id, { status: 'won' } as Partial<ZoneDeal>);
      await addActivity(deal.id, 'status_change', 'Deal marked as Won');
      toast.success(t('zones.deals.markedWon', 'Deal marked as won!'));
      
      // Analytics
      posthog.capture('deal_won', {
        deal_id: deal.id,
        value: deal.value_amount,
        zone_id: zoneId
      });
    } catch (err: any) {
      handleError(err);
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
      
      // Analytics
      posthog.capture('deal_lost', {
        deal_id: deal.id,
        reason: pendingLostReason.trim() || 'unspecified',
        zone_id: zoneId
      });
    } catch (err: any) {
      handleError(err);
    }
    setPendingWonLost(null);
    setPendingLostReason('');
    setShowLostReasonField(false);
  }, [pendingWonLost, pendingLostReason, moveDealToStage, updateDeal, addActivity, t]);

  const handleCreate = async () => {
    if (!newDeal.title.trim()) return;

    const firstStageId = selectedPipelineId
      ? stages.find(s => s.pipeline_id === selectedPipelineId)?.id
      : (stages.length > 0 ? stages[0].id : null);

    if (!firstStageId) {
      toast.error(t('zones.deals.noStages', 'No stages available'));
      return;
    }

    try {
      await createDeal({
        title: newDeal.title,
        contact_id: newDeal.contact_id || null,
        value_amount: newDeal.value_amount,
        stage_id: firstStageId,
        next_step: newDeal.next_step || undefined,
        pipeline_id: selectedPipelineId || null,
        custom_fields: newDeal.custom_fields,
      });
      setCreateOpen(false);
      setNewDeal({ title: '', contact_id: '', value_amount: 0, next_step: '', custom_fields: {} });
      toast.success(t('zones.deals.created', 'Deal created'));
    } catch (err: any) {
      handleError(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDealIds.size === 0) return;
    if (!confirm(t('zones.deals.bulkDeleteConfirm', `Удалить выбранные сделки (${selectedDealIds.size})?`))) return;
    
    try {
      await bulkDeleteDeals(Array.from(selectedDealIds));
      setSelectedDealIds(new Set());
      toast.success(t('zones.deals.bulkDeleted', 'Сделки удалены'));
    } catch (err: any) {
      handleError(err);
    }
  };

  const handleBulkMove = async (stageId: string) => {
    if (selectedDealIds.size === 0) return;
    try {
      await bulkMoveDealsToStage(Array.from(selectedDealIds), stageId);
      setSelectedDealIds(new Set());
      toast.success(t('zones.deals.bulkMoved', 'Сделки перемещены'));
    } catch (err: any) {
      handleError(err);
    }
  };

  const currentSelectedDeal = useMemo(() => {
    if (!selectedDeal) return null;
    return currentDeals.find((d) => d.id === selectedDeal.id) || selectedDeal;
  }, [selectedDeal, currentDeals]);

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)]">
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)]">
      <div className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold" data-testid="zone-deals-title">{t('zones.deals.title', 'Deals Pipeline')}</h1>
            {pipelines.length > 0 ? (
              <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder={t('zones.deals.selectPipeline', 'Выберите воронку')} />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">{t('zones.deals.noPipelines', 'Нет воронок')}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setPipelineMgmtOpen(true)}
              title={t('zones.deals.managePipelines', 'Управление воронками')}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" size="sm" onClick={async () => {
              try {
                const { exportDealsToExcel } = await import('@/lib/export/excel-export-zone');
                await exportDealsToExcel({ deals: currentDeals });
                toast.success(t('zones.deals.exportSuccess', 'Deals exported successfully'));
              } catch (err: any) {
                handleError(err, 'Export failed');
              }
            }}>
              <Download className="h-4 w-4 mr-1" />
              {t('zones.deals.export', 'Export')}
            </Button>
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
                  <Select
                    value={filterAssignee || '__all__'}
                    onValueChange={(v: string) => {
                      clearPresetSelection();
                      setFilterAssignee(v === '__all__' ? '' : v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('zones.deals.allAssignees', 'All')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">{t('zones.deals.allAssignees', 'All')}</SelectItem>
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
                      <Input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => {
                          clearPresetSelection();
                          setFilterDateFrom(e.target.value);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('zones.deals.dateTo', 'To')}</Label>
                      <Input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => {
                          clearPresetSelection();
                          setFilterDateTo(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('zones.deals.valueMin', 'Min value')}</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={filterValueMin}
                        onChange={(e) => {
                          clearPresetSelection();
                          setFilterValueMin(e.target.value);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t('zones.deals.valueMax', 'Max value')}</Label>
                      <Input
                        type="number"
                        placeholder="—"
                        value={filterValueMax}
                        onChange={(e) => {
                          clearPresetSelection();
                          setFilterValueMax(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterAssignee('');
                      setFilterDateFrom('');
                      setFilterDateTo('');
                      setFilterValueMin('');
                      setFilterValueMax('');
                      setFilterOverdue(false);
                      setSelectedPresetId('');
                      setFilterOpen(false);
                    }}
                  >
                    {t('zones.deals.clearFilters', 'Clear filters')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant={filterOverdue ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                clearPresetSelection();
                setFilterOverdue(!filterOverdue);
              }}
            >
              <Filter className="h-4 w-4 mr-1" />
              {t('zones.deals.overdue', 'Overdue')}
            </Button>
            <Select
              value={selectedPresetId || '__none__'}
              onValueChange={(v: string) => {
                if (v === '__none__') {
                  setSelectedPresetId('');
                  return;
                }
                if (v === '__save__') {
                  setPresetName('');
                  setPresetDialogOpen(true);
                  return;
                }
                handleApplyPreset(v);
              }}
            >
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue placeholder={t('zones.deals.presets.placeholder', 'Фильтры')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  {t('zones.deals.presets.none', 'Без пресета')}
                </SelectItem>
                {filterPresets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
                <SelectItem value="__save__">
                  {t('zones.deals.presets.saveCurrent', 'Сохранить текущие')}
                </SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('zones.deals.newDeal', 'New Deal')}
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {currentDeals.filter((d) => d.status === 'open').length} {t('zones.deals.open', 'open')}
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3 border-green-500/30 text-green-600">
            {currentDeals.filter((d) => d.status === 'won').length} {t('zones.deals.won', 'won')}
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3 border-red-500/30 text-red-600">
            {currentDeals.filter((d) => d.status === 'lost').length} {t('zones.deals.lost', 'lost')}
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3 text-primary">
            {currentDeals
              .filter((d) => d.status === 'open')
              .reduce((sum, d) => sum + (d.value_amount || 0), 0)
              .toLocaleString()}{' '}
            KZT
          </Badge>
        </div>
        {currentDeals.filter((d) => d.status === 'open').length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {t('phaseB.whyLnkmx.emptyDeals', 'CRM за 15 минут — без внедрения. Добавьте первую сделку.')}
          </p>
        )}

        {/* Kanban Board with DnD */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[360px] md:min-h-[420px]">
            {currentStages.map((stage) => (
              <DealKanbanColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage.get(stage.id) || []}
                onDealClick={setSelectedDeal}
                selectedDealIds={selectedDealIds}
                onDealSelect={toggleDealSelection}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDragDeal && <DealCard deal={activeDragDeal} onClick={() => { }} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Save filters preset dialog */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.deals.presets.saveTitle', 'Сохранить фильтры')}</DialogTitle>
            <DialogDescription>
              {t('zones.deals.presets.saveDescription', 'Введите название для текущей комбинации фильтров, чтобы быстро применять её позже.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs">
              {t('zones.deals.presets.nameLabel', 'Название пресета')}
            </Label>
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t('zones.deals.presets.namePlaceholder', 'Например: Большие сделки за месяц')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPresetDialogOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Select value={newDeal.contact_id} onValueChange={(v: string) => setNewDeal((p) => ({ ...p, contact_id: v }))}>
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

            {/* Custom Fields */}
            {dealFields.length > 0 && (
              <div className="pt-2 border-t mt-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('zones.deals.customFieldsBlock', 'Дополнительные поля')}</p>
                {dealFields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {field.name} {field.is_required && <span className="text-destructive">*</span>}
                    </Label>

                    {field.type === 'text' && (
                      <Input
                        value={newDeal.custom_fields[field.id] || ''}
                        onChange={e => setNewDeal(p => ({ ...p, custom_fields: { ...p.custom_fields, [field.id]: e.target.value } }))}
                      />
                    )}

                    {field.type === 'number' && (
                      <Input
                        type="number"
                        value={newDeal.custom_fields[field.id] || ''}
                        onChange={e => setNewDeal(p => ({ ...p, custom_fields: { ...p.custom_fields, [field.id]: Number(e.target.value) } }))}
                      />
                    )}

                    {field.type === 'date' && (
                      <Input
                        type="date"
                        value={newDeal.custom_fields[field.id] || ''}
                        onChange={e => setNewDeal(p => ({ ...p, custom_fields: { ...p.custom_fields, [field.id]: e.target.value } }))}
                      />
                    )}

                    {field.type === 'boolean' && (
                      <div className="flex items-center space-x-2 h-10">
                        <Checkbox
                          checked={!!newDeal.custom_fields[field.id]}
                          onCheckedChange={c => setNewDeal(p => ({ ...p, custom_fields: { ...p.custom_fields, [field.id]: !!c } }))}
                        />
                        <span className="text-sm">{t('common.yes', 'Да')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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

      {/* Pipeline Management Dialog */}
      <Dialog open={pipelineMgmtOpen} onOpenChange={setPipelineMgmtOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('zones.settings.pipelines.title', 'Управление воронками')}</DialogTitle>
            <DialogDescription>
              {t('zones.settings.pipelines.description', 'Создавайте и настраивайте воронки продаж для разных направлений бизнеса.')}
            </DialogDescription>
          </DialogHeader>
          <ZonePipelineSettings zoneId={zoneId} />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPipelineMgmtOpen(false)}>
              {t('common.close', 'Закрыть')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Detail Sheet */}
      <DealDetailSheet
        deal={currentSelectedDeal}
        stages={currentStages}
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
      {/* Bulk Actions Bar */}
      {selectedDealIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold">{selectedDealIds.size} {t('zones.deals.selected', 'выбрано')}</span>
            <button 
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors text-left"
              onClick={() => setSelectedDealIds(new Set())}
            >
              {t('common.cancel', 'Отмена')}
            </button>
          </div>
          
          <div className="h-8 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-xl">
                  {t('zones.deals.bulkMove', 'Переместить')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="space-y-1">
                  {currentStages.map(s => (
                    <Button 
                      key={s.id} 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start font-normal"
                      onClick={() => handleBulkMove(s.id)}
                    >
                      {s.name}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              size="sm" 
              variant="destructive" 
              className="rounded-xl"
              onClick={handleBulkDelete}
            >
              {t('common.delete', 'Удалить')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ZoneDealsScreen;
