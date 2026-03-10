import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useAppError } from '@/hooks/useAppError';

interface ZonePipelineSettingsProps {
    zoneId: string;
}

export const ZonePipelineSettings = memo(function ZonePipelineSettings({ zoneId }: ZonePipelineSettingsProps) {
    const { t } = useTranslation();
    const { handleError } = useAppError();
    const { pipelines, createPipeline, updatePipeline, deletePipeline, refetchPipelines } = useZoneDeals(zoneId);
    const [newPipelineName, setNewPipelineName] = useState('');
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleCreate = async () => {
        if (!newPipelineName.trim()) return;
        setAdding(true);
        try {
            await createPipeline({ name: newPipelineName.trim(), is_default: pipelines.length === 0 });
            setNewPipelineName('');
            toast.success(t('zones.settings.pipelines.created', 'Pipeline created'));
        } catch (err: any) {
            handleError(err);
        } finally {
            setAdding(false);
        }
    };

    const handleUpdate = async (id: string, updates: any) => {
        try {
            // If setting default, unset others first (handled primarily by trigger if we had one, 
            // but let's do it in UI logic for simplicity since it's a small app context)
            if (updates.is_default) {
                const others = pipelines.filter(p => p.id !== id && p.is_default);
                for (const other of others) {
                    await updatePipeline(other.id, { is_default: false });
                }
            }
            await updatePipeline(id, updates);
            setEditingId(null);
            toast.success(t('zones.settings.pipelines.updated', 'Pipeline updated'));
        } catch (err: any) {
            handleError(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (pipelines.length <= 1) {
            toast.error(t('zones.settings.pipelines.lastOne', 'Cannot delete the last pipeline'));
            return;
        }
        const p = pipelines.find(p => p.id === id);
        if (p?.is_default) {
            toast.error(t('zones.settings.pipelines.cannotDeleteDefault', 'Cannot delete default pipeline. Set another as default first.'));
            return;
        }
        if (!confirm(t('zones.settings.pipelines.confirmDelete', 'Are you sure? Deals in this pipeline will be hidden until reassigned.'))) return;
        try {
            await deletePipeline(id);
            toast.success(t('zones.settings.pipelines.deleted', 'Pipeline deleted'));
        } catch (err: any) {
            handleError(err);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Input
                    value={newPipelineName}
                    onChange={e => setNewPipelineName(e.target.value)}
                    placeholder={t('zones.settings.pipelines.newPlaceholder', 'Новая воронка...')}
                    className="max-w-xs"
                />
                <Button onClick={handleCreate} disabled={adding || !newPipelineName.trim()}>
                    {adding ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                    {t('common.add', 'Add')}
                </Button>
            </div>

            <div className="space-y-2">
                {pipelines.map(p => (
                    <Card key={p.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            {editingId === p.id ? (
                                <div className="flex items-center gap-2 flex-1 mr-4">
                                    <Input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        autoFocus
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => handleUpdate(p.id, { name: editName.trim() })}>
                                        <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className="flex-1 font-medium cursor-pointer hover:underline"
                                    onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                                >
                                    {p.name}
                                </div>
                            )}

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor={`default-${p.id}`} className="text-xs text-muted-foreground">Default</Label>
                                    <Switch
                                        id={`default-${p.id}`}
                                        checked={p.is_default}
                                        onCheckedChange={(c) => c && handleUpdate(p.id, { is_default: true })}
                                        disabled={p.is_default}
                                    />
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => handleDelete(p.id)}
                                    disabled={p.is_default || pipelines.length <= 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {pipelines.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    {t('zones.settings.pipelines.empty', 'У вас пока нет воронок. Создайте первую воронку продаж.')}
                </p>
            )}
        </div>
    );
});
