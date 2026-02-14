import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Heart, 
  Download, 
  ShoppingCart, 
  Search, 
  TrendingUp,
  Clock,
  Star,
  Loader2,
  Eye,
  User,
  Filter,
  X,
  Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { Block } from '@/types/page';
import { createBlock as createBaseBlock } from '@/lib/block-factory';
import { TemplatePreviewCard } from '@/components/templates/TemplatePreviewCard';

interface Author {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface UserTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  preview_url: string | null;
  blocks: unknown;
  is_public: boolean;
  is_for_sale: boolean;
  price: number;
  currency: string;
  downloads_count: number;
  likes_count: number;
  created_at: string;
  author?: Author;
}

interface TemplateMarketplaceProps {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: (blocks: Block[]) => void;
}

const CATEGORIES = [
  'all',
  'Бизнес',
  'Творчество',
  'Образование',
  'Фитнес',
  'Красота',
  'Музыка',
  'Фото',
  'Блогер',
  'Другое',
];

export const TemplateMarketplace = memo(function TemplateMarketplace({
  open,
  onClose,
  onApplyTemplate,
}: TemplateMarketplaceProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorQuery, setAuthorQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('popular');
  const [purchasedTemplates, setPurchasedTemplates] = useState<string[]>([]);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_templates')
        .select('*')
        .eq('is_public', true);

      if (activeTab === 'popular') {
        query = query.order('likes_count', { ascending: false });
      } else if (activeTab === 'new') {
        query = query.order('created_at', { ascending: false });
      } else if (activeTab === 'free') {
        query = query.eq('is_for_sale', false);
      } else if (activeTab === 'premium') {
        query = query.eq('is_for_sale', true);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      
      const templatesData = (data || []) as unknown as UserTemplate[];
      
      // Fetch author profiles for all templates
      const userIds = [...new Set(templatesData.map(t => t.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_user_profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);
        
        const profilesMap = new Map(
          (profiles || []).map(p => [p.id, p])
        );
        
        templatesData.forEach(template => {
          const profile = profilesMap.get(template.user_id);
          if (profile) {
            template.author = {
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
            };
          }
        });
      }
      
      setTemplates(templatesData);

      // Fetch purchased templates
      if (user) {
        const { data: purchases } = await supabase
          .from('template_purchases')
          .select('template_id')
          .eq('buyer_id', user.id);
        
        setPurchasedTemplates(purchases?.map(p => p.template_id) || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  const handleLike = async (templateId: string) => {
    if (!user) {
      toast.error(t('auth.loginRequired', 'Войдите в аккаунт'));
      return;
    }

    try {
      await supabase.rpc('like_template', { p_template_id: templateId });
      setTemplates(prev => 
        prev.map(t => t.id === templateId ? { ...t, likes_count: t.likes_count + 1 } : t)
      );
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handlePurchase = async (template: UserTemplate) => {
    if (!user) {
      toast.error(t('auth.loginRequired', 'Войдите в аккаунт'));
      return;
    }

    try {
      const { data, error } = await supabase.rpc('purchase_template', { 
        p_template_id: template.id 
      });

      if (error) throw error;

      const result = data as { success?: boolean; already_purchased?: boolean; error?: string } | null;
      if (result?.success) {
        if (result.already_purchased) {
          toast.info(t('templates.alreadyPurchased', 'Вы уже приобрели этот шаблон'));
        } else {
          toast.success(t('templates.purchased', 'Шаблон приобретён!'));
          setPurchasedTemplates(prev => [...prev, template.id]);
        }
        applyTemplate(template);
      } else {
        toast.error(result?.error || t('templates.purchaseError', 'Ошибка покупки'));
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(t('templates.purchaseError', 'Ошибка покупки'));
    }
  };

  const applyTemplate = (template: UserTemplate) => {
    const blocksArray = Array.isArray(template.blocks) ? template.blocks : [];
    const blocks: Block[] = blocksArray.map((blockData: any, index: number) => {
      const baseBlock = createBaseBlock(blockData.type);
      return {
        ...baseBlock,
        ...blockData,
        id: `${blockData.type}-${Date.now()}-${index}`,
      } as Block;
    });

    onApplyTemplate(blocks);
    toast.success(t('templates.applied', 'Шаблон применён!'));
    onClose();
  };

  const handleApply = (template: UserTemplate) => {
    if (template.is_for_sale && !purchasedTemplates.includes(template.id)) {
      handlePurchase(template);
    } else {
      applyTemplate(template);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      // Search by name/description
      const matchesSearch = searchQuery === '' || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category
      const matchesCategory = selectedCategory === 'all' || 
        t.category === selectedCategory;
      
      // Search by author
      const matchesAuthor = authorQuery === '' || 
        t.author?.username?.toLowerCase().includes(authorQuery.toLowerCase()) ||
        t.author?.display_name?.toLowerCase().includes(authorQuery.toLowerCase());
      
      return matchesSearch && matchesCategory && matchesAuthor;
    });
  }, [templates, searchQuery, selectedCategory, authorQuery]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const hasActiveFilters = selectedCategory !== 'all' || authorQuery !== '';

  const clearFilters = () => {
    setSelectedCategory('all');
    setAuthorQuery('');
    setSearchQuery('');
  };

  const getAuthorDisplayName = (author?: Author) => {
    if (!author) return t('templates.unknownAuthor', 'Неизвестный автор');
    return author.display_name || author.username || t('templates.unknownAuthor', 'Неизвестный автор');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('templates.marketplace', 'Маркетплейс шаблонов')}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {t('templates.marketplaceDesc', 'Шаблоны от сообщества — готовые к использованию')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 px-3 sm:px-6">
          {/* Search and Filters */}
          <div className="space-y-2 sm:space-y-3">
            {/* Main search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('templates.search', 'Поиск шаблонов...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 sm:h-10 text-sm"
              />
            </div>
            
            {/* Filters row */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {/* Category filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[130px] sm:w-[160px] h-9 sm:h-10 text-xs sm:text-sm">
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <SelectValue placeholder={t('templates.category', 'Категория')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('templates.allCategories', 'Все категории')}
                  </SelectItem>
                  {CATEGORIES.filter(c => c !== 'all').map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Author search */}
              <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder={t('templates.searchAuthor', 'По автору...')}
                  value={authorQuery}
                  onChange={(e) => setAuthorQuery(e.target.value)}
                  className="pl-8 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
              
              {/* Clear filters button */}
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                  <span className="hidden sm:inline">{t('templates.clearFilters', 'Сбросить')}</span>
                  <span className="sm:hidden">×</span>
                </Button>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 h-8 sm:h-10">
              <TabsTrigger value="popular" className="text-[10px] sm:text-sm px-1 sm:px-3">
                <TrendingUp className="h-3 w-3 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">{t('templates.popular', 'Популярные')}</span>
                <span className="xs:hidden">🔥</span>
              </TabsTrigger>
              <TabsTrigger value="new" className="text-[10px] sm:text-sm px-1 sm:px-3">
                <Clock className="h-3 w-3 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">{t('templates.new', 'Новые')}</span>
                <span className="xs:hidden">🆕</span>
              </TabsTrigger>
              <TabsTrigger value="free" className="text-[10px] sm:text-sm px-1 sm:px-3">
                <Star className="h-3 w-3 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">{t('templates.free', 'Бесплатные')}</span>
                <span className="xs:hidden">✨</span>
              </TabsTrigger>
              <TabsTrigger value="premium" className="text-[10px] sm:text-sm px-1 sm:px-3">
                <ShoppingCart className="h-3 w-3 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">{t('templates.premium', 'Платные')}</span>
                <span className="xs:hidden">💎</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="h-[45vh] sm:h-[50vh]">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                <p>{t('templates.noTemplates', 'Шаблоны не найдены')}</p>
                {hasActiveFilters && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    {t('templates.clearFilters', 'Сбросить фильтры')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 p-1">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => handleApply(template)}
                  >
                    {/* Preview - Use TemplatePreviewCard or fallback to image */}
                    <div className="aspect-[4/5] relative overflow-hidden">
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
                      
                      {/* Price badge */}
                      {template.is_for_sale && (
                        <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] sm:text-xs px-1.5 sm:px-2 shadow-lg">
                          {formatPrice(template.price, template.currency)}
                        </Badge>
                      )}
                      
                      {/* Block count badge for templates with preview images */}
                      {template.preview_url && Array.isArray(template.blocks) && (
                        <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2">
                          <Badge variant="secondary" className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 bg-background/80 backdrop-blur-sm">
                            <Layers className="h-2 w-2 sm:h-2.5 sm:w-2.5 mr-0.5" />
                            {(template.blocks as any[]).length}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Purchased badge */}
                      {purchasedTemplates.includes(template.id) && (
                        <Badge className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-green-500 text-[9px] sm:text-xs px-1 sm:px-2">
                          ✓
                        </Badge>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <Button variant="secondary" size="sm" className="text-xs sm:text-sm w-full max-w-[120px]">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">{t('templates.apply', 'Применить')}</span>
                          <span className="sm:hidden">👁</span>
                        </Button>
                        
                        {/* Quick stats on hover */}
                        <div className="flex items-center gap-2 text-white/80 text-[10px] sm:text-xs">
                          <span className="flex items-center gap-0.5">
                            <Heart className="h-2.5 w-2.5" />
                            {template.likes_count}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Download className="h-2.5 w-2.5" />
                            {template.downloads_count}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 sm:p-3">
                      <h4 className="font-semibold text-[11px] sm:text-sm truncate">{template.name}</h4>
                      <p className="text-[9px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5 sm:mt-1 min-h-[2em] sm:min-h-[2.5em]">
                        {template.description || t('templates.noDescription', 'Без описания')}
                      </p>
                      
                      {/* Author info - hidden on very small screens */}
                      <div className="hidden xs:flex items-center gap-2 mt-1.5 sm:mt-2 text-[9px] sm:text-xs text-muted-foreground">
                        <Avatar className="h-3 w-3 sm:h-4 sm:w-4">
                          <AvatarImage src={template.author?.avatar_url || undefined} />
                          <AvatarFallback className="text-[6px] sm:text-[8px]">
                            {getAuthorDisplayName(template.author).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{getAuthorDisplayName(template.author)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1.5 sm:mt-3">
                        <Badge variant="secondary" className="text-[8px] sm:text-xs px-1 sm:px-2">
                          {template.category}
                        </Badge>
                        
                        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-xs text-muted-foreground">
                          <button 
                            className="flex items-center gap-0.5 sm:gap-1 hover:text-red-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(template.id);
                            }}
                          >
                            <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {template.likes_count}
                          </button>
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {template.downloads_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end p-3 sm:p-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-sm">
            {t('common.close', 'Закрыть')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
