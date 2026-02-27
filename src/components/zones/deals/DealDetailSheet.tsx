/**
 * DealDetailSheet - Side panel with full deal info + activity timeline
 */
import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Plus from 'lucide-react/dist/esm/icons/plus';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import type { ZoneDeal, ZoneDealStage, ZoneDealActivity } from '@/types/zones';

interface DealDetailSheetProps {
  deal: ZoneDeal | null;
  stages: ZoneDealStage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoveDealToStage: (dealId: string, stageId: string) => Promise<void>;
  onUpdateDeal: (dealId: string, updates: Partial<ZoneDeal>) => Promise<void>;
  onAddActivity: (dealId: string, type: string, summary: string) => Promise<void>;
}

export const DealDetailSheet = memo(function DealDetailSheet({
  deal,
  stages,
  open,
  onOpenChange,
  onMoveDealToStage,
  onUpdateDeal,
  onAddActivity,
}: DealDetailSheetProps) {
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ZoneDealActivity[]>([]);
  const [newActivity, setNewActivity] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [showLostDialog, setShowLostDialog] = useState(false);

  const fetchActivities = useCallback(async () => {
    if (!deal) return;
    const { data } = await supabase
      .from('zone_deal_activities')
      .select('*')
      .eq('deal_id', deal.id)
      .order('happened_at', { ascending: false }) as any;
    setActivities((data as ZoneDealActivity[]) || []);
  }, [deal?.id]);

  useEffect(() => {
    if (open && deal) fetchActivities();
  }, [open, deal?.id, fetchActivities]);

  if (!deal) return null;

  const isOverdue = deal.next_step_at && new Date(deal.next_step_at) < new Date();
  const currentStageIdx = stages.findIndex((s) => s.id === deal.stage_id);
  const canMoveNext = currentStageIdx >= 0 && currentStageIdx < stages.length - 1;

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    await onAddActivity(deal.id, 'note', newActivity.trim());
    setNewActivity('');
    await fetchActivities();
  };

  const handleWon = async () => {
    await onUpdateDeal(deal.id, { status: 'won' } as any);
    await onAddActivity(deal.id, 'status_change', 'Deal marked as Won');
    onOpenChange(false);
    toast.success(t('zones.deals.markedWon', 'Deal marked as won!'));
  };

  const handleLost = async () => {
    await onUpdateDeal(deal.id, { status: 'lost', lost_reason: lostReason || null } as any);
    await onAddActivity(deal.id, 'status_change', `Deal lost: ${lostReason || 'No reason'}`);
    setShowLostDialog(false);
    setLostReason('');
    onOpenChange(false);
    toast.info(t('zones.deals.markedLost', 'Deal marked as lost'));
  };

  const handleMoveNext = async () => {
    if (!canMoveNext) return;
    const nextStage = stages[currentStageIdx + 1];
    await onMoveDealToStage(deal.id, nextStage.id);
    await onAddActivity(deal.id, 'stage_change', `Moved to ${nextStage.name}`);
    await fetchActivities();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-3 w-3" />;
      case 'email': return <Mail className="h-3 w-3" />;
      case 'note': return <MessageSquare className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {deal.title}
            {deal.status !== 'open' && (
              <Badge variant={deal.status === 'won' ? 'default' : 'destructive'} className="text-xs">
                {deal.status === 'won' ? '✓ Won' : '✗ Lost'}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          <div className="space-y-4 pr-4">
            {/* Stage */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('zones.deals.stage', 'Stage')}</Label>
              <Select
                value={deal.stage_id || ''}
                onValueChange={async (v) => {
                  await onMoveDealToStage(deal.id, v);
                  const stage = stages.find((s) => s.id === v);
                  if (stage) await onAddActivity(deal.id, 'stage_change', `Moved to ${stage.name}`);
                  await fetchActivities();
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
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
              <p className="font-bold text-lg">{deal.value_amount.toLocaleString()} {deal.currency}</p>
            </div>

            {/* Contact */}
            {deal.contact && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('zones.deals.contact', 'Contact')}</Label>
                <p className="font-medium">{deal.contact.name}</p>
                {deal.contact.phone && <p className="text-sm text-muted-foreground">{deal.contact.phone}</p>}
                {deal.contact.email && <p className="text-sm text-muted-foreground">{deal.contact.email}</p>}
              </div>
            )}

            {/* Next Step */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t('zones.deals.nextStep', 'Next step')}</Label>
              <p className={cn("text-sm", isOverdue && "text-destructive font-medium")}>
                {deal.next_step || '—'}
              </p>
              {deal.next_step_at && (
                <p className={cn("text-xs", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                  {new Date(deal.next_step_at).toLocaleString()}
                </p>
              )}
            </div>

            {/* Status actions */}
            {deal.status === 'open' && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={handleMoveNext} disabled={!canMoveNext}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  {t('zones.deals.moveNext', 'Move next')}
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleWon}>
                  {t('zones.deals.win', 'Won')}
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => setShowLostDialog(true)}>
                  {t('zones.deals.lose', 'Lost')}
                </Button>
              </div>
            )}

            {/* Lost reason dialog */}
            {showLostDialog && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                <Label className="text-sm">{t('zones.deals.lostReason', 'Reason for losing')}</Label>
                <Textarea
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder={t('zones.deals.lostReasonPlaceholder', 'Price too high, competitor won...')}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={handleLost}>
                    {t('zones.deals.confirmLost', 'Confirm Lost')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowLostDialog(false)}>
                    {t('common.cancel', 'Cancel')}
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Activity Timeline */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">{t('zones.deals.activities', 'Activity')}</Label>

              {/* Add activity */}
              <div className="flex gap-2">
                <Input
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder={t('zones.deals.addNote', 'Add a note...')}
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                />
                <Button size="sm" variant="outline" onClick={handleAddActivity} disabled={!newActivity.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                {activities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    {t('zones.deals.noActivities', 'No activities yet')}
                  </p>
                )}
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-2 items-start text-sm">
                    <div className="mt-1 text-muted-foreground">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.happened_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
});
