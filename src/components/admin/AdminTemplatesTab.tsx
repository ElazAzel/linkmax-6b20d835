import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useAdminTemplates } from '@/hooks/useAdminTemplates';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import { Search, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminTemplatesTab() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { data: templates, isLoading, isFetching, refetch, deleteTemplate, updateTemplateStatus } = useAdminTemplates();
    const [searchQuery, setSearchQuery] = useState('');

    const getDateLocale = () => {
        switch (i18n.language) {
            case 'ru': return ru;
            case 'kk': return kk;
            default: return enUS;
        }
    };

    const filteredTemplates = useMemo(() => {
        if (!templates) return [];
        return templates.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [templates, searchQuery]);

    const handleDelete = async (id: string, name: string) => {
        if (confirm(t('admin.confirmDeleteTemplate', 'Are you sure you want to delete template "{{name}}"?', { name }))) {
            try {
                await deleteTemplate.mutateAsync(id);
                toast.success(t('admin.templateDeleted', 'Template deleted'));
            } catch (error) {
                toast.error(t('admin.errorDeletingTemplate', 'Error deleting template'));
                console.error(error);
            }
        }
    };

    const handleTogglePublic = async (id: string, currentStatus: boolean) => {
        try {
            await updateTemplateStatus.mutateAsync({ id, is_public: !currentStatus });
            toast.success(t('admin.statusUpdated', 'Status updated'));
        } catch (error) {
            toast.error(t('admin.errorUpdatingStatus', 'Error updating status'));
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 flex-1 max-w-md" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('admin.searchTemplates', 'Search templates...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                        {t('admin.refresh', 'Refresh')}
                    </Button>
                    <Button onClick={() => navigate('/admin/templates/new')}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('admin.createTemplate', 'Create Template')}
                    </Button>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('admin.templateName', 'Name')}</TableHead>
                                <TableHead>{t('admin.category', 'Category')}</TableHead>
                                <TableHead>{t('admin.status', 'Status')}</TableHead>
                                <TableHead>{t('admin.created', 'Created')}</TableHead>
                                <TableHead>{t('admin.actions', 'Actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTemplates.map(template => (
                                <TableRow key={template.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                                {template.preview_image ? (
                                                    <img src={template.preview_image} alt={template.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">No img</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{template.name}</p>
                                                {template.is_premium && (
                                                    <Badge variant="secondary" className="mt-1 text-xs bg-amber-100 text-amber-800 border-amber-200">
                                                        Premium
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{template.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={template.is_public}
                                                onCheckedChange={() => handleTogglePublic(template.id, template.is_public)}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {template.is_public ? t('admin.public', 'Public') : t('admin.hidden', 'Hidden')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(template.created_at), 'dd.MM.yyyy', { locale: getDateLocale() })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => navigate(`/admin/templates/${template.id}`)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDelete(template.id, template.name)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTemplates.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {t('admin.noTemplatesFound', 'No templates found')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
