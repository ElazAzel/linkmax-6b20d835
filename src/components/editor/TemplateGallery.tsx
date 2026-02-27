import { memo, useState } from 'react';
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
import Check from 'lucide-react/dist/esm/icons/check';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Store from 'lucide-react/dist/esm/icons/store';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useTranslation } from 'react-i18next';
import type { Block } from '@/types/page';
import { TemplatePersonalization } from './TemplatePersonalization';
import { TemplateMarketplace } from './TemplateMarketplace';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TEMPLATE_CATEGORY_KEYS,
  type TemplateCategoryKey,
  getTemplateCategoryLabel,
  normalizeTemplateCategory,
} from '@/lib/templateCategories';
import { useTemplates } from '@/hooks/useTemplates';
import {
  HARDCODED_TEMPLATES,
  MATCH_KEYWORDS,
  type Template,
  createTemplateBlock
} from '@/data/templates';

const CATEGORIES: TemplateCategoryKey[] = [...TEMPLATE_CATEGORY_KEYS];

interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (blocks: Block[]) => void;
}

export const TemplateGallery = memo(function TemplateGallery({
  open,
  onClose,
  onSelect,
}: TemplateGalleryProps) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategoryKey>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [smartPrompt, setSmartPrompt] = useState('');

  const handleSmartMatch = async () => {
    if (!smartPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // 1. Find best template
      const words = smartPrompt.toLowerCase().split(/\s+/);
      let bestTemplateId = 'personal';

      for (const word of words) {
        if (MATCH_KEYWORDS[word]) {
          bestTemplateId = MATCH_KEYWORDS[word];
          break;
        }
      }

      // Default to business/agency if description implies business but no specific keyword matches
      if (bestTemplateId === 'personal' && (smartPrompt.toLowerCase().includes('business') || smartPrompt.toLowerCase().includes('company'))) {
        bestTemplateId = 'agency';
      }

      const template = templates.find(t => t.id === bestTemplateId) || templates[0];

      // 2. Call AI to fill content
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          type: 'template-filler',
          input: {
            prompt: smartPrompt,
            templateBlocks: template.blocks
          }
        }
      });

      if (error) throw error;

      // 3. Apply overrides
      const aiBlocks = data.result.blocks || data.result;
      const finalBlocks = aiBlocks.map((b: any) => createTemplateBlock(b.type, b.overrides));

      onSelect(finalBlocks);
      onClose();
      toast.success(t('templates.generated', 'Template generated successfully!'));

    } catch (error) {
      console.error(error);
      toast.error(t('templates.error', 'Generation failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelect = (template: Template) => {
    // Generate blocks with full structure from block-factory + overrides
    const fullBlocks = template.blocks.map((blockDef) =>
      createTemplateBlock(blockDef.type, blockDef.overrides || {})
    );
    onSelect(fullBlocks);
    setCopiedId(template.id);
    setTimeout(() => {
      setCopiedId(null);
      onClose();
    }, 500);
  };

  // Fetch templates from DB
  const { data: dbTemplates, isLoading } = useTemplates();

  // Use DB templates if available, otherwise fallback to hardcoded
  // This ensures the gallery is never empty during migration
  const templates = (dbTemplates && dbTemplates.length > 0) ? dbTemplates : HARDCODED_TEMPLATES;

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => normalizeTemplateCategory(t.category) === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-3 sm:p-6 pb-0">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-base sm:text-xl flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="truncate">{t('templates.title', 'Галерея шаблонов')}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('templates.description', 'Выберите шаблон для вашей страницы — AI персонализирует под ваш бизнес')}
            </DialogDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMarketplaceOpen(true)}
              className="gap-1 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Store className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('templates.marketplace', 'Маркетплейс')}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Smart Match Input */}
        <div className="px-3 sm:px-6 py-4 bg-muted/20 border-b space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="smart-prompt" className="text-sm font-medium flex items-center gap-1.5">
              <Wand2 className="h-3.5 w-3.5 text-primary" />
              {t('templates.smartMatch.title', 'AI Smart Auto-Fill')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="smart-prompt"
                placeholder={t('templates.smartMatch.placeholder', 'Example: I am a fitness coach in Almaty...')}
                value={smartPrompt}
                onChange={(e) => setSmartPrompt(e.target.value)}
                className="flex-1 bg-background text-sm h-9"
                onKeyDown={(e) => e.key === 'Enter' && handleSmartMatch()}
              />
              <Button
                onClick={handleSmartMatch}
                disabled={isGenerating || !smartPrompt.trim()}
                size="sm"
                className="h-9 px-4 shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    <span className="hidden xs:inline">{t('templates.smartMatch.generating', 'Generating...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                    {t('templates.smartMatch.button', 'Generate')}
                  </>
                )}
              </Button>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t('templates.smartMatch.hint', 'Describe who you are, and AI will pick the best template and fill it with content.')}
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-3 sm:px-6 py-2 border-b bg-background/50 overflow-x-auto">
          <div className="flex gap-1.5 min-w-max py-1">
            <Button
              key="all"
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="h-7 text-xs px-3"
            >
              {t('templates.categories.all', 'Все')}
            </Button>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="h-7 text-xs px-3 whitespace-nowrap"
              >
                {getTemplateCategoryLabel(t, cat)}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 p-3 sm:p-6 pb-20 sm:pb-6 overflow-y-auto">
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group relative flex flex-col overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg dark:bg-zinc-900/50"
              >
                <div className="relative aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-105 transition-transform duration-300">
                  {template.preview}
                  {template.isPremium && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-[10px]">
                      PREMIUM
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col flex-1 p-3 sm:p-4">
                  <h3 className="font-bold text-sm sm:text-base leading-tight mb-1">{template.name}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-4 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-auto flex items-center gap-2">
                    <Button
                      className="flex-1 text-[10px] sm:text-xs h-8 sm:h-9"
                      onClick={() => handleSelect(template)}
                    >
                      {copiedId === template.id ? (
                        <>
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                          {t('templates.chosen', 'Выбрано')}
                        </>
                      ) : (
                        t('templates.use', 'Выбрать')
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setPersonalizationOpen(true);
                      }}
                      title={t('templates.personalize', 'Personalize')}
                    >
                      <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {selectedTemplate && (
          <TemplatePersonalization
            open={personalizationOpen}
            onClose={() => setPersonalizationOpen(false)}
            template={selectedTemplate}
            onSelect={(blocks) => {
              onSelect(blocks);
              onClose();
            }}
          />
        )}

        <TemplateMarketplace
          open={marketplaceOpen}
          onClose={() => setMarketplaceOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
});
