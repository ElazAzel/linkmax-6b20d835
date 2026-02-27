/**
 * ContactDetailSheet - Side panel with contact info + linked deals, tasks, conversations
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Save from 'lucide-react/dist/esm/icons/save';
import X from 'lucide-react/dist/esm/icons/x';
import { toast } from 'sonner';
import type { ZoneContact, ZoneDeal } from '@/types/zones';
import type { ZoneTask } from '@/hooks/zones/useZoneTasks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ContactDetailSheetProps {
  contact: ZoneContact | null;
  zoneId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateContact: (id: string, updates: Partial<ZoneContact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
}

export const ContactDetailSheet = memo(function ContactDetailSheet({
  contact,
  zoneId,
  open,
  onOpenChange,
  onUpdateContact,
  onDeleteContact,
}: ContactDetailSheetProps) {
  const { t } = useTranslation();
  const [linkedDeals, setLinkedDeals] = useState<ZoneDeal[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<ZoneTask[]>([]);
  const [conversationCount, setConversationCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', email: '', telegram_username: '', tags: '' });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLinkedData = useCallback(async () => {
    if (!contact) return;
    setLoading(true);
    try {
      const [dealsRes, tasksRes, convoRes] = await Promise.all([
        supabase
          .from('zone_deals')
          .select('*, zone_deal_stages(*)')
          .eq('zone_id', zoneId)
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('zone_tasks')
          .select('*')
          .eq('zone_id', zoneId)
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('zone_conversations')
          .select('id', { count: 'exact', head: true })
          .eq('zone_id', zoneId)
          .eq('contact_id', contact.id),
      ]);
      setLinkedDeals((dealsRes.data || []).map((d: any) => ({ ...d, stage: d.zone_deal_stages || undefined })) as ZoneDeal[]);
      setLinkedTasks((tasksRes.data || []) as ZoneTask[]);
      setConversationCount(convoRes.count || 0);
    } finally {
      setLoading(false);
    }
  }, [contact?.id, zoneId]);

  useEffect(() => {
    if (open && contact) {
      fetchLinkedData();
      setEditing(false);
    }
  }, [open, contact?.id, fetchLinkedData]);

  const startEdit = () => {
    if (!contact) return;
    setEditData({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      telegram_username: contact.telegram_username || '',
      tags: (contact.tags || []).join(', '),
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!contact || !editData.name.trim()) return;
    try {
      await onUpdateContact(contact.id, {
        name: editData.name,
        phone: editData.phone || null,
        email: editData.email || null,
        telegram_username: editData.telegram_username || null,
        tags: editData.tags.split(',').map(t => t.trim()).filter(Boolean),
      } as any);
      setEditing(false);
      toast.success(t('zones.contacts.updated', 'Contact updated'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    try {
      await onDeleteContact(contact.id);
      setDeleteOpen(false);
      onOpenChange(false);
      toast.success(t('zones.contacts.deleted', 'Contact deleted'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (!contact) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'won': return <Badge className="bg-green-600 text-white text-[10px]">Won</Badge>;
      case 'lost': return <Badge variant="destructive" className="text-[10px]">Lost</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">Open</Badge>;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                {contact.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <Input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} className="h-8" />
                ) : (
                  <span className="truncate">{contact.name}</span>
                )}
              </div>
              <div className="flex gap-1">
                {editing ? (
                  <>
                    <Button size="icon" variant="ghost" onClick={handleSave}><Save className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" onClick={startEdit}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-120px)] mt-4">
            <div className="space-y-4 pr-4">
              {/* Contact Info */}
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('zones.contacts.phone', 'Phone')}</Label>
                    <Input value={editData.phone} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('zones.contacts.email', 'Email')}</Label>
                    <Input value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} type="email" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telegram</Label>
                    <Input value={editData.telegram_username} onChange={e => setEditData(p => ({ ...p, telegram_username: e.target.value }))} placeholder="@username" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('zones.contacts.tags', 'Tags')} ({t('zones.contacts.commaSeparated', 'comma-separated')})</Label>
                    <Input value={editData.tags} onChange={e => setEditData(p => ({ ...p, tags: e.target.value }))} placeholder="VIP, partner" />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.telegram_username && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span>@{contact.telegram_username}</span>
                    </div>
                  )}
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap pt-1">
                      {contact.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  {!contact.phone && !contact.email && !contact.telegram_username && (
                    <p className="text-sm text-muted-foreground">{t('zones.contacts.noInfo', 'No contact info')}</p>
                  )}
                </div>
              )}

              <Separator />

              {/* Linked Data Tabs */}
              <Tabs defaultValue="deals" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="deals" className="text-xs">
                    {t('zones.deals.title', 'Deals')} ({linkedDeals.length})
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="text-xs">
                    {t('zones.tasks.title', 'Tasks')} ({linkedTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="inbox" className="text-xs">
                    {t('zones.inbox.title', 'Inbox')} ({conversationCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="deals" className="space-y-2 mt-2">
                  {linkedDeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('zones.contacts.noDeals', 'No deals linked')}</p>
                  ) : linkedDeals.map(deal => (
                    <Card key={deal.id} className="overflow-hidden">
                      <CardContent className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{deal.title}</span>
                          {getStatusBadge(deal.status)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {deal.stage && (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: deal.stage.color }} />
                              {deal.stage.name}
                            </span>
                          )}
                          <span>{deal.value_amount?.toLocaleString()} {deal.currency}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-2 mt-2">
                  {linkedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('zones.contacts.noTasks', 'No tasks linked')}</p>
                  ) : linkedTasks.map(task => (
                    <Card key={task.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{task.title}</span>
                          <Badge variant={task.status === 'done' ? 'default' : 'outline'} className="text-[10px]">
                            {task.status}
                          </Badge>
                        </div>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="inbox" className="mt-2">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {conversationCount > 0
                      ? t('zones.contacts.conversationsCount', '{{count}} conversations', { count: conversationCount })
                      : t('zones.contacts.noConversations', 'No conversations yet')}
                  </p>
                </TabsContent>
              </Tabs>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{linkedDeals.filter(d => d.status === 'won').length}</p>
                  <p className="text-[10px] text-muted-foreground">{t('zones.deals.won', 'Won')}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">
                    {linkedDeals.filter(d => d.status === 'open').reduce((s, d) => s + (d.value_amount || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">KZT {t('zones.contacts.pipeline', 'Pipeline')}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-lg font-bold">{linkedTasks.filter(t => t.status !== 'done').length}</p>
                  <p className="text-[10px] text-muted-foreground">{t('zones.contacts.openTasks', 'Open tasks')}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.contacts.confirmDelete', 'Delete contact?')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('zones.contacts.deleteWarning', 'This will permanently delete {{name}}. Linked deals and tasks won\'t be deleted.', { name: contact.name })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.delete', 'Delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
