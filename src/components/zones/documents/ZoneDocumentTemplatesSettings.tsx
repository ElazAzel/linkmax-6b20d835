import React, { useState } from 'react';
import { useZoneDocuments } from '@/hooks/zones/useZoneDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useZoneContext } from '@/contexts/ZoneContext';
import { Plus, Trash, Edit2, FileText, Check, X, Loader2, Info } from 'lucide-react';
import { ZoneDocumentTemplate } from '@/types/zones';

export const ZoneDocumentTemplatesSettings = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
    const { currentZone } = useZoneContext();
    const zoneId = currentZone?.id || null;
    const { templates, createTemplate, updateTemplate, deleteTemplate, isTemplateLoading } = useZoneDocuments(zoneId);

    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<Partial<ZoneDocumentTemplate> | null>(null);

    const handleSave = async () => {
        if (!currentTemplate?.name || !currentTemplate?.content_html) return;

        try {
            if (currentTemplate.id) {
                await updateTemplate(currentTemplate as ZoneDocumentTemplate & { id: string });
            } else {
                await createTemplate(currentTemplate);
            }
            setIsEditing(false);
            setCurrentTemplate(null);
        } catch (error) {
            console.error('Failed to save template', error);
        }
    };

    const handleEdit = (tpl: ZoneDocumentTemplate) => {
        setCurrentTemplate(tpl);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentTemplate({
            name: '',
            description: '',
            content_html: '',
            is_active: true
        });
        setIsEditing(true);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 glass-card border-white/10 text-white overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Управление шаблонами
                    </DialogTitle>
                    <DialogDescription className="text-white/60">
                        Создавайте и редактируйте шаблоны документов с поддержкой переменных {'{{ contact_name }}'}, {'{{ deal_title }}'} и др.
                    </DialogDescription>
                </DialogHeader>

                {!isEditing ? (
                    <>
                        <ScrollArea className="flex-1 px-6">
                            <div className="space-y-4 py-4">
                                {templates?.map((tpl) => (
                                    <Card key={tpl.id} className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-sm">{tpl.name}</h4>
                                                <p className="text-xs text-white/50 truncate max-w-[400px]">{tpl.description || 'Нет описания'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" onClick={() => handleEdit(tpl)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-white/60 hover:text-red-400"
                                                    onClick={() => {
                                                        if (confirm('Удалить шаблон?')) deleteTemplate(tpl.id);
                                                    }}
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {templates?.length === 0 && (
                                    <div className="text-center py-12 text-white/50">
                                        <p>У вас еще нет шаблонов</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <DialogFooter className="p-6 pt-2 border-t border-white/5">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/70">Закрыть</Button>
                            <Button onClick={handleAddNew} className="bg-primary text-black">
                                <Plus className="w-4 h-4 mr-2" /> Добавить шаблон
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <ScrollArea className="flex-1 px-6">
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Название шаблона</Label>
                                    <Input
                                        value={currentTemplate?.name || ''}
                                        onChange={e => setCurrentTemplate(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Договор оказания услуг"
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Описание</Label>
                                    <Input
                                        value={currentTemplate?.description || ''}
                                        onChange={e => setCurrentTemplate(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Основной шаблон договора для новых клиентов"
                                        className="bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Текст шаблона (HTML/Text)</Label>
                                        <div className="flex items-center gap-1 text-[10px] text-primary/70">
                                            <Info className="w-3 h-3" />
                                            Поддерживаются переменные: {'{{name}}'}, {'{{company}}'}, {'{{amount}}'}
                                        </div>
                                    </div>
                                    <Textarea
                                        value={currentTemplate?.content_html || ''}
                                        onChange={e => setCurrentTemplate(p => ({ ...p, content_html: e.target.value }))}
                                        placeholder="Введите текст документа..."
                                        className="min-h-[300px] bg-white/5 border-white/10 text-white font-mono text-sm leading-relaxed"
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                        <DialogFooter className="p-6 pt-2 border-t border-white/5">
                            <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-white/70">Отмена</Button>
                            <Button onClick={handleSave} disabled={!currentTemplate?.name || !currentTemplate?.content_html || isTemplateLoading} className="bg-primary text-black">
                                {isTemplateLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
