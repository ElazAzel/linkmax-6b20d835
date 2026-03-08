/**
 * ZoneDocumentGenerator - Dialog for generating documents from templates
 * with variable substitution and PDF export
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useZoneDocuments } from '@/hooks/zones/useZoneDocuments';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneContext } from '@/contexts/ZoneContext';
import { 
  FileText, Download, Eye, Loader2, AlertTriangle, CheckCircle2, 
  User, Briefcase, Copy, Info, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { ZoneDocument, ZoneDocumentTemplate } from '@/types/zones';
import {
  buildDocumentVariables,
  renderTemplate,
  findUnreplacedVariables,
  generatePreviewHTML,
  downloadPDF,
  AVAILABLE_VARIABLES,
  DocumentVariables
} from '@/lib/utils/document-generator';

interface ZoneDocumentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ZoneDocument | null;
  onGenerated?: () => void;
}

export const ZoneDocumentGenerator = ({ 
  open, 
  onOpenChange, 
  document,
  onGenerated 
}: ZoneDocumentGeneratorProps) => {
  const { t } = useTranslation();
  const { currentZone } = useZoneContext();
  const zoneId = currentZone?.id || null;
  
  const { templates, updateDocumentStatus } = useZoneDocuments(zoneId);
  const { deals } = useZoneDeals(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'variables'>('preview');
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  
  // Get linked contact and deal
  const linkedContact = useMemo(() => {
    if (!document?.contact_id || !contacts) return null;
    return contacts.find(c => c.id === document.contact_id) || document.contact || null;
  }, [document, contacts]);
  
  const linkedDeal = useMemo(() => {
    if (!document?.deal_id || !deals) return null;
    return deals.find(d => d.id === document.deal_id) || document.deal || null;
  }, [document, deals]);
  
  // Get template
  const template = useMemo(() => {
    if (!document?.template_id || !templates) return null;
    return templates.find(t => t.id === document.template_id) || document.template || null;
  }, [document, templates]);
  
  // Build variables
  const variables = useMemo<DocumentVariables>(() => {
    const baseVars = buildDocumentVariables(
      linkedContact,
      linkedDeal,
      document?.document_number
    );
    return { ...baseVars, ...customVariables };
  }, [linkedContact, linkedDeal, document, customVariables]);
  
  // Rendered content
  const renderedContent = useMemo(() => {
    if (!template?.content_html) return '';
    return renderTemplate(template.content_html, variables);
  }, [template, variables]);
  
  // Check for unreplaced variables
  const unreplacedVars = useMemo(() => {
    return findUnreplacedVariables(renderedContent);
  }, [renderedContent]);
  
  // Preview HTML with highlighting
  const previewHTML = useMemo(() => {
    if (!template?.content_html) return '';
    return generatePreviewHTML(template.content_html, variables, true);
  }, [template, variables]);
  
  // Reset on open
  useEffect(() => {
    if (open) {
      setCustomVariables({});
      setActiveTab('preview');
    }
  }, [open]);
  
  const handleGenerate = async () => {
    if (!document || !template) return;
    
    setIsGenerating(true);
    try {
      const filename = `${document.title || 'document'}.pdf`;
      await downloadPDF(renderedContent, filename, {
        title: document.title || 'Document',
        pageSize: 'a4'
      });
      
      // Update document status to 'sent' if it was draft
      if (document.status === 'draft') {
        await updateDocumentStatus({ id: document.id, status: 'sent' });
      }
      
      toast.success(t('zones.documents.generated', 'Документ сгенерирован'));
      onGenerated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error(t('zones.documents.generateError', 'Ошибка генерации PDF'));
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopyVariable = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    toast.success(t('common.copied', 'Скопировано'));
  };
  
  if (!document || !template) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 bg-background border-border">
        <DialogHeader className="p-6 pb-2 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            {t('zones.documents.generateDocument', 'Генерация документа')}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {document.title} • {template.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4 mb-2 bg-muted/50">
              <TabsTrigger value="preview" className="data-[state=active]:bg-background min-h-10">
                <Eye className="w-4 h-4 mr-2" />
                {t('zones.documents.preview', 'Предпросмотр')}
              </TabsTrigger>
              <TabsTrigger value="variables" className="data-[state=active]:bg-background min-h-10">
                <Info className="w-4 h-4 mr-2" />
                {t('zones.documents.variables', 'Переменные')}
                {unreplacedVars.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                    {unreplacedVars.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">
                  {/* Context info */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {linkedContact && (
                      <Badge variant="outline" className="gap-1.5 py-1 px-3">
                        <User className="w-3.5 h-3.5" />
                        {linkedContact.name}
                      </Badge>
                    )}
                    {linkedDeal && (
                      <Badge variant="outline" className="gap-1.5 py-1 px-3 border-primary/30 text-primary">
                        <Briefcase className="w-3.5 h-3.5" />
                        {linkedDeal.title}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Warning for unreplaced variables */}
                  {unreplacedVars.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-600">
                          {t('zones.documents.unreplacedWarning', 'Некоторые переменные не заполнены')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {unreplacedVars.map(v => `{{${v}}}`).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Document preview */}
                  <div 
                    className="bg-white text-black p-8 rounded-lg shadow-lg border prose prose-sm max-w-none"
                    style={{ fontFamily: 'Times New Roman, serif' }}
                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="variables" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6 space-y-6">
                  {/* Available Variables Reference */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {t('zones.documents.availableVariables', 'Доступные переменные')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AVAILABLE_VARIABLES.map(v => {
                        const value = variables[v.key];
                        const isFilled = !!value;
                        return (
                          <div 
                            key={v.key}
                            className={`
                              p-3 rounded-lg border transition-colors flex items-center justify-between gap-2
                              ${isFilled 
                                ? 'bg-emerald-500/5 border-emerald-500/20' 
                                : 'bg-muted/30 border-border'
                              }
                            `}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                                  {`{{${v.key}}}`}
                                </code>
                                {isFilled && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{v.label}</p>
                              {isFilled && (
                                <p className="text-xs text-foreground font-medium mt-0.5 truncate">{value}</p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleCopyVariable(v.key)}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Custom Variables */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      {t('zones.documents.customVariables', 'Пользовательские значения')}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      {t('zones.documents.customVariablesHint', 'Заполните недостающие переменные вручную')}
                    </p>
                    
                    {unreplacedVars.length > 0 ? (
                      <div className="space-y-3">
                        {unreplacedVars.map(varKey => (
                          <div key={varKey} className="flex items-center gap-3">
                            <code className="text-xs font-mono bg-amber-500/10 text-amber-600 px-2 py-1 rounded shrink-0">
                              {`{{${varKey}}}`}
                            </code>
                            <Input
                              value={customVariables[varKey] || ''}
                              onChange={(e) => setCustomVariables(prev => ({ 
                                ...prev, 
                                [varKey]: e.target.value 
                              }))}
                              placeholder={t('zones.documents.enterValue', 'Введите значение...')}
                              className="flex-1 h-9 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                        <p className="text-sm">
                          {t('zones.documents.allVariablesFilled', 'Все переменные заполнены')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel', 'Отмена')}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t('zones.documents.downloadPDF', 'Скачать PDF')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
