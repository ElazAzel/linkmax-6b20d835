import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { emailSequencesService, type EmailSequence, type SequenceStep } from '@/services/emailSequences';
import { emailTemplatesService, type EmailTemplate } from '@/services/emailTemplates';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Clock from 'lucide-react/dist/esm/icons/clock';

export function EmailSequencesManager() {
  const { t } = useTranslation();
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSequence, setSelectedSequence] = useState<(EmailSequence & { steps: any[] }) | null>(null);
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState({ template_id: '', delay_hours: 24 });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [sqRes, tplRes] = await Promise.all([
      emailSequencesService.listSequences(),
      emailTemplatesService.listTemplates()
    ]);
    if (sqRes.data) setSequences(sqRes.data);
    if (tplRes.data) setTemplates(tplRes.data);
    setLoading(false);
  };

  const handleCreateSequence = async () => {
    const name = prompt(t('sequences.enterName', 'Enter sequence name'));
    if (!name) return;
    
    const { data, error } = await emailSequencesService.createSequence(name);
    if (data) setSequences(prev => [data, ...prev]);
    if (error) toast.error(t('sequences.createError', 'Failed to create sequence'));
  };

  const handleSelectSequence = async (id: string) => {
    const { data, error } = await emailSequencesService.getSequenceDetails(id);
    if (data) setSelectedSequence(data);
    if (error) toast.error(t('sequences.loadDetailError', 'Failed to load details'));
  };

  const handleAddStep = async () => {
    if (!selectedSequence || !newStep.template_id) return;
    
    const nextOrder = selectedSequence.steps.length + 1;
    const { data, error } = await emailSequencesService.addStep(
      selectedSequence.id, 
      newStep.template_id, 
      newStep.delay_hours, 
      nextOrder
    );
    
    if (data) {
      handleSelectSequence(selectedSequence.id); // Refresh
      setIsAddingStep(false);
      setNewStep({ template_id: '', delay_hours: 24 });
      toast.success(t('sequences.stepAdded', 'Step added'));
    }
    if (error) toast.error(t('sequences.addStepError', 'Failed to add step'));
  };

  const handleToggleStatus = async (seq: EmailSequence) => {
    const newStatus = seq.status === 'active' ? 'paused' : 'active';
    const { error } = await emailSequencesService.updateStatus(seq.id, newStatus);
    if (!error) {
      setSequences(prev => prev.map(s => s.id === seq.id ? { ...s, status: newStatus } : s));
      toast.success(t('sequences.statusUpdated', 'Status updated'));
    }
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteId) return;
    setDeleteConfirmOpen(false);
    const { error } = await emailSequencesService.deleteSequence(pendingDeleteId);
    if (!error) {
      setSequences(prev => prev.filter(s => s.id !== pendingDeleteId));
      if (selectedSequence?.id === pendingDeleteId) setSelectedSequence(null);
      toast.success(t('sequences.deleted', 'Sequence deleted'));
    }
    setPendingDeleteId(null);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('sequences.title', 'Email Sequences')}</h3>
        <Button onClick={handleCreateSequence} size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('sequences.new', 'New Sequence')}
        </Button>
      </div>

      <div className="grid gap-3">
        {sequences.map(seq => (
          <Card key={seq.id} className="p-3 bg-background/30 border-border/20">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="cursor-pointer flex-1 text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => handleSelectSequence(seq.id)}
              >
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{seq.name}</h4>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    seq.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {seq.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{seq.description || t('sequences.noDesc', 'No description')}</p>
              </button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(seq)}>
                  {seq.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(seq.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedSequence?.id === seq.id && (
              <div className="mt-4 pt-4 border-t border-border/20 space-y-3">
                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('sequences.steps', 'Sequence Steps')}
                </h5>
                <div className="space-y-2">
                  {selectedSequence.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-3 relative pl-6">
                      <div className="absolute left-2 top-0 bottom-0 w-px bg-border/50">
                        <div className="absolute top-2 -left-1 w-2.5 h-2.5 rounded-full bg-primary border-4 border-background" />
                      </div>
                      <div className="p-2 rounded-lg bg-background/50 border border-border/10 flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{step.template?.name || 'Template'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {step.delay_hours}h
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isAddingStep ? (
                    <Card className="p-3 bg-primary/5 border-dashed border-primary/30 mt-2">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs">{t('sequences.selectTemplate', 'Select Template')}</Label>
                          <Select 
                            value={newStep.template_id} 
                            onValueChange={(val: string) => setNewStep({...newStep, template_id: val})}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue placeholder={t('sequences.choose', 'Choose...')} />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map(tpl => (
                                <SelectItem key={tpl.id} value={tpl.id} className="text-xs">{tpl.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('sequences.delayHours', 'Delay (hours)')}</Label>
                          <Input 
                            type="number" 
                            className="h-8 text-xs bg-background"
                            value={newStep.delay_hours}
                            onChange={e => setNewStep({...newStep, delay_hours: parseInt(e.target.value)})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAddStep}>
                            {t('common.add', 'Add')}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsAddingStep(false)}>
                            {t('common.cancel', 'Cancel')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="w-full h-8 border border-dashed text-xs gap-2"
                      onClick={() => setIsAddingStep(true)}
                    >
                      <Plus className="h-3 w-3" />
                      {t('sequences.addStep', 'Add Step')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        ))}
        {sequences.length === 0 && (
          <p className="text-xs text-center py-6 text-muted-foreground">{t('sequences.empty', 'Create your first automated sequence')}</p>
        )}
      </div>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('sequences.confirmDeleteTitle', 'Delete sequence')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('sequences.confirmDelete', 'Delete this sequence?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>{t('common.delete', 'Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
