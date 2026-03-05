import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useZoneDocuments } from '@/hooks/zones/useZoneDocuments';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneContext } from '@/contexts/ZoneContext';
import { Loader2, FileText } from 'lucide-react';

interface ZoneDocumentCreatorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultDealId?: string;
    defaultContactId?: string;
}

export const ZoneDocumentCreator = ({ open, onOpenChange, defaultDealId, defaultContactId }: ZoneDocumentCreatorProps) => {
    const { currentZone } = useZoneContext();
    const zoneId = currentZone?.id;

    const { templates, createDocument, isCreating } = useZoneDocuments(zoneId);
    const { deals } = useZoneDeals(zoneId);
    const { contacts } = useZoneContacts(zoneId);

    const [title, setTitle] = useState('');
    const [templateId, setTemplateId] = useState<string>('');
    const [dealId, setDealId] = useState<string>(defaultDealId || 'none');
    const [contactId, setContactId] = useState<string>(defaultContactId || 'none');

    // When template changes, auto-fill title
    useEffect(() => {
        if (templateId && templates) {
            const tpl = templates.find(t => t.id === templateId);
            if (tpl && !title) {
                setTitle(tpl.name);
            }
        }
    }, [templateId, templates, title]);

    const handleCreate = async () => {
        if (!title || !templateId) return;

        try {
            await createDocument({
                title,
                template_id: templateId,
                deal_id: dealId !== 'none' ? dealId : null,
                contact_id: contactId !== 'none' ? contactId : null,
                status: 'draft',
            });
            onOpenChange(false);
            // Reset form
            setTitle('');
            setTemplateId('');
            setDealId(defaultDealId || 'none');
            setContactId(defaultContactId || 'none');
        } catch (error) {
            console.error('Failed to create document', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] glass-card border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Создать документ
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        Выберите шаблон и привяжите документ к сделке или контакту для автозаполнения переменных.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="template">Шаблон документа <span className="text-red-500">*</span></Label>
                        <Select value={templateId} onValueChange={setTemplateId}>
                            <SelectTrigger id="template" className="bg-white/5 border-white/10 text-white">
                                <SelectValue placeholder="Выберите шаблон..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                                {templates?.map((tpl) => (
                                    <SelectItem key={tpl.id} value={tpl.id} className="text-white focus:bg-white/10">
                                        {tpl.name}
                                    </SelectItem>
                                ))}
                                {templates?.length === 0 && (
                                    <div className="p-2 text-sm text-white/50 text-center">Нет активных шаблонов</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Название документа <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например: Договор №123"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="deal">Привязать к сделке</Label>
                            <Select value={dealId} onValueChange={setDealId}>
                                <SelectTrigger id="deal" className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Без сделки" />
                                </SelectTrigger>
                                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                                    <SelectItem value="none" className="text-white/50 focus:bg-white/10">Без сделки</SelectItem>
                                    {deals?.map((deal) => (
                                        <SelectItem key={deal.id} value={deal.id} className="text-white focus:bg-white/10">
                                            {deal.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact">Привязать к контакту</Label>
                            <Select value={contactId} onValueChange={setContactId}>
                                <SelectTrigger id="contact" className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Без контакта" />
                                </SelectTrigger>
                                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                                    <SelectItem value="none" className="text-white/50 focus:bg-white/10">Без контакта</SelectItem>
                                    {contacts?.map((contact) => (
                                        <SelectItem key={contact.id} value={contact.id} className="text-white focus:bg-white/10">
                                            {contact.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/70 hover:text-white hover:bg-white/10">
                        Отмена
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!title || !templateId || isCreating}
                        className="bg-primary text-black hover:bg-primary/90"
                    >
                        {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Создать
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
