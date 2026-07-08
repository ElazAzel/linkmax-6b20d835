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
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Wand2 from 'lucide-react/dist/esm/icons/wand-2';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { Block } from '@/types/page';
import { createBlock as createBaseBlock } from '@/lib/blocks/block-factory';
import { buildSmartPage, inferSmartPageNiche } from '@/lib/onboarding/smart-page-builder';

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

  const handleGenerateSmart = async () => {
    if (!businessName.trim()) {
      toast.error(t('templates.enterBusinessName', 'Введите название бизнеса'));
      return;
    }

    setIsGenerating(true);
    try {
      const description = businessDescription.trim();
      const prompt = `${businessName} ${description} ${templateName}`;
      const result = buildSmartPage({
        niche: inferSmartPageNiche(prompt),
        goal: 'leads',
        userInfo: {
          name: businessName.trim(),
          bio: description || templateName,
          goal: 'leads',
          contacts: description,
          services: description,
          socials: description,
          mediaLinks: description,
        },
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      onApply(result.blocks, result.profile);
      toast.success(t('templates.personalized', 'Шаблон персонализирован!'));
      onClose();
    } catch (error) {
      console.error('Template personalization error:', error);
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
            {t('templates.personalizeSmartDesc', 'Алгоритм адаптирует структуру, CTA, услуги и контакты под ваш бизнес')}
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
            onClick={handleGenerateSmart}
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
                {t('templates.generateSmart', 'Собрать автоматически')}
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
