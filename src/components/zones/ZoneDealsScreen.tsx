/**
 * ZoneDealsScreen - Kanban pipeline for zone deals
 */
import { memo, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import Plus from 'lucide-react/dist/esm/icons/plus';
import User from 'lucide-react/dist/esm/icons/user';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import type { ZoneDeal, ZoneDealStage } from '@/types/zones';

interface ZoneDealsScreenProps {
  zoneId: string;
}

export const ZoneDealsScreen = memo(function ZoneDealsScreen({ zoneId }: ZoneDealsScreenProps) {
  const { t } = useTranslation();
  const { deals, stages, loading, createDeal, updateDeal, moveDealToStage } = useZoneDeals(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<ZoneDeal | null>(null);
  const [newDeal, setNewDeal] = useState({ title: '', contact_id: '', value_amount: 0, next_step: '' });

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const map = new Map<string, ZoneDeal[]>();
    stages.forEach(s => map.set(s.id, []));
    deals.filter(d => d.status === 'open').forEach(d => {
      if (d.stage_id && map.has(d.stage_id)) {
        map.get(d.stage_id)!.push(d);
      } else if (stages.length > 0) {
        // No stage - put in first
        const first = stages[0];
        if (!map.has(first.id)) map.set(first.id, []);
        map.get(first.id)!.push(d);
      }
    });
    return map;
  }, [deals, stages]);

  const handleCreate = async () => {
    if (!newDeal.title.trim()) return;
    try {
      const defaultStage = stages.find(s => s.is_default) || stages[0];
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

  const handleMoveNext = async (deal: ZoneDeal) => {
    const currentIdx = stages.findIndex(s => s.id === deal.stage_id);
    if (currentIdx < stages.length - 1) {
      await moveDealToStage(deal.id, stages[currentIdx + 1].id);
    }
  };

  const isOverdue = (deal: ZoneDeal) => {
    if (!deal.next_step_at) return false;
    return new Date(deal.next_step_at) < new Date();
  };

  if (loading) {
    return <div className="p-6 animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /><div className="h-64 bg-muted rounded-xl" /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('zones.deals.title', 'Deals Pipeline')}</h1>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t('zones.deals.newDeal', 'New Deal')}
        </Button>
      </div>

      {/* Summary stats */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="outline" className="text-sm py-1 px-3">
          {deals.filter(d => d.status === 'open').length} {t('zones.deals.open', 'open')}
        </Badge>
        <Badge variant="outline" className="text-sm py-1 px-3 border-green-500/30 text-green-600">
          {deals.filter(d => d.status === 'won').length} {t('zones.deals.won', 'won')}
        </Badge>
        <Badge variant="outline" className="text-sm py-1 px-3 border-red-500/30 text-red-600">
          {deals.filter(d => d.status === 'lost').length} {t('zones.deals.lost', 'lost')}
        </Badge>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
        {stages.map(stage => {
          const stageDeals = dealsByStage.get(stage.id) || [];
          return (
            <div key={stage.id} className="flex-shrink-0 w-72">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="font-semibold text-sm">{stage.name}</span>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{stageDeals.length}</Badge>
              </div>
              <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-xl p-2">
                {stageDeals.map(deal => (
                  <Card
                    key={deal.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-shadow",
                      isOverdue(deal) && "border-destructive/50"
                    )}
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm leading-tight">{deal.title}</span>
                        {isOverdue(deal) && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                      </div>
                      {deal.value_amount > 0 && (
                        <div className="text-sm font-bold text-primary">
                          {deal.value_amount.toLocaleString()} {deal.currency}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {deal.contact && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {deal.contact.name}
                          </span>
                        )}
                        {deal.next_step_at && (
                          <span className={cn("flex items-center gap-1", isOverdue(deal) && "text-destructive")}>
                            <Calendar className="h-3 w-3" />
                            {new Date(deal.next_step_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {deal.next_step && (
                        <p className="text-xs text-muted-foreground truncate">→ {deal.next_step}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Deal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.deals.newDeal', 'New Deal')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('zones.deals.dealTitle', 'Title')}</Label>
              <Input value={newDeal.title} onChange={e => setNewDeal(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.deals.contact', 'Contact')}</Label>
              <Select value={newDeal.contact_id} onValueChange={v => setNewDeal(p => ({ ...p, contact_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t('zones.deals.selectContact', 'Select contact')} /></SelectTrigger>
                <SelectContent>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('zones.deals.value', 'Value (KZT)')}</Label>
              <Input type="number" value={newDeal.value_amount} onChange={e => setNewDeal(p => ({ ...p, value_amount: Number(e.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>{t('zones.deals.nextStep', 'Next step')}</Label>
              <Input value={newDeal.next_step} onChange={e => setNewDeal(p => ({ ...p, next_step: e.target.value }))} placeholder={t('zones.deals.nextStepPlaceholder', 'Call back tomorrow')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleCreate} disabled={!newDeal.title.trim()}>{t('common.create', 'Create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Detail Sheet */}
      <Sheet open={!!selectedDeal} onOpenChange={open => !open && setSelectedDeal(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedDeal && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedDeal.title}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                <div className="space-y-4 pr-4">
                  {/* Stage */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('zones.deals.stage', 'Stage')}</Label>
                    <Select
                      value={selectedDeal.stage_id || ''}
                      onValueChange={async v => {
                        await moveDealToStage(selectedDeal.id, v);
                        setSelectedDeal(prev => prev ? { ...prev, stage_id: v } : null);
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {stages.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                              {s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('zones.deals.value', 'Value')}</Label>
                    <p className="font-bold text-lg">{selectedDeal.value_amount.toLocaleString()} {selectedDeal.currency}</p>
                  </div>

                  {/* Contact */}
                  {selectedDeal.contact && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('zones.deals.contact', 'Contact')}</Label>
                      <p className="font-medium">{selectedDeal.contact.name}</p>
                      {selectedDeal.contact.phone && <p className="text-sm text-muted-foreground">{selectedDeal.contact.phone}</p>}
                    </div>
                  )}

                  {/* Next Step */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('zones.deals.nextStep', 'Next step')}</Label>
                    <p className={cn("text-sm", isOverdue(selectedDeal) && "text-destructive font-medium")}>
                      {selectedDeal.next_step || '—'}
                    </p>
                    {selectedDeal.next_step_at && (
                      <p className={cn("text-xs", isOverdue(selectedDeal) ? "text-destructive" : "text-muted-foreground")}>
                        {new Date(selectedDeal.next_step_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Status actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleMoveNext(selectedDeal)}
                      disabled={stages.findIndex(s => s.id === selectedDeal.stage_id) >= stages.length - 1}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      {t('zones.deals.moveNext', 'Move next')}
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        await updateDeal(selectedDeal.id, { status: 'won' } as any);
                        setSelectedDeal(null);
                        toast.success(t('zones.deals.markedWon', 'Deal marked as won!'));
                      }}
                    >
                      {t('zones.deals.win', 'Won')}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        await updateDeal(selectedDeal.id, { status: 'lost' } as any);
                        setSelectedDeal(null);
                      }}
                    >
                      {t('zones.deals.lose', 'Lost')}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
});

export default ZoneDealsScreen;
