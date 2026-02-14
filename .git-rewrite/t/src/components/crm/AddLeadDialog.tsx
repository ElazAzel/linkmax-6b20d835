import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeads, LeadSource, LeadStatus } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const { t } = useTranslation();
  const { createLead, saving } = useLeads();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'manual' as LeadSource,
    status: 'new' as LeadStatus,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    
    const result = await createLead(formData);
    if (result) {
      setFormData({
        name: '',
        email: '',
        phone: '',
        source: 'manual',
        status: 'new',
        notes: '',
      });
      onOpenChange(false);
    }
  };

  const sources: LeadSource[] = ['manual', 'page_view', 'form', 'messenger', 'other'];
  const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('crm.addLead', 'Add Lead')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('fields.name', 'Name')} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('crm.namePlaceholder', 'Client name')}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('fields.email', 'Email')}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>{t('crm.phone', 'Phone')}</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 999 123 45 67"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('crm.source', 'Source')}</Label>
              <Select
                value={formData.source}
                onValueChange={(value: LeadSource) => setFormData(prev => ({ ...prev, source: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(source => (
                    <SelectItem key={source} value={source}>
                      {t(`crm.sources.${source}`, source)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('crm.status.label', 'Status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: LeadStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {t(`crm.status.${status}`, status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>{t('crm.notes', 'Notes')}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('crm.notesPlaceholder', 'Additional notes about this lead...')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('editor.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={saving || !formData.name.trim()}>
              {saving ? t('messages.loading', 'Loading...') : t('crm.addLead', 'Add Lead')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
