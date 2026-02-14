import { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Block } from '@/types/page';
import { createBlock as createBaseBlock } from '@/lib/block-factory';

interface TemplatePersonalizationProps {
  open: boolean;
  onClose: () => void;
  templateBlocks: Array<{ type: string; overrides?: Record<string, unknown> }>;
  templateName: string;
  onApply: (blocks: Block[], profile?: { name: string; bio: string }) => void;
}

export const TemplatePersonalization = memo(function TemplatePersonalization({
  open,
  onClose,
  templateBlocks,
  templateName,
  onApply,
}: TemplatePersonalizationProps) {
  const { t } = useTranslation();
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWithAI = async () => {
    if (!businessName.trim()) {
      toast.error(t('templates.enterBusinessName', 'Введите название бизнеса'));
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content-generator', {
        body: {
          type: 'personalize-template',
          input: {
            businessName: businessName.trim(),
            businessDescription: businessDescription.trim(),
            templateName,
            templateBlocks: templateBlocks.map(b => ({
              type: b.type,
              overrides: b.overrides
            }))
          }
        }
      });

      if (error) throw error;

      if (data?.result) {
        const personalizedBlocks: Block[] = data.result.blocks.map((blockData: any, index: number) => {
          const baseBlock = createBaseBlock(blockData.type);
          return {
            ...baseBlock,
            ...blockData,
            id: `${blockData.type}-${Date.now()}-${index}`,
          } as Block;
        });

        onApply(personalizedBlocks, data.result.profile);
        toast.success(t('templates.personalized', 'Шаблон персонализирован!'));
        onClose();
      }
    } catch (error) {
      console.error('AI personalization error:', error);
      toast.error(t('templates.personalizationError', 'Ошибка персонализации'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseAsIs = () => {
    const blocks: Block[] = templateBlocks.map((blockData, index) => {
      const baseBlock = createBaseBlock(blockData.type);
      return {
        ...baseBlock,
        ...blockData.overrides,
        id: `${blockData.type}-${Date.now()}-${index}`,
      } as Block;
    });
    onApply(blocks);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            {t('templates.personalize', 'Персонализация шаблона')}
          </DialogTitle>
          <DialogDescription>
            {t('templates.personalizeDesc', 'AI адаптирует шаблон под ваш бизнес')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">
              {t('templates.businessName', 'Название бизнеса')} *
            </Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t('templates.businessNamePlaceholder', 'Например: Салон красоты "Гламур"')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessDescription">
              {t('templates.businessDescription', 'Описание')}
            </Label>
            <Textarea
              id="businessDescription"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder={t('templates.businessDescPlaceholder', 'Расскажите о вашем бизнесе: услуги, цены, локация, особенности...')}
              rows={4}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !businessName.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('templates.generating', 'Генерируем...')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('templates.generateWithAI', 'Сгенерировать с AI')}
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={handleUseAsIs}>
            {t('templates.useAsIs', 'Использовать как есть')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
