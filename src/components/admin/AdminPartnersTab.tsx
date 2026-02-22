import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    ExternalLink,
    Image as ImageIcon,
    GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';

interface Partner {
    id: string;
    name: string;
    logo_url: string;
    website_url: string | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PartnerFormData {
    name: string;
    logo_url: string;
    website_url: string;
    sort_order: number;
    is_active: boolean;
}

const emptyFormData: PartnerFormData = {
    name: '',
    logo_url: '',
    website_url: '',
    sort_order: 0,
    is_active: true,
};

export function AdminPartnersTab() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [formData, setFormData] = useState<PartnerFormData>(emptyFormData);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Fetch partners
    const { data: partners, isLoading } = useQuery({
        queryKey: ['admin-partners'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('partners')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return (data || []) as Partner[];
        },
    });

    // Create partner
    const createMutation = useMutation({
        mutationFn: async (data: PartnerFormData) => {
            const { error } = await supabase.from('partners').insert([data]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
            queryClient.invalidateQueries({ queryKey: ['landing-partners'] });
            toast.success(t('admin.partners.created', 'Партнёр добавлен'));
            handleCloseDialog();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Update partner
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: PartnerFormData }) => {
            const { error } = await supabase.from('partners').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
            queryClient.invalidateQueries({ queryKey: ['landing-partners'] });
            toast.success(t('admin.partners.updated', 'Партнёр обновлён'));
            handleCloseDialog();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // Delete partner
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('partners').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
            queryClient.invalidateQueries({ queryKey: ['landing-partners'] });
            toast.success(t('admin.partners.deleted', 'Партнёр удалён'));
            setDeleteConfirmId(null);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const handleOpenCreate = () => {
        setEditingPartner(null);
        setFormData({
            ...emptyFormData,
            sort_order: (partners?.length ?? 0) + 1,
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (partner: Partner) => {
        setEditingPartner(partner);
        setFormData({
            name: partner.name,
            logo_url: partner.logo_url,
            website_url: partner.website_url ?? '',
            sort_order: partner.sort_order,
            is_active: partner.is_active,
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingPartner(null);
        setFormData(emptyFormData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.logo_url.trim()) {
            toast.error(t('admin.partners.validation', 'Заполните название и URL логотипа'));
            return;
        }

        if (editingPartner) {
            updateMutation.mutate({ id: editingPartner.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">{t('admin.partners.title', 'Партнёры')}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t('admin.partners.description', 'Управление логотипами партнёров на главной странице')}
                    </p>
                </div>
                <Button onClick={handleOpenCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.partners.add', 'Добавить')}
                </Button>
            </div>

            {/* Partners Table */}
            <Card>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : !partners?.length ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{t('admin.partners.empty', 'Нет партнёров')}</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead className="w-20">{t('admin.partners.logo', 'Лого')}</TableHead>
                                <TableHead>{t('admin.partners.name', 'Название')}</TableHead>
                                <TableHead>{t('admin.partners.website', 'Сайт')}</TableHead>
                                <TableHead className="w-24">{t('admin.partners.status', 'Статус')}</TableHead>
                                <TableHead className="w-24 text-right">{t('admin.actions', 'Действия')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {partners.map((partner) => (
                                <TableRow key={partner.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <GripVertical className="h-4 w-4" />
                                            {partner.sort_order}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <img
                                            src={partner.logo_url}
                                            alt={partner.name}
                                            className="h-8 w-auto max-w-16 object-contain rounded"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x32?text=Logo';
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{partner.name}</TableCell>
                                    <TableCell>
                                        {partner.website_url ? (
                                            <a
                                                href={partner.website_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                {new URL(partner.website_url).hostname}
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                                            {partner.is_active
                                                ? t('admin.partners.active', 'Активен')
                                                : t('admin.partners.inactive', 'Скрыт')
                                            }
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenEdit(partner)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeleteConfirmId(partner.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPartner
                                ? t('admin.partners.edit', 'Редактировать партнёра')
                                : t('admin.partners.create', 'Добавить партнёра')
                            }
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            {editingPartner
                                ? t('admin.partners.editDescription', 'Измените данные партнёра ниже')
                                : t('admin.partners.createDescription', 'Заполните форму для добавления нового партнёра')
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('admin.partners.nameLabel', 'Название')} *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Acme Corp"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="logo_url">{t('admin.partners.logoUrlLabel', 'URL логотипа')} *</Label>
                            <Input
                                id="logo_url"
                                value={formData.logo_url}
                                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                placeholder="https://example.com/logo.png"
                            />
                            {formData.logo_url && (
                                <div className="p-2 bg-muted rounded-lg">
                                    <img
                                        src={formData.logo_url}
                                        alt="Preview"
                                        className="h-10 w-auto object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website_url">{t('admin.partners.websiteLabel', 'Сайт')}</Label>
                            <Input
                                id="website_url"
                                value={formData.website_url}
                                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sort_order">{t('admin.partners.sortOrderLabel', 'Порядок')}</Label>
                            <Input
                                id="sort_order"
                                type="number"
                                value={formData.sort_order}
                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active">{t('admin.partners.isActiveLabel', 'Показывать на сайте')}</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                {t('common.cancel', 'Отмена')}
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {editingPartner ? t('common.save', 'Сохранить') : t('common.create', 'Создать')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('admin.partners.deleteConfirm', 'Удалить партнёра?')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.partners.deleteWarning', 'Это действие нельзя отменить.')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                            {t('common.cancel', 'Отмена')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t('common.delete', 'Удалить')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
