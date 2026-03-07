import React, { useState } from 'react';
import { useZoneDocuments } from '@/hooks/zones/useZoneDocuments';
import { Button } from '@/components/ui/button';
import { FileText, Plus, FileSignature, Download, Trash, Eye, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoneDocument } from '@/types/zones';
import { ZoneDocumentCreator } from './ZoneDocumentCreator';
import { useZoneContext } from '@/contexts/ZoneContext';
import { ZoneDocumentTemplatesSettings } from './ZoneDocumentTemplatesSettings';

export const ZoneDocumentsScreen = () => {
    const { currentZone, isReadOnly } = useZoneContext();
    const zoneId = currentZone?.id || null;
    const { documents, isLoading, deleteDocument, isDeleting } = useZoneDocuments(zoneId, { isReadOnly });
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            case 'signed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'sent': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'archived': return 'bg-stone-500/10 text-stone-500 border-stone-500/20';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const getStatusTranslations = (status: string) => {
        switch (status) {
            case 'draft': return 'Черновик';
            case 'signed': return 'Подписан';
            case 'sent': return 'Отправлен';
            case 'archived': return 'Архив';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        Документы и ЭДО
                    </h2>
                    <p className="text-white/60 text-sm mt-1">
                        Счета-фактуры, акты, договоры и генерация по шаблонам
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        onClick={() => setIsTemplatesOpen(true)}
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Шаблоны
                    </Button>
                    <Button
                        onClick={() => setIsCreatorOpen(true)}
                        className="bg-primary text-black hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Создать документ
                    </Button>
                </div>
            </div>

            <div className="glass-card border border-white/5 rounded-xl overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full rounded-lg bg-white/5" />
                        ))}
                    </div>
                ) : documents?.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <FileSignature className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Нет документов</h3>
                        <p className="text-white/50 max-w-sm mb-6">
                            Создайте первый документ на основе данных из сделки или контакта, используя шаблоны.
                        </p>
                        <Button onClick={() => setIsCreatorOpen(true)} className="bg-primary text-black">
                            <Plus className="w-4 h-4 mr-2" />
                            Создать документ
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {documents?.map((doc: ZoneDocument) => (
                            <div key={doc.id} className="p-4 hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-white/5 shrink-0 mt-1">
                                        <FileText className="w-5 h-5 text-white/70" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-medium flex items-center gap-2">
                                            {doc.title}
                                            {doc.document_number && (
                                                <span className="text-xs text-white/40 font-mono">#{doc.document_number}</span>
                                            )}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-white/50">
                                            {doc.contact && (
                                                <span>{doc.contact.name} {doc.contact.company ? `(${doc.contact.company})` : ''}</span>
                                            )}
                                            {doc.deal && (
                                                <span className="text-primary/70">Сделка: {doc.deal.title}</span>
                                            )}
                                            <span className="text-white/30 hidden sm:inline">•</span>
                                            <span>{format(new Date(doc.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-start sm:self-auto">
                                    <Badge variant="outline" className={getStatusColor(doc.status)}>
                                        {getStatusTranslations(doc.status)}
                                    </Badge>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white/60 hover:text-white"
                                            title="Просмотр"
                                            disabled={!doc.file_url}
                                            onClick={() => {
                                                if (!doc.file_url) return;
                                                window.open(doc.file_url, '_blank', 'noopener,noreferrer');
                                            }}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white/60 hover:text-primary"
                                            title="Скачать PDF"
                                            disabled={!doc.file_url}
                                            onClick={() => {
                                                if (!doc.file_url) return;
                                                const link = document.createElement('a');
                                                link.href = doc.file_url;
                                                link.download = doc.title || 'document';
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-white/60 hover:text-red-400"
                                            title="Удалить"
                                            onClick={() => {
                                                if (confirm('Вы уверены, что хотите удалить этот документ?')) {
                                                    deleteDocument(doc.id);
                                                }
                                            }}
                                            disabled={isDeleting}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ZoneDocumentCreator
                open={isCreatorOpen}
                onOpenChange={setIsCreatorOpen}
            />
            <ZoneDocumentTemplatesSettings
                open={isTemplatesOpen}
                onOpenChange={setIsTemplatesOpen}
            />
        </div>
    );
};
