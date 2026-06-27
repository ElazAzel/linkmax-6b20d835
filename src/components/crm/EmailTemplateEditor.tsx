import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { emailTemplatesService, type EmailTemplate } from '@/services/emailTemplates';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Save from 'lucide-react/dist/esm/icons/save';
import X from 'lucide-react/dist/esm/icons/x';
import Info from 'lucide-react/dist/esm/icons/info';

export function EmailTemplateEditor() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteTplId, setPendingDeleteTplId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await emailTemplatesService.listTemplates();
    if (data) setTemplates(data);
    if (error) {
      setLoadError(true);
      toast.error(t('templates.loadError', 'Failed to load templates'));
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingTemplate({
      name: '',
      subject: '',
      content_html: ''
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
  };

  const handleSave = async () => {
    if (!editingTemplate?.name || !editingTemplate?.subject || !editingTemplate?.content_html) {
      toast.error(t('templates.fillAllFields', 'Please fill all required fields'));
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate.id) {
        const { data, error } = await emailTemplatesService.updateTemplate(editingTemplate.id, editingTemplate);
        if (error) throw error;
        setTemplates(prev => prev.map(t => t.id === data?.id ? data : t));
        toast.success(t('templates.updated', 'Template updated'));
      } else {
        const { data, error } = await emailTemplatesService.createTemplate(editingTemplate as any);
        if (error) throw error;
        if (data) setTemplates(prev => [data, ...prev]);
        toast.success(t('templates.created', 'Template created'));
      }
      setEditingTemplate(null);
    } catch (error) {
      logger.error('Error saving template', error);
      toast.error(t('templates.saveError', 'Failed to save template'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setPendingDeleteTplId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteTplId) return;
    setDeleteConfirmOpen(false);
    const { error } = await emailTemplatesService.deleteTemplate(pendingDeleteTplId);
    if (!error) {
      setTemplates(prev => prev.filter(t => t.id !== pendingDeleteTplId));
      toast.success(t('templates.deleted', 'Template deleted'));
    } else {
      toast.error(t('templates.deleteError', 'Failed to delete template'));
    }
    setPendingDeleteTplId(null);
  };

  if (loading) {
    return <LoadingState message={t('messages.loading', 'Loading...')} />;
  }

  if (loadError) {
    return (
      <ErrorState
        title={t('templates.loadErrorTitle', 'Не удалось загрузить шаблоны')}
        description={t('templates.loadErrorDesc', 'Попробуйте обновить список шаблонов.') }
        retryLabel={t('common.retry', 'Повторить')}
        onRetry={loadTemplates}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('templates.title', 'Email Templates')}</h3>
        <Button onClick={handleCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('templates.addNew', 'Add New')}
        </Button>
      </div>

      {editingTemplate ? (
        <Card className="p-4 bg-background/50 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">
              {editingTemplate.id ? t('templates.edit', 'Edit Template') : t('templates.create', 'Create Template')}
            </h4>
            <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">{t('templates.nameLabel', 'Template Name')}</Label>
              <Input 
                id="tpl-name"
                value={editingTemplate.name}
                onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                placeholder={t('templates.namePlaceholder', 'e.g. Welcome Email')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-subject">{t('templates.subjectLabel', 'Email Subject')}</Label>
              <Input 
                id="tpl-subject"
                value={editingTemplate.subject}
                onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                placeholder={t('templates.subjectPlaceholder', 'Hello {lead_name}!')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-content">{t('templates.contentLabel', 'HTML Content')}</Label>
              <Textarea 
                id="tpl-content"
                value={editingTemplate.content_html}
                onChange={e => setEditingTemplate({...editingTemplate, content_html: e.target.value})}
                placeholder="<p>Hi {lead_name}, ...</p>"
                rows={8}
                className="font-mono text-xs"
              />
              <div className="flex items-start gap-1.5 mt-1.5">
                <Info className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t('templates.variablesNote', 'Use {lead_name} for personalization')}
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('common.save', 'Save')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.length === 0 ? (
            <EmptyState
              title={t('templates.empty', 'No templates created yet')}
              description={t('templates.emptyDesc', 'Create your first reusable email template')}
              ctaLabel={t('templates.addNew', 'Add New')}
              onCtaClick={handleCreate}
            />
          ) : (
            templates.map(tpl => (
              <Card key={tpl.id} className="p-3 flex items-center justify-between bg-background/30 border-border/20">
                <div>
                  <h4 className="font-medium text-sm">{tpl.name}</h4>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tpl.subject}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(tpl)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tpl.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('templates.confirmDeleteTitle', 'Delete template')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('templates.confirmDelete', 'Are you sure you want to delete this template?')}
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
