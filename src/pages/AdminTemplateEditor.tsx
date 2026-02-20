import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { GridEditor } from '@/components/editor/GridEditor';
import { BlockEditorV2 } from '@/components/editor/BlockEditorV2';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { Block } from '@/types/page';
import { TEMPLATE_CATEGORY_KEYS, type TemplateCategoryKey, getTemplateCategoryLabel } from '@/lib/templateCategories';
import { createBlock } from '@/lib/blocks/block-factory';

interface TemplateData {
    id?: string;
    name: string;
    description: string;
    niches: string[];
    is_premium: boolean;
    is_public: boolean;
    preview_image: string;
    blocks: Block[];
    sort_order: number;
}

const DEFAULT_TEMPLATE: TemplateData = {
    name: '',
    description: '',
    niches: [],
    is_premium: false,
    is_public: false,
    preview_image: '',
    blocks: [],
    sort_order: 0,
};

export default function AdminTemplateEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(!!id);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<TemplateData>(DEFAULT_TEMPLATE);
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);

    useEffect(() => {
        if (id && id !== 'new') {
            fetchTemplate(id);
        }
    }, [id]);

    async function fetchTemplate(templateId: string) {
        try {
            const { data, error } = await (supabase as any)
                .from('page_templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (error) throw error;
            if (data) {
                const d = data as any;
                setData({
                    id: d.id,
                    name: d.name,
                    description: d.description || '',
                    niches: d.niches || [],
                    is_premium: d.is_premium,
                    is_public: d.is_public,
                    preview_image: d.preview_image || '',
                    blocks: (d.blocks as Block[]) || [],
                    sort_order: d.sort_order,
                });
            }
        } catch (error) {
            console.error('Error fetching template:', error);
            toast.error(t('admin.errorFetchingTemplate', 'Error loading template'));
            navigate('/admin'); // Redirect back on error
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        if (!data.name) {
            toast.error(t('admin.nameRequired', 'Name is required'));
            return;
        }

        setSaving(true);
        try {
            const payload = {
                name: data.name,
                description: data.description,
                niches: data.niches,
                is_premium: data.is_premium,
                is_public: data.is_public,
                preview_image: data.preview_image,
                blocks: data.blocks,
                sort_order: data.sort_order,
                updated_at: new Date().toISOString(),
            };

            if (id && id !== 'new') {
                const { error } = await (supabase as any)
                    .from('page_templates')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                toast.success(t('admin.templateUpdated', 'Template updated'));
            } else {
                const { error } = await (supabase as any)
                    .from('page_templates')
                    .insert(payload);
                if (error) throw error;
                toast.success(t('admin.templateCreated', 'Template created'));
                navigate('/admin');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error(t('admin.errorSavingTemplate', 'Error saving template'));
        } finally {
            setSaving(false);
        }
    };

    // Block Management Handlers
    const handleInsertBlock = useCallback((type: string, position: number) => {
        const newBlock = createBlock(type);
        if (!newBlock) return;

        setData(prev => {
            const newBlocks = [...prev.blocks];
            newBlocks.splice(position, 0, newBlock);
            return { ...prev, blocks: newBlocks };
        });

        // Auto-open editor for new block
        setEditingBlock(newBlock);
    }, []);

    const handleUpdateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
        setData(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === blockId ? { ...b, ...updates } as Block : b)
        }));
    }, []);

    const handleDeleteBlock = useCallback((blockId: string) => {
        setData(prev => ({
            ...prev,
            blocks: prev.blocks.filter(b => b.id !== blockId)
        }));
    }, []);

    const handleReorderBlocks = useCallback((reorderedBlocks: Block[]) => {
        setData(prev => ({ ...prev, blocks: reorderedBlocks }));
    }, []);

    const handleSaveBlockContent = useCallback((updatedBlock: Block) => {
        handleUpdateBlock(updatedBlock.id, updatedBlock);
        setEditingBlock(null);
    }, [handleUpdateBlock]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-lg font-bold">
                        {id === 'new' ? t('admin.newTemplate', 'New Template') : t('admin.editTemplate', 'Edit Template')}
                    </h1>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    {t('admin.save', 'Save')}
                </Button>
            </div>

            <div className="container mx-auto grid grid-cols-1 gap-8 py-8 lg:grid-cols-12">
                {/* Left Sidebar: Metadata */}
                <div className="lg:col-span-4 space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label>{t('admin.templateName', 'Name')}</Label>
                                <Input
                                    value={data.name}
                                    onChange={e => setData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Creator Portfolio"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('admin.niches', 'Niches')}</Label>
                                <Input
                                    value={data.niches.join(', ')}
                                    onChange={e => setData(prev => ({ ...prev, niches: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                                    placeholder="e.g. fitness, beauty, creator"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('admin.description', 'Description')}</Label>
                                <Textarea
                                    value={data.description}
                                    onChange={e => setData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Short description..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>{t('admin.previewImage', 'Preview Image URL')}</Label>
                                <Input
                                    value={data.preview_image}
                                    onChange={e => setData(prev => ({ ...prev, preview_image: e.target.value }))}
                                    placeholder="https://..."
                                />
                                {data.preview_image && (
                                    <div className="mt-2 aspect-video w-full overflow-hidden rounded-md border bg-muted">
                                        <img src={data.preview_image} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('admin.premium', 'Premium')}</Label>
                                    <div className="text-xs text-muted-foreground">Is this a paid template?</div>
                                </div>
                                <Switch
                                    checked={data.is_premium}
                                    onCheckedChange={checked => setData(prev => ({ ...prev, is_premium: checked }))}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="text-base">{t('admin.public', 'Public')}</Label>
                                    <div className="text-xs text-muted-foreground">Visible in gallery?</div>
                                </div>
                                <Switch
                                    checked={data.is_public}
                                    onCheckedChange={checked => setData(prev => ({ ...prev, is_public: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Main: Grid Editor */}
                <div className="lg:col-span-8">
                    <Card className="min-h-[600px] bg-muted/30">
                        <CardContent className="p-0">
                            <GridEditor
                                blocks={data.blocks}
                                isPremium={true}
                                onInsertBlock={handleInsertBlock}
                                onEditBlock={setEditingBlock}
                                onDeleteBlock={handleDeleteBlock}
                                onUpdateBlock={handleUpdateBlock}
                                onReorderBlocks={handleReorderBlocks}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Block Editor Modal */}
            {editingBlock && (
                <BlockEditorV2
                    block={editingBlock}
                    isOpen={!!editingBlock}
                    onClose={() => setEditingBlock(null)}
                    onSave={handleSaveBlockContent as any}
                    enableAutosave={false}
                />
            )}
        </div>
    );
}
