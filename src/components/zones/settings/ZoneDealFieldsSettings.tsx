/**
 * ZoneDealFieldsSettings - component to manage custom deal fields
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneDealFields } from '@/hooks/zones/useZoneDealFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Pencil from 'lucide-react/dist/esm/icons/pencil';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import { toast } from 'sonner';
import type { ZoneDealFieldType, ZoneDealField } from '@/types/zones';

interface ZoneDealFieldsSettingsProps {
    zoneId: string;
}

export function ZoneDealFieldsSettings({ zoneId }: ZoneDealFieldsSettingsProps) {
    const { t } = useTranslation();
    const { fields, loading, createField, updateField, deleteField } = useZoneDealFields(zoneId);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedField, setSelectedField] = useState<ZoneDealField | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'text' as ZoneDealFieldType,
        is_required: false,
    });

    const handleOpenCreate = () => {
        setFormData({ name: '', type: 'text', is_required: false });
        setCreateOpen(true);
    };

    const handleOpenEdit = (field: ZoneDealField) => {
        setSelectedField(field);
        setFormData({ name: field.name, type: field.type, is_required: field.is_required });
        setEditOpen(true);
    };

    const handleOpenDelete = (field: ZoneDealField) => {
        setSelectedField(field);
        setDeleteOpen(true);
    };

    const handleSaveCreate = async () => {
        if (!formData.name.trim()) return;
        try {
            await createField({
                name: formData.name.trim(),
                type: formData.type,
                is_required: formData.is_required,
                order_index: fields.length,
            });
            setCreateOpen(false);
            toast.success(t('zones.settings.dealFields.created', 'Deal field created successfully'));
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedField || !formData.name.trim()) return;
        try {
            await updateField(selectedField.id, {
                name: formData.name.trim(),
                type: formData.type,
                is_required: formData.is_required,
            });
            setEditOpen(false);
            toast.success(t('zones.settings.dealFields.updated', 'Deal field updated successfully'));
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedField) return;
        try {
            await deleteField(selectedField.id);
            setDeleteOpen(false);
            toast.success(t('zones.settings.dealFields.deleted', 'Deal field deleted successfully'));
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const getTypeLabel = (type: ZoneDealFieldType) => {
        switch (type) {
            case 'text': return t('zones.settings.fields.typeText', 'Text');
            case 'number': return t('zones.settings.fields.typeNumber', 'Number');
            case 'date': return t('zones.settings.fields.typeDate', 'Date');
            case 'boolean': return t('zones.settings.fields.typeBoolean', 'Yes/No');
            default: return type;
        }
    };

    return (
        <div className="space-y-4 max-w-2xl">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">{t('zones.settings.dealFields.title', 'Custom Deal Fields')}</h3>
                    <p className="text-sm text-muted-foreground">
                        {t('zones.settings.dealFields.description', 'Define custom fields for your deals and sales pipelines.')}
                    </p>
                </div>
                <Button size="sm" onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('zones.settings.fields.add', 'Add Field')}
                </Button>
            </div>

            <div className="space-y-2">
                {loading ? (
                    <p className="text-sm text-muted-foreground">{t('common.loading', 'Loading...')}</p>
                ) : fields.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
                        {t('zones.settings.dealFields.empty', 'No custom fields defined yet.')}
                    </p>
                ) : (
                    fields.map((field) => (
                        <Card key={field.id} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing opacity-50" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm truncate">{field.name}</span>
                                        {field.is_required && <Badge variant="secondary" className="text-xs">{t('zones.settings.fields.required', 'Required')}</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{getTypeLabel(field.type)}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(field)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleOpenDelete(field)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={createOpen || editOpen} onOpenChange={(open) => {
                if (!open) { setCreateOpen(false); setEditOpen(false); }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {createOpen
                                ? t('zones.settings.dealFields.addTitle', 'Add Custom Field')
                                : t('zones.settings.dealFields.editTitle', 'Edit Custom Field')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('zones.settings.fields.nameLabel', 'Field Name')} *</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('zones.settings.fields.namePlaceholder', 'e.g., Contract Number, Product Amount')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>{t('zones.settings.fields.typeLabel', 'Field Type')} *</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v: ZoneDealFieldType) => setFormData({ ...formData, type: v })}
                                disabled={editOpen}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">{t('zones.settings.fields.typeText', 'Text')}</SelectItem>
                                    <SelectItem value="number">{t('zones.settings.fields.typeNumber', 'Number')}</SelectItem>
                                    <SelectItem value="date">{t('zones.settings.fields.typeDate', 'Date')}</SelectItem>
                                    <SelectItem value="boolean">{t('zones.settings.fields.typeBoolean', 'Yes/No (Boolean)')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="is_deal_required"
                                checked={formData.is_required}
                                onCheckedChange={(c) => setFormData({ ...formData, is_required: !!c })}
                            />
                            <Label htmlFor="is_deal_required" className="text-sm font-normal cursor-pointer">
                                {t('zones.settings.fields.requiredLabel', 'This field is required')}
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setCreateOpen(false); setEditOpen(false); }}>
                            {t('common.cancel', 'Cancel')}
                        </Button>
                        <Button
                            onClick={createOpen ? handleSaveCreate : handleSaveEdit}
                            disabled={!formData.name.trim()}
                        >
                            {t('common.save', 'Save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('zones.settings.dealFields.deleteTitle', 'Delete Field?')}</DialogTitle>
                        <DialogDescription>
                            {t('zones.settings.fields.deleteWarning', 'Are you sure you want to delete the field "{{name}}"? Data stored in this field will no longer be visible but will remain in the database.', { name: selectedField?.name })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>{t('common.delete', 'Delete')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
