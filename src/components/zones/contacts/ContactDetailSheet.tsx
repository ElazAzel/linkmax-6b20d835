/**
 * ContactDetailSheet - Side panel with contact info + timeline/notes + linked deals, tasks, conversations
 */
import { memo, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Save from 'lucide-react/dist/esm/icons/save';
import X from 'lucide-react/dist/esm/icons/x';
import Building2 from 'lucide-react/dist/esm/icons/building-2';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Send from 'lucide-react/dist/esm/icons/send';
import { toast } from 'sonner';
import type { ZoneContact } from '@/types/zones';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneTasks } from '@/hooks/zones/useZoneTasks';
import { useZoneContacts, useZoneContactNotes } from '@/hooks/zones/useZoneContacts';
import { useZoneContactFields } from '@/hooks/zones/useZoneContactFields';
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
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    email: '',
    telegram_username: '',
    tags: '',
    company: '',
    position: '',
    address: '',
    notes: '',
    custom_fields: {} as Record<string, any>,
  });
  const [newNote, setNewNote] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  // React Query Hooks for linked data
  const { deals } = useZoneDeals(open ? zoneId : null);
  const { tasks } = useZoneTasks(open ? zoneId : null);
  const { notes, addNote, loading: notesLoading } = useZoneContactNotes(
    open ? zoneId : null,
    open && contact ? contact.id : null
  );
  const { fields } = useZoneContactFields(open ? zoneId : null);

  // Filter linked data for THIS contact
  const linkedDeals = useMemo(() => deals.filter(d => d.contact_id === contact?.id), [deals, contact?.id]);
  const linkedTasks = useMemo(() => tasks.filter(t => t.contact_id === contact?.id), [tasks, contact?.id]);

  useEffect(() => {
    if (open && contact) setEditing(false);
  }, [open, contact?.id]);

  const startEdit = () => {
    if (!contact) return;
    setEditData({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      telegram_username: contact.telegram_username || '',
      tags: (contact.tags || []).join(', '),
      company: contact.company || '',
      position: contact.position || '',
      address: contact.address || '',
      notes: contact.notes || '',
      custom_fields: contact.custom_fields || {},
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
        company: editData.company || null,
        position: editData.position || null,
        address: editData.address || null,
        notes: editData.notes || null,
        custom_fields: editData.custom_fields,
      } as any);
      setEditing(false);
      toast.success(t('zones.contacts.updated', 'Contact updated'));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await addNote('note', newNote.trim());
      setNewNote('');
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
      case 'won': return <Badge className="bg-green-600 text-white text-xs">{t('zones.deals.won', 'Won')}</Badge>;
      case 'lost': return <Badge variant="destructive" className="text-xs">{t('zones.deals.lost', 'Lost')}</Badge>;
      default: return <Badge variant="outline" className="text-xs">{t('zones.deals.open', 'Open')}</Badge>;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-6 pb-2">
            <div className="flex justify-between items-start gap-4">
              <SheetTitle className="flex items-center gap-2 min-w-0">
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
              </SheetTitle>
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
            </div>

            {/* Quick Actions Bar */}
            {!editing && (
              <div className="flex gap-2 mt-4">
                {contact.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 gap-2 dark:bg-muted/30"
                    onClick={() => window.open(`tel:${contact.phone}`, '_self')}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {t('zones.contacts.call', 'Call')}
                  </Button>
                )}
                {contact.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 gap-2 dark:bg-muted/30"
                    onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {t('zones.contacts.sendEmail', 'Email')}
                  </Button>
                )}
                {contact.telegram_username && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 gap-2 text-blue-500 border-blue-500/20 hover:bg-blue-500/10 dark:bg-blue-500/5"
                    onClick={() => window.open(`https://t.me/${contact.telegram_username}`, '_blank')}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Telegram
                  </Button>
                )}
              </div>
            )}
          </SheetHeader>

          <Tabs defaultValue="timeline" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="timeline" className="text-xs min-h-11">{t('zones.contacts.notes', 'Timeline')}</TabsTrigger>
                <TabsTrigger value="deals" className="text-xs min-h-11">{t('zones.deals.title', 'Deals')} ({linkedDeals.length})</TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs min-h-11">{t('zones.tasks.title', 'Tasks')} ({linkedTasks.length})</TabsTrigger>
                <TabsTrigger value="details" className="text-xs min-h-11">{t('common.details', 'Info')}</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6">
              <div className="py-4 space-y-4">
                <TabsContent value="timeline" className="space-y-4 m-0">
                  {/* Add Note Input */}
                  <div className="relative group">
                    <Textarea
                      placeholder={t('zones.contacts.addNotePlaceholder', 'Write a note...')}
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      className="min-h-[80px] bg-muted/30 focus-visible:ring-1 pr-10 resize-none"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 bottom-2 h-8 w-8 text-primary opacity-0 group-focus-within:opacity-100 transition-opacity"
                      disabled={!newNote.trim() || notesLoading}
                      onClick={handleAddNote}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Notes List */}
                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground italic text-sm">
                      {t('zones.contacts.noNotes', 'No activities recorded yet')}
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-muted">
                      {notes.map(note => (
                        <div key={note.id} className="relative pl-8">
                          <div className="absolute left-0 top-1 w-[24px] h-[24px] rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                            <Badge className="p-0 bg-primary h-1.5 w-1.5 rounded-full" />
                          </div>
                          <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">{note.type}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(note.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="deals" className="space-y-2 m-0">
                  {linkedDeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">{t('zones.contacts.noDeals', 'No deals linked')}</p>
                  ) : linkedDeals.map(deal => (
                    <Card key={deal.id} className="overflow-hidden bg-muted/20 border-muted">
                      <CardContent className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{deal.title}</span>
                          {getStatusBadge(deal.status)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {deal.stage && (
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deal.stage.color }} />
                              {deal.stage.name}
                            </span>
                          )}
                          <span className="font-medium text-foreground">{deal.value_amount?.toLocaleString()} {deal.currency}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="tasks" className="space-y-2 m-0">
                  {linkedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 italic">{t('zones.contacts.noTasks', 'No tasks linked')}</p>
                  ) : linkedTasks.map(task => (
                    <Card key={task.id} className="overflow-hidden bg-muted/20 border-muted">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{task.title}</span>
                          <Badge variant={task.status === 'done' ? 'default' : 'outline'} className="text-[10px]">
                            {task.status}
                          </Badge>
                        </div>
                        {task.due_date && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {t('zones.tasks.due', 'Due:')} {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="details" className="space-y-6 m-0">
                  {/* Personal/Company Info */}
                  <div className="space-y-4">
                    {editing ? (
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{t('zones.contacts.phone', 'Phone')}</Label>
                          <Input value={editData.phone} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('zones.contacts.email', 'Email')}</Label>
                          <Input value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} type="email" className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('zones.contacts.company', 'Company')}</Label>
                          <Input value={editData.company} onChange={e => setEditData(p => ({ ...p, company: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('zones.contacts.position', 'Position')}</Label>
                          <Input value={editData.position} onChange={e => setEditData(p => ({ ...p, position: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('zones.contacts.address', 'Address')}</Label>
                          <Input value={editData.address} onChange={e => setEditData(p => ({ ...p, address: e.target.value }))} className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Telegram</Label>
                          <Input value={editData.telegram_username} onChange={e => setEditData(p => ({ ...p, telegram_username: e.target.value }))} placeholder="@username" className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('zones.contacts.tags', 'Tags')}</Label>
                          <Input value={editData.tags} onChange={e => setEditData(p => ({ ...p, tags: e.target.value }))} placeholder="VIP, partner" className="h-8" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('zones.contacts.generalNotes', 'General Notes')}</Label>
                          <Textarea value={editData.notes} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} className="min-h-[100px] text-sm" />
                        </div>
                        {fields.length > 0 && (
                          <div className="pt-4 border-t space-y-3 mt-4">
                            <p className="text-xs font-bold uppercase text-muted-foreground">{t('zones.contacts.additionalInfo', 'Дополнительная информация')}</p>
                            {fields.map(f => (
                              <div key={f.id} className="space-y-1">
                                <Label className="text-xs">{f.name} {f.is_required && '*'}</Label>
                                <Input
                                  className="h-8"
                                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                                  value={editData.custom_fields[f.id] || ''}
                                  onChange={e => {
                                    let val: any = e.target.value;
                                    if (f.type === 'number') val = Number(val);
                                    setEditData(p => ({ ...p, custom_fields: { ...p.custom_fields, [f.id]: val } }));
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between group/item">
                          <div className="flex gap-2 items-start text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground leading-none">{t('zones.contacts.phone', 'Phone')}</p>
                              <p className="font-medium">{contact.phone || '—'}</p>
                            </div>
                          </div>
                          {contact.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs opacity-0 group-hover/item:opacity-100 transition-opacity"
                              onClick={() => window.open(`tel:${contact.phone}`, '_self')}
                            >
                              {t('zones.contacts.call', 'Call')}
                            </Button>
                          )}
                        </div>

                        <div className="flex items-center justify-between group/item">
                          <div className="flex gap-2 items-start text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground leading-none">{t('zones.contacts.email', 'Email')}</p>
                              <p className="font-medium">{contact.email || '—'}</p>
                            </div>
                          </div>
                          {contact.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs opacity-0 group-hover/item:opacity-100 transition-opacity"
                              onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                            >
                              {t('zones.contacts.sendEmail', 'Email')}
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-2 items-start text-sm">
                          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground leading-none">{t('zones.contacts.company', 'Company')}</p>
                            <p className="font-medium">{contact.company || '—'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-start text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground leading-none">{t('zones.contacts.position', 'Position')}</p>
                            <p className="font-medium">{contact.position || '—'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-start text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground leading-none">{t('zones.contacts.address', 'Address')}</p>
                            <p className="font-medium">{contact.address || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between group/item">
                          <div className="flex gap-2 items-start text-sm">
                            <Send className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground leading-none">Telegram</p>
                              <p className="font-medium">{contact.telegram_username ? `@${contact.telegram_username}` : '—'}</p>
                            </div>
                          </div>
                          {contact.telegram_username && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs opacity-0 group-hover/item:opacity-100 transition-opacity text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => window.open(`https://t.me/${contact.telegram_username}`, '_blank')}
                            >
                              Telegram
                            </Button>
                          )}
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex gap-2 items-start text-sm">
                            <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex gap-1 flex-wrap">
                              {contact.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {fields.length > 0 && fields.some(f => contact.custom_fields?.[f.id]) && (
                          <div className="mt-6 pt-4 border-t space-y-3">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">{t('zones.contacts.additionalInfo', 'Дополнительная информация')}</p>
                            {fields.map(f => {
                              const val = contact.custom_fields?.[f.id];
                              if (val === undefined || val === null || val === '') return null;
                              return (
                                <div key={f.id} className="flex gap-2 items-start text-sm">
                                  <Tag className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 opacity-50" />
                                  <div className="space-y-0.5">
                                    <p className="text-[10px] text-muted-foreground leading-none">{f.name}</p>
                                    <p className="font-medium">
                                      {f.type === 'boolean' ? (val ? 'Да' : 'Нет') : val}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {contact.notes && (
                          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-[10px] text-primary font-bold uppercase mb-1">{t('zones.contacts.generalNotes', 'General Notes')}</p>
                            <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>

          {/* Quick stats footer */}
          {!editing && (
            <div className="p-4 bg-muted/30 border-t grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs font-bold">{linkedDeals.filter(d => d.status === 'won').length}</p>
                <p className="text-[8px] text-muted-foreground uppercase">{t('zones.deals.won', 'Won')}</p>
              </div>
              <div>
                <p className="text-xs font-bold">
                  {linkedDeals.filter(d => d.status === 'open').reduce((s, d) => s + (d.value_amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-[8px] text-muted-foreground uppercase">KZT {t('zones.contacts.pipeline', 'Pipeline')}</p>
              </div>
              <div>
                <p className="text-xs font-bold">{linkedTasks.filter(t => t.status !== 'done').length}</p>
                <p className="text-[8px] text-muted-foreground uppercase">{t('zones.contacts.openTasks', 'Open tasks')}</p>
              </div>
            </div>
          )}
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

