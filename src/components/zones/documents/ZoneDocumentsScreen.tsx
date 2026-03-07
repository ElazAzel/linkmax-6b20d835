import React, { useState, useMemo } from 'react';
import { useZoneDocuments } from '@/hooks/zones/useZoneDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, FileSignature, Download, Trash, Eye, Settings, Search, Filter, MoreHorizontal, Calendar, User, Briefcase, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoneDocument, DocumentStatus } from '@/types/zones';
import { ZoneDocumentCreator } from './ZoneDocumentCreator';
import { useZoneContext } from '@/contexts/ZoneContext';
import { ZoneDocumentTemplatesSettings } from './ZoneDocumentTemplatesSettings';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type StatusFilter = 'all' | DocumentStatus;

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
    draft: { label: 'Черновик', color: 'bg-muted/50 text-muted-foreground border-border', dotColor: 'bg-muted-foreground' },
    sent: { label: 'Отправлен', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dotColor: 'bg-blue-400' },
    signed: { label: 'Подписан', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dotColor: 'bg-emerald-400' },
    cancelled: { label: 'Отменён', color: 'bg-destructive/10 text-destructive border-destructive/20', dotColor: 'bg-destructive' },
    archived: { label: 'Архив', color: 'bg-muted/30 text-muted-foreground/70 border-border/50', dotColor: 'bg-muted-foreground/50' },
};

const FILTER_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'draft', label: 'Черновики' },
    { value: 'sent', label: 'Отправленные' },
    { value: 'signed', label: 'Подписанные' },
    { value: 'cancelled', label: 'Отменённые' },
];

export const ZoneDocumentsScreen = () => {
    const { currentZone, isReadOnly } = useZoneContext();
    const zoneId = currentZone?.id || null;
    const { documents, isLoading, deleteDocument, isDeleting } = useZoneDocuments(zoneId, { isReadOnly });
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const filteredDocuments = useMemo(() => {
        if (!documents) return [];
        return documents.filter(doc => {
            const matchesSearch = !searchQuery ||
                doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.document_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.deal?.title?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [documents, searchQuery, statusFilter]);

    const statusCounts = useMemo(() => {
        if (!documents) return {};
        const counts: Record<string, number> = { all: documents.length };
        documents.forEach(doc => {
            counts[doc.status] = (counts[doc.status] || 0) + 1;
        });
        return counts;
    }, [documents]);

    const getStatus = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.draft;

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary/10">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            Документы
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1.5 ml-[44px]">
                            Управление документами, шаблонами и электронным документооборотом
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-border bg-card hover:bg-accent text-foreground"
                            onClick={() => setIsTemplatesOpen(true)}
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Шаблоны
                        </Button>
                        {!isReadOnly && (
                            <Button
                                size="sm"
                                onClick={() => setIsCreatorOpen(true)}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Новый документ
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Поиск по названию, номеру, контакту или сделке..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        {FILTER_TABS.map(tab => {
                            const count = statusCounts[tab.value] || 0;
                            const isActive = statusFilter === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    onClick={() => setStatusFilter(tab.value)}
                                    className={`
                                        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                                        ${isActive
                                            ? 'bg-primary/15 text-primary border border-primary/30'
                                            : 'bg-card text-muted-foreground border border-border hover:bg-accent hover:text-foreground'
                                        }
                                    `}
                                >
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`
                                            px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none
                                            ${isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                                        `}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-3">
                                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-[60%]" />
                                        <Skeleton className="h-3 w-[40%]" />
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <FileSignature className="w-8 h-8 text-primary" />
                            </div>
                            {documents?.length === 0 ? (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground mb-1.5">Нет документов</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mb-6">
                                        Создайте первый документ на основе шаблона. Привяжите его к сделке или контакту для автозаполнения.
                                    </p>
                                    {!isReadOnly && (
                                        <Button onClick={() => setIsCreatorOpen(true)} className="bg-primary text-primary-foreground">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Создать документ
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground mb-1.5">Ничего не найдено</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mb-4">
                                        Попробуйте изменить параметры поиска или фильтра.
                                    </p>
                                    <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                                        Сбросить фильтры
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredDocuments.map((doc: ZoneDocument) => {
                                const status = getStatus(doc.status);
                                return (
                                    <div
                                        key={doc.id}
                                        className="group p-4 hover:bg-accent/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                                    >
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div className="p-2.5 rounded-xl bg-muted/50 shrink-0 mt-0.5 group-hover:bg-primary/10 transition-colors">
                                                <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-foreground font-medium text-sm truncate">
                                                        {doc.title}
                                                    </h4>
                                                    {doc.document_number && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                                                            <Hash className="w-3 h-3" />
                                                            {doc.document_number}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                                    {doc.contact && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                            <User className="w-3 h-3" />
                                                            {doc.contact.name}
                                                            {doc.contact.company ? ` · ${doc.contact.company}` : ''}
                                                        </span>
                                                    )}
                                                    {doc.deal && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-primary/70">
                                                            <Briefcase className="w-3 h-3" />
                                                            {doc.deal.title}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(doc.created_at), 'd MMM yyyy', { locale: ru })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                            <Badge variant="outline" className={`${status.color} text-[11px] gap-1.5`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                                                {status.label}
                                            </Badge>

                                            {/* Desktop actions */}
                                            <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {doc.file_url && (
                                                    <>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => window.open(doc.file_url!, '_blank', 'noopener,noreferrer')}
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="bottom">Просмотр</TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = doc.file_url!;
                                                                        link.download = doc.title || 'document';
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                    }}
                                                                >
                                                                    <Download className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="bottom">Скачать</TooltipContent>
                                                        </Tooltip>
                                                    </>
                                                )}
                                                {!isReadOnly && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() => {
                                                                    if (confirm('Вы уверены, что хотите удалить этот документ?')) {
                                                                        deleteDocument(doc.id);
                                                                    }
                                                                }}
                                                                disabled={isDeleting}
                                                            >
                                                                <Trash className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">Удалить</TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>

                                            {/* Mobile dropdown */}
                                            <div className="sm:hidden">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-popover border-border">
                                                        {doc.file_url && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => window.open(doc.file_url!, '_blank')}>
                                                                    <Eye className="w-4 h-4 mr-2" /> Просмотр
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    const link = document.createElement('a');
                                                                    link.href = doc.file_url!;
                                                                    link.download = doc.title || 'document';
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    document.body.removeChild(link);
                                                                }}>
                                                                    <Download className="w-4 h-4 mr-2" /> Скачать
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        {!isReadOnly && (
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => {
                                                                    if (confirm('Удалить документ?')) deleteDocument(doc.id);
                                                                }}
                                                            >
                                                                <Trash className="w-4 h-4 mr-2" /> Удалить
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Summary footer */}
                {!isLoading && documents && documents.length > 0 && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>
                            {filteredDocuments.length === documents.length
                                ? `Всего: ${documents.length}`
                                : `Показано ${filteredDocuments.length} из ${documents.length}`
                            }
                        </span>
                    </div>
                )}

                <ZoneDocumentCreator open={isCreatorOpen} onOpenChange={setIsCreatorOpen} />
                <ZoneDocumentTemplatesSettings open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen} />
            </div>
        </TooltipProvider>
    );
};
