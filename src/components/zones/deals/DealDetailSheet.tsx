/**
 * DealDetailSheet - Side panel with full deal info + activity timeline + products
 */
import { memo, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import CheckSquare from 'lucide-react/dist/esm/icons/check-square';
import Package from 'lucide-react/dist/esm/icons/package';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Send from 'lucide-react/dist/esm/icons/send';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import type { ZoneDeal, ZoneDealStage } from '@/types/zones';
import { useZoneDealActivities, useZoneDealProducts, useZoneDealComments } from '@/hooks/zones/useZoneDeals';
import { useZoneDealFields } from '@/hooks/zones/useZoneDealFields';
import { useZoneProducts } from '@/hooks/zones/useZoneProducts';
import { useZoneTasks } from '@/hooks/zones/useZoneTasks';
import { useZoneDocuments } from '@/hooks/zones/useZoneDocuments';
import { ZoneDocumentCreator } from '../documents/ZoneDocumentCreator';
import { KaspiQRGenerator } from './KaspiQRGenerator';
import { MentionInput, extractMentions, formatMentionsForDisplay } from '../shared/MentionInput';
import FileSignature from 'lucide-react/dist/esm/icons/file-signature';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Download from 'lucide-react/dist/esm/icons/download';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/hooks/user/useAuth';

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
  const { user } = useAuth();
  const { t } = useTranslation();
  const [newActivity, setNewActivity] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [newProdQty, setNewProdQty] = useState(1);
  const [showKaspiQR, setShowKaspiQR] = useState(false);

  // Custom fields state
  const { fields: dealFields } = useZoneDealFields(deal?.zone_id || null);
  const [customFieldsValues, setCustomFieldsValues] = useState<Record<string, any>>({});

  // React Query Hooks
  const { activities, loading: activitiesLoading } = useZoneDealActivities(deal?.zone_id || null, deal?.id || null);
  const { dealProducts, addProduct, removeProduct } = useZoneDealProducts(deal?.zone_id || null, deal?.id || null);
  const { products } = useZoneProducts(deal?.zone_id || null);
  const { tasks } = useZoneTasks(deal?.zone_id || null);
  const { documents } = useZoneDocuments(deal?.zone_id || null, { dealId: deal?.id });
  const { comments, addComment, deleteComment, loading: commentsLoading } = useZoneDealComments(deal?.zone_id || null, deal?.id || null);

  const [newComment, setNewComment] = useState('');

  const linkedTasks = useMemo(() => tasks.filter(t => t.deal_id === deal?.id), [tasks, deal?.id]);
  const linkedDocs = useMemo(() => documents?.filter(d => d.deal_id === deal?.id) || [], [documents, deal?.id]);
  const dealTotal = useMemo(() => dealProducts.reduce((sum, p) => sum + (p.subtotal || 0), 0), [dealProducts]);

  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  useEffect(() => {
    if (open && deal) {
      setShowLostDialog(false);
      setIsAddingProduct(false);
      setCustomFieldsValues(deal.custom_fields || {});
    }
  }, [open, deal?.id, deal?.custom_fields]);

  if (!deal) return null;

  const isOverdue = deal.next_step_at && new Date(deal.next_step_at) < new Date();
  const currentStageIdx = stages.findIndex((s) => s.id === deal.stage_id);
  const canMoveNext = currentStageIdx >= 0 && currentStageIdx < stages.length - 1;

  const handleAddActivity = async () => {
    if (!newActivity.trim()) return;
    try {
      await onAddActivity(deal.id, 'note', newActivity.trim());
      setNewActivity('');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleWon = async () => {
    try {
      await onUpdateDeal(deal.id, { status: 'won' } as any);
      await onAddActivity(deal.id, 'status_change', 'Deal marked as Won');
      onOpenChange(false);
      toast.success(t('zones.deals.markedWon', 'Deal marked as won!'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLost = async () => {
    try {
      await onUpdateDeal(deal.id, { status: 'lost', lost_reason: lostReason || null } as any);
      await onAddActivity(deal.id, 'status_change', `Deal lost: ${lostReason || 'No reason'}`);
      setShowLostDialog(false);
      setLostReason('');
      onOpenChange(false);
      toast.info(t('zones.deals.markedLost', 'Deal marked as lost'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMoveNext = async () => {
    if (!canMoveNext) return;
    try {
      const nextStage = stages[currentStageIdx + 1];
      await onMoveDealToStage(deal.id, nextStage.id);
      await onAddActivity(deal.id, 'stage_change', `Moved to ${nextStage.name}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddProduct = async () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;
    try {
      await addProduct({
        productId: prod.id,
        quantity: newProdQty,
        unitPrice: prod.unit_price
      });
      // Optionally sync deal value_amount?
      if (dealTotal + (prod.unit_price * newProdQty) !== deal.value_amount) {
        await onUpdateDeal(deal.id, { value_amount: dealTotal + (prod.unit_price * newProdQty) });
      }
      setIsAddingProduct(false);
      setSelectedProductId('');
      setNewProdQty(1);
    } catch (err: any) {
      toast.error(err.message);
    }
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
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <span className="truncate">{deal.title}</span>
            {deal.status !== 'open' && (
              <Badge variant={deal.status === 'won' ? 'default' : 'destructive'} className="text-xs">
                {deal.status === 'won' ? `✓ ${t('zones.deals.win', 'Won')}` : `✗ ${t('zones.deals.lose', 'Lost')}`}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="timeline" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="timeline" className="text-xs min-h-11">{t('zones.deals.activities', 'Activity')}</TabsTrigger>
              <TabsTrigger value="comments" className="text-xs min-h-11">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                {comments.length > 0 && <span className="ml-1">({comments.length})</span>}
              </TabsTrigger>
              <TabsTrigger value="products" className="text-xs min-h-11">{t('zones.invoices.items', 'Products')} ({dealProducts.length})</TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs min-h-11">{t('zones.tasks.title', 'Tasks')} ({linkedTasks.length})</TabsTrigger>
              <TabsTrigger value="docs" className="text-xs min-h-11">Документы ({linkedDocs.length})</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6">
            <div className="py-4 space-y-4">
              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4 m-0">
                <div className="flex gap-2">
                  <Input
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    placeholder={t('zones.deals.addNote', 'Add a note...')}
                    className="text-sm h-9"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                  />
                  <Button size="icon" variant="ghost" onClick={handleAddActivity} disabled={!newActivity.trim() || activitiesLoading}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-[11px] before:w-[2px] before:bg-muted">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-8">
                      <div className="absolute left-0 top-1 w-[24px] h-[24px] rounded-full bg-background border flex items-center justify-center z-10 text-muted-foreground">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium leading-tight">{activity.summary}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.happened_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">{t('zones.deals.noActivities', 'No activities yet')}</p>
                  )}
                </div>
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="space-y-4 m-0">
                <div className="flex gap-2">
                  <MentionInput
                    zoneId={deal.zone_id}
                    value={newComment}
                    onChange={setNewComment}
                    onSubmit={async (text, mentionedIds) => {
                      await addComment(text, mentionedIds);
                      setNewComment('');
                    }}
                    placeholder={t('zones.deals.addComment', 'Write a comment... (use @ to mention)')}
                    disabled={commentsLoading}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (newComment.trim()) {
                        const mentionedIds = extractMentions(newComment);
                        const displayText = formatMentionsForDisplay(newComment);
                        await addComment(displayText.trim(), mentionedIds);
                        setNewComment('');
                      }
                    }}
                    disabled={!newComment.trim() || commentsLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {comments.map((comment: any) => {
                    const displayName = comment.user?.raw_user_meta_data?.display_name || comment.user?.email?.split('@')[0] || 'User';
                    return (
                      <div key={comment.id} className="p-3 rounded-lg bg-muted/30 border border-muted group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{displayName.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-xs font-medium">{displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm pl-8">{comment.content}</p>
                      </div>
                    );
                  })}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">
                      {t('zones.deals.noComments', 'No comments yet')}
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-4 m-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-muted-foreground">{t('zones.invoices.total', 'Total')}:</span>
                  <span className="font-bold text-lg">{dealTotal.toLocaleString()} {deal.currency}</span>
                </div>

                <div className="space-y-2">
                  {dealProducts.map(dp => (
                    <div key={dp.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-muted group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{dp.zone_products?.name || 'Product'}</p>
                        <p className="text-xs text-muted-foreground">
                          {dp.quantity} x {dp.unit_price?.toLocaleString()} {deal.currency}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">{dp.subtotal?.toLocaleString()}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => removeProduct(dp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {isAddingProduct ? (
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('zones.deals.selectProduct', 'Select Product')}</Label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t('zones.deals.selectPlaceholder', 'Select...')} /></SelectTrigger>
                        <SelectContent>
                          {products.filter(p => p.is_active).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit_price.toLocaleString()})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">{t('zones.deals.qty', 'Qty')}</Label>
                        <Input type="number" value={newProdQty} onChange={e => setNewProdQty(Number(e.target.value))} className="h-8" />
                      </div>
                      <div className="flex items-end gap-1">
                        <Button size="sm" className="h-8" onClick={handleAddProduct} disabled={!selectedProductId}>{t('zones.deals.add', 'Add')}</Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setIsAddingProduct(false)}>{t('zones.deals.cancel', 'Cancel')}</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setIsAddingProduct(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('zones.deals.addProduct', 'Add product')}
                  </Button>
                )}
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-3 m-0">
                {linkedTasks.map(task => (
                  <Card key={task.id} className="overflow-hidden bg-muted/20 border-muted">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckSquare className={cn("h-4 w-4 shrink-0", task.status === 'done' ? "text-green-600" : "text-muted-foreground")} />
                          <span className="text-sm font-medium truncate">{task.title}</span>
                        </div>
                        <Badge variant={task.status === 'done' ? 'default' : 'outline'} className="text-xs">
                          {task.status}
                        </Badge>
                      </div>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {t('zones.tasks.due', 'Due:')} {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {linkedTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8 italic">{t('zones.deals.noTasks', 'No tasks linked')}</p>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="docs" className="space-y-3 m-0">
                <Button variant="outline" size="sm" className="w-full border-dashed mb-2" onClick={() => setIsCreatorOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Создать документ
                </Button>

                {linkedDocs.map(doc => (
                  <Card key={doc.id} className="overflow-hidden bg-muted/20 border-muted">
                    <CardContent className="p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSignature className="h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <span className="text-sm font-medium truncate block">{doc.title}</span>
                            <span className="text-xs text-muted-foreground block">
                              {format(new Date(doc.created_at), 'd MMM yyyy', { locale: ru })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs bg-primary/10 mr-1">
                            {doc.status}
                          </Badge>
                          {doc.file_url && (
                            <Button size="icon" variant="ghost" className="h-6 w-6">
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {linkedDocs.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8 italic">Нет созданных документов</p>
                )}
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-6 m-0">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('zones.deals.stage', 'Stage')}</Label>
                    <Select
                      value={deal.stage_id || ''}
                      onValueChange={async (v) => {
                        await onMoveDealToStage(deal.id, v);
                        const stage = stages.find((s) => s.id === v);
                        if (stage) await onAddActivity(deal.id, 'stage_change', `Moved to ${stage.name}`);
                      }}
                    >
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2 items-start text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground leading-none">{t('zones.deals.value', 'Value')}</p>
                        <p className="font-bold">{deal.value_amount.toLocaleString()} {deal.currency}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground leading-none">{t('zones.deals.nextStep', 'Next step')}</p>
                        <p className={cn("font-medium", isOverdue && "text-destructive")}>{deal.next_step || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {dealFields.length > 0 && (
                    <div className="pt-2 border-t mt-4 space-y-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('zones.deals.customFieldsBlock', 'Дополнительные поля')}</p>
                      {dealFields.map(field => (
                        <div key={field.id} className="space-y-1.5">
                          <Label className="flex items-center gap-1 text-xs">
                            {field.name}
                          </Label>

                          {field.type === 'text' && (
                            <Input
                              className="h-8 text-sm bg-muted/30"
                              value={customFieldsValues[field.name] || ''}
                              onChange={e => setCustomFieldsValues(p => ({ ...p, [field.name]: e.target.value }))}
                              onBlur={() => onUpdateDeal(deal.id, { custom_fields: customFieldsValues })}
                            />
                          )}

                          {field.type === 'number' && (
                            <Input
                              type="number"
                              className="h-8 text-sm bg-muted/30"
                              value={customFieldsValues[field.name] || ''}
                              onChange={e => setCustomFieldsValues(p => ({ ...p, [field.name]: Number(e.target.value) }))}
                              onBlur={() => onUpdateDeal(deal.id, { custom_fields: customFieldsValues })}
                            />
                          )}

                          {field.type === 'date' && (
                            <Input
                              type="date"
                              className="h-8 text-sm bg-muted/30"
                              value={customFieldsValues[field.name] || ''}
                              onChange={e => setCustomFieldsValues(p => ({ ...p, [field.name]: e.target.value }))}
                              onBlur={() => onUpdateDeal(deal.id, { custom_fields: customFieldsValues })}
                            />
                          )}

                          {field.type === 'boolean' && (
                            <div className="flex items-center space-x-2 h-8">
                              <Checkbox
                                checked={!!customFieldsValues[field.name]}
                                onCheckedChange={async (c) => {
                                  const newVal = { ...customFieldsValues, [field.name]: !!c };
                                  setCustomFieldsValues(newVal);
                                  await onUpdateDeal(deal.id, { custom_fields: newVal });
                                }}
                              />
                              <span className="text-xs">{t('common.yes', 'Да')}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {deal.contact && (
                    <Card className="bg-primary/5 border-primary/10">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {deal.contact.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-none">{deal.contact.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{t('zones.deals.linkedContact', 'Linked Contact')}</p>
                          </div>
                        </div>
                        <div className="pt-2 flex flex-col gap-2">
                          <div className="flex gap-2">
                            {deal.contact.phone && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 gap-1.5 text-xs"
                                onClick={() => window.open(`tel:${deal.contact.phone}`, '_self')}
                              >
                                <Phone className="h-3 w-3" />
                                {t('zones.contacts.call', 'Call')}
                              </Button>
                            )}
                            {deal.contact.email && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 gap-1.5 text-xs"
                                onClick={() => window.open(`mailto:${deal.contact.email}`, '_blank')}
                              >
                                <Mail className="h-3 w-3" />
                                {t('zones.contacts.sendEmail', 'Email')}
                              </Button>
                            )}
                          </div>
                          {deal.contact.telegram_username && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-8 gap-1.5 text-xs text-blue-500 border-blue-500/20 hover:bg-blue-500/10 dark:bg-blue-500/5"
                              onClick={() => window.open(`https://t.me/${deal.contact.telegram_username}`, '_blank')}
                            >
                              <Send className="h-3 w-3" />
                              Telegram (@{deal.contact.telegram_username})
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {deal.status === 'open' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">{t('common.actions', 'Status Actions')}</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 text-xs" onClick={handleMoveNext} disabled={!canMoveNext}>
                        <ArrowRight className="h-4 w-4 mr-1" />
                        {t('zones.deals.moveNext', 'Move next')}
                      </Button>
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={handleWon}>
                        {t('zones.deals.win', 'Won')}
                      </Button>
                      <Button variant="destructive" className="flex-1 text-xs" onClick={() => setShowLostDialog(true)}>
                        {t('zones.deals.lose', 'Lost')}
                      </Button>
                    </div>

                    {/* Kaspi QR Button */}
                    <Button
                      variant="outline"
                      className="w-full mt-2 h-10 text-sm border-[#F14635]/30 text-[#F14635] hover:bg-[#F14635]/10"
                      onClick={() => setShowKaspiQR(true)}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      {t('kaspi.generateQR', 'Kaspi QR Payment')}
                    </Button>
                  </div>
                )}

                {showLostDialog && (
                  <div className="space-y-2 p-3 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
                    <Label className="text-xs">{t('zones.deals.lostReason', 'Reason for losing')}</Label>
                    <Textarea
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      placeholder={t('zones.deals.lostReasonPlaceholder', 'Price...')}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={handleLost}>{t('zones.deals.confirmLost', 'Confirm Lost')}</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowLostDialog(false)}>{t('common.cancel', 'Cancel')}</Button>
                    </div>
                  </div>
                )}

                {deal.lost_reason && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-xs text-destructive font-bold uppercase mb-1">{t('zones.deals.lostReason', 'Lost Reason')}</p>
                    <p className="text-sm">{deal.lost_reason}</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
        <ZoneDocumentCreator
          open={isCreatorOpen}
          onOpenChange={setIsCreatorOpen}
          defaultDealId={deal?.id}
          defaultContactId={deal?.contact_id || undefined}
        />
        <KaspiQRGenerator
          open={showKaspiQR}
          onOpenChange={setShowKaspiQR}
          defaultAmount={deal?.value_amount || dealTotal || 0}
          dealTitle={deal?.title || ''}
          currency={deal?.currency || 'KZT'}
          ownerId={user?.id || ''}
        />
      </SheetContent>
    </Sheet>
  );
});

