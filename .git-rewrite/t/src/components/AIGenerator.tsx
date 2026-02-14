import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Wand2, Crown, Lock } from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useFreemiumLimits } from '@/hooks/useFreemiumLimits';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import type { Block } from '@/types/page';

interface AIGeneratorProps {
  type: 'magic-title' | 'sales-copy' | 'seo' | 'ai-builder';
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: any) => void;
  currentData?: any;
}

export function AIGenerator({ type, isOpen, onClose, onResult, currentData }: AIGeneratorProps) {
  const { t } = useTranslation();
  const { canUseAIPageGeneration, getRemainingAIPageGenerations, incrementAIPageGeneration, isPremium, limits } = useFreemiumLimits();
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState({
    url: '',
    productName: '',
    price: '',
    currency: '$',
    name: '',
    bio: '',
    links: '',
    description: '',
  });

  const isPageGeneration = type === 'ai-builder';
  const canGenerate = !isPageGeneration || canUseAIPageGeneration();
  const remainingGenerations = getRemainingAIPageGenerations();

  const handleGenerate = async () => {
    // Check AI page generation limit for ai-builder
    if (isPageGeneration && !canGenerate) {
      toast.error(t('freemium.aiLimitReached', 'Лимит AI генераций исчерпан'));
      return;
    }

    setLoading(true);
    try {
      let requestBody: any = { type };

      switch (type) {
        case 'magic-title':
          if (!input.url) {
            toast.error(t('toasts.ai.enterUrl'));
            setLoading(false);
            return;
          }
          requestBody.input = { url: input.url };
          break;

        case 'sales-copy':
          if (!input.productName || !input.price) {
            toast.error(t('toasts.ai.enterProduct'));
            setLoading(false);
            return;
          }
          requestBody.input = {
            productName: input.productName,
            price: input.price,
            currency: input.currency,
          };
          break;

        case 'seo':
          requestBody.input = {
            name: input.name || currentData?.name || 'My Page',
            bio: input.bio || currentData?.bio || '',
            links: input.links ? input.links.split(',').map(l => l.trim()) : [],
          };
          break;

        case 'ai-builder':
          if (!input.description) {
            toast.error(t('toasts.ai.describePage'));
            setLoading(false);
            return;
          }
          requestBody.input = { description: input.description };
          break;
      }

      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: requestBody,
      });

      if (error) {
        console.error('AI generation error:', error);
        toast.error(t('toasts.ai.generationError'));
        return;
      }

      // Increment usage counter for page generation
      if (isPageGeneration) {
        incrementAIPageGeneration();
      }

      toast.success(t('toasts.ai.generated'));
      onResult(data.result);
      onClose();
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(t('toasts.ai.generationError'));
    } finally {
      setLoading(false);
    }
  };

  const renderInput = () => {
    switch (type) {
      case 'magic-title':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={input.url}
              onChange={(e) => setInput({ ...input, url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Enter the URL to generate a catchy title
            </p>
          </div>
        );

      case 'sales-copy':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="My Amazing Product"
                value={input.productName}
                onChange={(e) => setInput({ ...input, productName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="99.99"
                  value={input.price}
                  onChange={(e) => setInput({ ...input, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  placeholder="$"
                  value={input.currency}
                  onChange={(e) => setInput({ ...input, currency: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 'seo':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Page Name</Label>
              <Input
                id="name"
                placeholder="My Page"
                value={input.name}
                onChange={(e) => setInput({ ...input, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Page description..."
                value={input.bio}
                onChange={(e) => setInput({ ...input, bio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="links">Links (comma-separated)</Label>
              <Input
                id="links"
                placeholder="Instagram, YouTube, Shop"
                value={input.links}
                onChange={(e) => setInput({ ...input, links: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to use current page data
            </p>
          </div>
        );

      case 'ai-builder':
        return (
          <div className="space-y-3">
            {!canGenerate && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                  <Lock className="h-4 w-4" />
                  {t('freemium.aiLimitReached', 'Лимит AI генераций исчерпан')}
                </div>
                <p className="text-muted-foreground text-xs mb-2">
                  {isPremium 
                    ? t('freemium.aiLimitResetMonthlyPro', 'Лимит обновится в следующем месяце')
                    : t('freemium.upgradeForMoreGenerations', 'Обновите до Premium для 5 генераций в месяц')
                  }
                </p>
                {!isPremium && (
                  <Button size="sm" variant="outline" onClick={openPremiumPurchase} className="w-full">
                    <Crown className="h-3 w-3 mr-1.5 text-amber-500" />
                    {t('freemium.getPremium', 'Получить Premium')}
                  </Button>
                )}
              </div>
            )}
            {canGenerate && !isPremium && (
              <div className="p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                {t('freemium.aiGenerationsRemaining', 'Осталось генераций: {{count}}/{{total}}', { 
                  count: remainingGenerations, 
                  total: limits.maxAIPageGenerationsPerMonth 
                })}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="description">Describe Your Page</Label>
              <Textarea
                id="description"
                placeholder="I'm a fitness coach offering online training programs, workout plans, and nutrition guides. I want to showcase my services and link to my social media."
                value={input.description}
                rows={5}
                onChange={(e) => setInput({ ...input, description: e.target.value })}
                disabled={!canGenerate}
              />
              <p className="text-xs text-muted-foreground">
                Describe your page and AI will create a complete layout with suggested blocks
              </p>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'magic-title': return 'Generate Magic Title';
      case 'sales-copy': return 'Generate Sales Copy';
      case 'seo': return 'Generate SEO Meta Tags';
      case 'ai-builder': return 'AI Page Builder';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'magic-title': return 'Let AI create a catchy, clickable title for your link';
      case 'sales-copy': return 'Generate compelling product descriptions that drive sales';
      case 'seo': return 'Optimize your page for search engines with AI-generated meta tags';
      case 'ai-builder': return 'Build your entire page layout with AI assistance';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <DialogTitle className="text-base sm:text-lg">{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="py-3 sm:py-4">
          {renderInput()}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading} 
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={loading || (isPageGeneration && !canGenerate)} 
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
