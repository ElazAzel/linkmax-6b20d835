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
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { Block } from '@/types/page';
import { createBlock as createBaseBlock } from '@/lib/block-factory';

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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('templates.marketplace', 'Маркетплейс шаблонов')}
          </DialogTitle>
          <DialogDescription>
            {t('templates.marketplaceDesc', 'Шаблоны от сообщества — готовые к использованию')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Main search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('templates.search', 'Поиск шаблонов...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filters row */}
            <div className="flex flex-wrap gap-2">
              {/* Category filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
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
              <div className="relative flex-1 min-w-[180px]">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('templates.searchAuthor', 'Поиск по автору...')}
                  value={authorQuery}
                  onChange={(e) => setAuthorQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Clear filters button */}
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-10"
                >
                  <X className="h-4 w-4 mr-1" />
                  {t('templates.clearFilters', 'Сбросить')}
                </Button>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="popular" className="text-xs sm:text-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                {t('templates.popular', 'Популярные')}
              </TabsTrigger>
              <TabsTrigger value="new" className="text-xs sm:text-sm">
                <Clock className="h-3 w-3 mr-1" />
                {t('templates.new', 'Новые')}
              </TabsTrigger>
              <TabsTrigger value="free" className="text-xs sm:text-sm">
                <Star className="h-3 w-3 mr-1" />
                {t('templates.free', 'Бесплатные')}
              </TabsTrigger>
              <TabsTrigger value="premium" className="text-xs sm:text-sm">
                <ShoppingCart className="h-3 w-3 mr-1" />
                {t('templates.premium', 'Платные')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="h-[50vh]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => handleApply(template)}
                  >
                    {/* Preview */}
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                      {template.preview_url ? (
                        <img 
                          src={template.preview_url} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-6xl opacity-30">📄</div>
                      )}
                      
                      {template.is_for_sale && (
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500">
                          {formatPrice(template.price, template.currency)}
                        </Badge>
                      )}
                      
                      {purchasedTemplates.includes(template.id) && (
                        <Badge className="absolute top-2 left-2 bg-green-500">
                          {t('templates.owned', 'Куплено')}
                        </Badge>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          {t('templates.preview', 'Предпросмотр')}
                        </Button>
                      </div>
                    </div>

                    <div className="p-3">
                      <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2.5em]">
                        {template.description || t('templates.noDescription', 'Без описания')}
                      </p>
                      
                      {/* Author info */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={template.author?.avatar_url || undefined} />
                          <AvatarFallback className="text-[8px]">
                            {getAuthorDisplayName(template.author).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{getAuthorDisplayName(template.author)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <button 
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(template.id);
                            }}
                          >
                            <Heart className="h-3 w-3" />
                            {template.likes_count}
                          </button>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
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

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('common.close', 'Закрыть')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
