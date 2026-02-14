import { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Package,
  ShoppingBag,
  Trash2,
  Download,
  DollarSign,
  Heart,
  Globe,
  Lock,
  Layers,
  Pencil,
} from 'lucide-react';
import type { Block } from '@/types/page';
import { TemplatePreviewCard } from './TemplatePreviewCard';
import { EditTemplateDialog } from './EditTemplateDialog';
import { getTemplateCategoryLabel } from '@/lib/templateCategories';

interface UserTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  preview_url: string | null;
  blocks: Block[];
  is_public: boolean;
  is_for_sale: boolean;
  price: number | null;
  currency: string | null;
  downloads_count: number;
  likes_count: number;
  created_at: string;
}

interface PurchasedTemplate {
  id: string;
  template_id: string;
  purchased_at: string;
  price: number;
  template: UserTemplate;
}

interface MyTemplatesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTemplate: (blocks: Block[]) => void;
  currentBlocks?: Block[];
}

export const MyTemplatesPanel = memo(function MyTemplatesPanel({
  open,
  onOpenChange,
  onApplyTemplate,
  currentBlocks,
}: MyTemplatesPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my');
  const [myTemplates, setMyTemplates] = useState<UserTemplate[]>([]);
  const [purchasedTemplates, setPurchasedTemplates] = useState<PurchasedTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<UserTemplate | null>(null);

  useEffect(() => {
    if (open && user) {
      loadTemplates();
    }
  }, [open, user]);

  const loadTemplates = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load my templates
      const { data: myData, error: myError } = await supabase
        .from('user_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (myError) throw myError;
      setMyTemplates((myData || []).map(t => ({
        ...t,
        blocks: (t.blocks as unknown as Block[]) || [],
      })));

      // Load purchased templates
      const { data: purchasedData, error: purchasedError } = await supabase
        .from('template_purchases')
        .select(`
          id,
          template_id,
          purchased_at,
          price,
          user_templates!template_purchases_template_id_fkey (
            id,
            name,
            description,
            category,
            preview_url,
            blocks,
            is_public,
            is_for_sale,
            price,
            currency,
            downloads_count,
            likes_count,
            created_at
          )
        `)
        .eq('buyer_id', user.id)
        .order('purchased_at', { ascending: false });

      if (purchasedError) throw purchasedError;
      
      setPurchasedTemplates((purchasedData || []).map(p => ({
        id: p.id,
        template_id: p.template_id,
        purchased_at: p.purchased_at,
        price: p.price,
        template: {
          ...(p.user_templates as any),
          blocks: ((p.user_templates as any)?.blocks as Block[]) || [],
        },
      })));
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error(t('templates.loadError', 'Ошибка загрузки шаблонов'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm(t('templates.confirmDelete', 'Удалить этот шаблон?'))) return;
    
    setDeleting(templateId);
    try {
      const { error } = await supabase
        .from('user_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      setMyTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success(t('templates.deleted', 'Шаблон удалён'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('templates.deleteError', 'Ошибка удаления'));
    } finally {
      setDeleting(null);
    }
  };

  const handleApply = (blocks: Block[]) => {
    onApplyTemplate(blocks);
    onOpenChange(false);
    toast.success(t('templates.applied', 'Шаблон применён!'));
  };

  const renderTemplateCard = (template: UserTemplate, isPurchased = false) => (
    <Card key={template.id} className="overflow-hidden group">
      {/* Preview - Use TemplatePreviewCard for visual block layout */}
      <div className="aspect-[4/5] relative">
        {template.preview_url ? (
          <img
            src={template.preview_url}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <TemplatePreviewCard 
            blocks={template.blocks}
            className="w-full h-full"
            showBlockCount
          />
        )}
        
        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 flex-wrap p-2">
          <Button size="sm" onClick={() => handleApply(template.blocks)}>
            <Download className="h-4 w-4 mr-1" />
            {t('templates.apply', 'Применить')}
          </Button>
          {!isPurchased && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTemplate(template);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(template.id)}
                disabled={deleting === template.id}
              >
                {deleting === template.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-sm line-clamp-1">{template.name}</h4>
            <p className="text-xs text-muted-foreground">{getTemplateCategoryLabel(t, template.category)}</p>
          </div>
          {template.is_public ? (
            <Globe className="h-4 w-4 text-green-500 shrink-0" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {template.likes_count}
          </span>
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" />
            {template.downloads_count}
          </span>
          {template.is_for_sale && template.price && (
            <Badge variant="secondary" className="text-xs">
              <DollarSign className="h-3 w-3" />
              {template.price} {template.currency}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('templates.myTemplates', 'Мои шаблоны')}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {t('templates.created', 'Созданные')}
            </TabsTrigger>
            <TabsTrigger value="purchased" className="flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              {t('templates.purchased', 'Купленные')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : myTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('templates.noTemplates', 'У вас пока нет шаблонов')}</p>
                <p className="text-sm mt-1">
                  {t('templates.saveFirst', 'Сохраните страницу как шаблон в настройках')}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="grid grid-cols-2 gap-3 pr-4">
                  {myTemplates.map(template => renderTemplateCard(template))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="purchased" className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : purchasedTemplates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{t('templates.noPurchased', 'Нет купленных шаблонов')}</p>
                <p className="text-sm mt-1">
                  {t('templates.browseMk', 'Загляните в маркетплейс шаблонов')}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="grid grid-cols-2 gap-3 pr-4">
                  {purchasedTemplates.map(p => renderTemplateCard(p.template, true))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Template Dialog */}
        <EditTemplateDialog
          open={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          template={editingTemplate}
          onUpdated={loadTemplates}
          currentBlocks={currentBlocks}
        />
      </SheetContent>
    </Sheet>
  );
});
