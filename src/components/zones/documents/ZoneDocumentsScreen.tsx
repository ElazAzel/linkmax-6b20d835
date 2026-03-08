import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneDocuments } from '@/hooks/zones/useZoneDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, FileSignature, Download, Trash, Eye, Settings, Search, Filter, MoreHorizontal, Calendar, User, Briefcase, Hash, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoneDocument, DocumentStatus } from '@/types/zones';
import { ZoneDocumentCreator } from './ZoneDocumentCreator';
import { ZoneDocumentGenerator } from './ZoneDocumentGenerator';
import { useZoneContext } from '@/contexts/ZoneContext';
import { ZoneDocumentTemplatesSettings } from './ZoneDocumentTemplatesSettings';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type StatusFilter = 'all' | DocumentStatus;

const STATUS_KEYS: Record<string, { labelKey: string; defaultLabel: string; color: string; dotColor: string }> = {
    draft: { labelKey: 'zones.documents.status.draft', defaultLabel: 'Draft', color: 'bg-muted/50 text-muted-foreground border-border', dotColor: 'bg-muted-foreground' },
    sent: { labelKey: 'zones.documents.status.sent', defaultLabel: 'Sent', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dotColor: 'bg-blue-400' },
    signed: { labelKey: 'zones.documents.status.signed', defaultLabel: 'Signed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dotColor: 'bg-emerald-400' },
    cancelled: { labelKey: 'zones.documents.status.cancelled', defaultLabel: 'Cancelled', color: 'bg-destructive/10 text-destructive border-destructive/20', dotColor: 'bg-destructive' },
    archived: { labelKey: 'zones.documents.status.archived', defaultLabel: 'Archived', color: 'bg-muted/30 text-muted-foreground/70 border-border/50', dotColor: 'bg-muted-foreground/50' },
};

export const ZoneDocumentsScreen = () => {
    const { t } = useTranslation();
    const { currentZone, isReadOnly } = useZoneContext();
    const zoneId = currentZone?.id || null;
    const { documents, isLoading, deleteDocument, isDeleting } = useZoneDocuments(zoneId, { isReadOnly });
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<ZoneDocument | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const FILTER_TABS: { value: StatusFilter; labelKey: string; defaultLabel: string }[] = [
        { value: 'all', labelKey: 'zones.documents.filter.all', defaultLabel: 'All' },
        { value: 'draft', labelKey: 'zones.documents.filter.drafts', defaultLabel: 'Drafts' },
        { value: 'sent', labelKey: 'zones.documents.filter.sent', defaultLabel: 'Sent' },
        { value: 'signed', labelKey: 'zones.documents.filter.signed', defaultLabel: 'Signed' },
        { value: 'archived', labelKey: 'zones.documents.filter.archived', defaultLabel: 'Archived' },
    ];

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

    const getStatus = (status: string) => {
        const cfg = STATUS_KEYS[status] || STATUS_KEYS.draft;
        return { ...cfg, label: t(cfg.labelKey, cfg.defaultLabel) };
    };

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
                            {t('zones.documents.title', 'Documents')}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1.5 ml-[44px]">
                            {t('zones.documents.subtitle', 'Manage documents, templates and digital workflow')}
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
                            {t('zones.documents.templates', 'Templates')}
                        </Button>
                        {!isReadOnly && (
                            <Button
                                size="sm"
                                onClick={() => setIsCreatorOpen(true)}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('zones.documents.newDocument', 'New document')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t('zones.documents.searchPlaceholder', 'Search by title, number, contact or deal...')}
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
                                    {t(tab.labelKey, tab.defaultLabel)}
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
                                    <h3 className="text-lg font-semibold text-foreground mb-1.5">
                                        {t('zones.documents.empty.title', 'No documents')}
                                    </h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mb-6">
                                        {t('zones.documents.empty.description', 'Create your first document from a template. Link it to a deal or contact for autofill.')}
                                    </p>
                                    {!isReadOnly && (
                                        <Button onClick={() => setIsCreatorOpen(true)} className="bg-primary text-primary-foreground">
                                            <Plus className="w-4 h-4 mr-2" />
                                            {t('zones.documents.createDocument', 'Create document')}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-foreground mb-1.5">
                                        {t('zones.documents.notFound.title', 'Nothing found')}
                                    </h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mb-4">
                                        {t('zones.documents.notFound.description', 'Try adjusting your search or filter parameters.')}
                                    </p>
                                    <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                                        {t('zones.documents.resetFilters', 'Reset filters')}
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
                                                {/* Generate PDF button */}
                                                {doc.template_id && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                                onClick={() => {
                                                                    setSelectedDocument(doc);
                                                                    setIsGeneratorOpen(true);
                                                                }}
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">{t('zones.documents.actions.generate', 'Generate PDF')}</TooltipContent>
                                                    </Tooltip>
                                                )}
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
                                                            <TooltipContent side="bottom">{t('zones.documents.actions.view', 'View')}</TooltipContent>
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
                                                            <TooltipContent side="bottom">{t('zones.documents.actions.download', 'Download')}</TooltipContent>
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
                                                                    if (confirm(t('zones.documents.confirmDelete', 'Are you sure you want to delete this document?'))) {
                                                                        deleteDocument(doc.id);
                                                                    }
                                                                }}
                                                                disabled={isDeleting}
                                                            >
                                                                <Trash className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">{t('zones.documents.actions.delete', 'Delete')}</TooltipContent>
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
                                                                    <Eye className="w-4 h-4 mr-2" /> {t('zones.documents.actions.view', 'View')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => {
                                                                    const link = document.createElement('a');
                                                                    link.href = doc.file_url!;
                                                                    link.download = doc.title || 'document';
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    document.body.removeChild(link);
                                                                }}>
                                                                    <Download className="w-4 h-4 mr-2" /> {t('zones.documents.actions.download', 'Download')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                            </>
                                                        )}
                                                        {!isReadOnly && (
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => {
                                                                    if (confirm(t('zones.documents.confirmDelete', 'Are you sure you want to delete this document?'))) deleteDocument(doc.id);
                                                                }}
                                                            >
                                                                <Trash className="w-4 h-4 mr-2" /> {t('zones.documents.actions.delete', 'Delete')}
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
                                ? t('zones.documents.totalCount', 'Total: {{count}}', { count: documents.length })
                                : t('zones.documents.filteredCount', 'Showing {{shown}} of {{total}}', { shown: filteredDocuments.length, total: documents.length })
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
