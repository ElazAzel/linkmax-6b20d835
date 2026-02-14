import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeads, useLeadInteractions, LeadStatus, InteractionType } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Trash2, 
  MessageSquare,
  PhoneCall,
  Video,
  FileText,
  Send,
  Tag
} from 'lucide-react';
import type { Lead } from '@/hooks/useLeads';

interface LeadDetailsProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  contacted: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  qualified: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  converted: 'bg-green-500/20 text-green-500 border-green-500/30',
  lost: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const interactionIcons: Record<InteractionType, React.ReactNode> = {
  note: <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
  call: <PhoneCall className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
  email: <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
  message: <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
  meeting: <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />,
};

const sourceColors: Record<string, string> = {
  form: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  messenger: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
  manual: 'bg-slate-500/20 text-slate-500 border-slate-500/30',
  page_view: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
  other: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
};

const sourceIcons: Record<string, string> = {
  form: '📝',
  messenger: '💬',
  manual: '✏️',
  page_view: '👁️',
  other: '📌',
};

export function LeadDetails({ lead, open, onOpenChange }: LeadDetailsProps) {
  const { t } = useTranslation();
  const { updateLead, deleteLead, saving } = useLeads();
  const { interactions, loading: interactionsLoading, addInteraction } = useLeadInteractions(lead.id);
  
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes || '');
  const [newInteractionType, setNewInteractionType] = useState<InteractionType>('note');
  const [newInteractionContent, setNewInteractionContent] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setStatus(newStatus);
    await updateLead(lead.id, { status: newStatus });
  };

  const handleSaveNotes = async () => {
    await updateLead(lead.id, { notes });
    setHasChanges(false);
  };

  const handleAddInteraction = async () => {
    if (!newInteractionContent.trim()) return;
    
    await addInteraction(newInteractionType, newInteractionContent);
    setNewInteractionContent('');
  };

  const handleDelete = async () => {
    await deleteLead(lead.id);
    onOpenChange(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  const interactionTypes: InteractionType[] = ['note', 'call', 'email', 'message', 'meeting'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-3 sm:p-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{lead.name}</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
            {/* Contact Info - Compact card */}
            <Card className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground">
                {t('crm.contactInfo', 'Contact Information')}
              </h4>
              {lead.email && (
                <a 
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 text-xs sm:text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </a>
              )}
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 text-xs sm:text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {lead.phone}
                </a>
              )}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {formatShortDate(lead.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${sourceColors[lead.source]} text-[10px] sm:text-xs`}>
                  {sourceIcons[lead.source]} {t(`crm.source.${lead.source}`, lead.source)}
                </Badge>
              </div>
            </Card>

            {/* Form Data / Metadata - Compact */}
            {lead.metadata && Object.keys(lead.metadata).length > 0 && (
              <Card className="p-3 sm:p-4">
                <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {t('crm.formData', 'Form Data')}
                </h4>
                <div className="space-y-1.5 sm:space-y-2">
                  {Object.entries(lead.metadata).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5 p-2 bg-accent/50 rounded-lg">
                      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">{key}</span>
                      <span className="text-xs sm:text-sm break-words">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Status - Full width select */}
            <div>
              <Label className="text-xs sm:text-sm">{t('crm.status.label', 'Status')}</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="mt-1 h-9 sm:h-10">
                  <SelectValue>
                    <Badge variant="outline" className={`${statusColors[status]} text-[10px] sm:text-xs`}>
                      {t(`crm.status.${status}`, status)}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s}>
                      <Badge variant="outline" className={`${statusColors[s]} text-[10px] sm:text-xs`}>
                        {t(`crm.status.${s}`, s)}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes - Compact textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs sm:text-sm">{t('crm.notes', 'Notes')}</Label>
                {hasChanges && (
                  <Button size="sm" variant="ghost" onClick={handleSaveNotes} disabled={saving} className="h-7 text-xs">
                    {t('editor.save', 'Save')}
                  </Button>
                )}
              </div>
              <Textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setHasChanges(true);
                }}
                placeholder={t('crm.notesPlaceholder', 'Add notes...')}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            {/* Add Interaction - Compact */}
            <Card className="p-3 sm:p-4">
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                {t('crm.addInteraction', 'Add Interaction')}
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {/* Interaction type buttons - Compact grid */}
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {interactionTypes.map(type => (
                    <Button
                      key={type}
                      size="sm"
                      variant={newInteractionType === type ? 'default' : 'outline'}
                      onClick={() => setNewInteractionType(type)}
                      className="h-8 sm:h-9 p-0"
                    >
                      {interactionIcons[type]}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newInteractionContent}
                    onChange={(e) => setNewInteractionContent(e.target.value)}
                    placeholder={t('crm.interactionPlaceholder', 'What happened?')}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddInteraction()}
                    className="h-9 sm:h-10 text-sm"
                  />
                  <Button onClick={handleAddInteraction} disabled={!newInteractionContent.trim()} size="icon" className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Interactions History - Compact list */}
            <div>
              <h4 className="font-medium text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                {t('crm.history', 'History')} ({interactions.length})
              </h4>
              {interactionsLoading ? (
                <p className="text-xs sm:text-sm text-muted-foreground">{t('messages.loading', 'Loading...')}</p>
              ) : interactions.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('crm.noInteractions', 'No interactions yet')}
                </p>
              ) : (
                <div className="space-y-1.5 sm:space-y-2">
                  {interactions.map(interaction => (
                    <Card key={interaction.id} className="p-2.5 sm:p-3">
                      <div className="flex items-start gap-2">
                        <div className="p-1 sm:p-1.5 rounded-full bg-accent shrink-0">
                          {interactionIcons[interaction.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                              {t(`crm.interactionTypes.${interaction.type}`, interaction.type)}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">
                              {formatShortDate(interaction.created_at)}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm mt-0.5 break-words">{interaction.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Delete - Full width */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full h-9 sm:h-10 text-sm">
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  {t('crm.deleteLead', 'Delete Lead')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base sm:text-lg">{t('crm.confirmDelete', 'Delete this lead?')}</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs sm:text-sm">
                    {t('crm.deleteWarning', 'This action cannot be undone. All interactions will also be deleted.')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel className="h-9 sm:h-10 text-sm">{t('editor.cancel', 'Cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground h-9 sm:h-10 text-sm">
                    {t('editor.delete', 'Delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}