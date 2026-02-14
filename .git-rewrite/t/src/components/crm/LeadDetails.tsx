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
  Send
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
  note: <FileText className="h-4 w-4" />,
  call: <PhoneCall className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  meeting: <Video className="h-4 w-4" />,
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

  const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];
  const interactionTypes: InteractionType[] = ['note', 'call', 'email', 'message', 'meeting'];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {lead.name}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Contact Info */}
            <Card className="p-4 space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                {t('crm.contactInfo', 'Contact Information')}
              </h4>
              {lead.email && (
                <a 
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {lead.email}
                </a>
              )}
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {lead.phone}
                </a>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t('crm.createdAt', 'Created')}: {formatDate(lead.created_at)}
              </div>
            </Card>

            {/* Status */}
            <div>
              <Label>{t('crm.status.label', 'Status')}</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue>
                    <Badge variant="outline" className={statusColors[status]}>
                      {t(`crm.status.${status}`, status)}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s}>
                      <Badge variant="outline" className={statusColors[s]}>
                        {t(`crm.status.${s}`, s)}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>{t('crm.notes', 'Notes')}</Label>
                {hasChanges && (
                  <Button size="sm" variant="ghost" onClick={handleSaveNotes} disabled={saving}>
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
                rows={3}
              />
            </div>

            {/* Add Interaction */}
            <Card className="p-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">
                {t('crm.addInteraction', 'Add Interaction')}
              </h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {interactionTypes.map(type => (
                    <Button
                      key={type}
                      size="sm"
                      variant={newInteractionType === type ? 'default' : 'outline'}
                      onClick={() => setNewInteractionType(type)}
                      className="flex-1"
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
                  />
                  <Button onClick={handleAddInteraction} disabled={!newInteractionContent.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Interactions History */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-3">
                {t('crm.history', 'History')} ({interactions.length})
              </h4>
              {interactionsLoading ? (
                <p className="text-sm text-muted-foreground">{t('messages.loading', 'Loading...')}</p>
              ) : interactions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('crm.noInteractions', 'No interactions yet')}
                </p>
              ) : (
                <div className="space-y-2">
                  {interactions.map(interaction => (
                    <Card key={interaction.id} className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="p-1.5 rounded-full bg-accent">
                          {interactionIcons[interaction.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {t(`crm.interactionTypes.${interaction.type}`, interaction.type)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(interaction.created_at)}
                            </span>
                          </div>
                          <p className="text-sm mt-0.5">{interaction.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('crm.deleteLead', 'Delete Lead')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('crm.confirmDelete', 'Delete this lead?')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('crm.deleteWarning', 'This action cannot be undone. All interactions will also be deleted.')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('editor.cancel', 'Cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
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
