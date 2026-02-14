import { memo, useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Share2, DollarSign, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import type { Block } from '@/types/page';
import {
  TEMPLATE_CATEGORY_KEYS,
  type TemplateCategoryKey,
  getTemplateCategoryLabel,
  normalizeTemplateCategory,
} from '@/lib/templateCategories';

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

interface EditTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  template: UserTemplate | null;
  onUpdated: () => void;
  currentBlocks?: Block[];
}

export const EditTemplateDialog = memo(function EditTemplateDialog({
  open,
  onClose,
  template,
  onUpdated,
  currentBlocks,
}: EditTemplateDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategoryKey>('other');
  const [isPublic, setIsPublic] = useState(false);
  const [isForSale, setIsForSale] = useState(false);
  const [price, setPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [updateBlocks, setUpdateBlocks] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setCategory(normalizeTemplateCategory(template.category));
      setIsPublic(template.is_public);
      setIsForSale(template.is_for_sale);
      setPrice(template.price?.toString() || '');
      setUpdateBlocks(false);
    }
  }, [template]);

  const handleSave = async () => {
    if (!template) return;

    if (!name.trim()) {
      toast.error(t('templates.enterName', 'Введите название шаблона'));
      return;
    }

    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || null,
        category,
        is_public: isPublic,
        is_for_sale: isForSale && isPublic,
        price: isForSale ? parseInt(price) || 0 : 0,
        updated_at: new Date().toISOString(),
      };

      // Optionally update blocks with current page blocks
      if (updateBlocks && currentBlocks && currentBlocks.length > 0) {
        const templateBlocks = currentBlocks.map(block => ({
          type: block.type,
          ...block,
          id: undefined,
        }));
        updateData.blocks = templateBlocks;
      }

      const { error } = await supabase
        .from('user_templates')
        .update(updateData)
        .eq('id', template.id);

      if (error) throw error;

      toast.success(t('templates.updated', 'Шаблон обновлён!'));
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Update template error:', error);
      toast.error(t('templates.updateError', 'Ошибка обновления'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            {t('templates.editTemplate', 'Редактировать шаблон')}
          </DialogTitle>
          <DialogDescription>
            {t('templates.editDesc', 'Измените настройки шаблона')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">
              {t('templates.name', 'Название')} *
            </Label>
            <Input
              id="templateName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('templates.namePlaceholder', 'Мой крутой шаблон')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateDesc">
              {t('templates.description', 'Описание')}
            </Label>
            <Textarea
              id="templateDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('templates.descPlaceholder', 'Опишите для чего подходит этот шаблон...')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('templates.category', 'Категория')}</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as TemplateCategoryKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORY_KEYS.filter((key) => key !== 'all').map((key) => (
                  <SelectItem key={key} value={key}>
                    {getTemplateCategoryLabel(t, key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentBlocks && currentBlocks.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t('templates.updateBlocks', 'Обновить блоки')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('templates.updateBlocksDesc', 'Заменить блоки текущей страницей')}
                  </p>
                </div>
              </div>
              <Switch checked={updateBlocks} onCheckedChange={setUpdateBlocks} />
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {t('templates.makePublic', 'Сделать публичным')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('templates.publicDesc', 'Шаблон будет виден в маркетплейсе')}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {isPublic && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t('templates.sellTemplate', 'Продавать шаблон')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('templates.sellDesc', 'Установите цену для покупки')}
                  </p>
                </div>
              </div>
              <Switch checked={isForSale} onCheckedChange={setIsForSale} />
            </div>
          )}

          {isPublic && isForSale && (
            <div className="space-y-2">
              <Label htmlFor="templatePrice">
                {t('templates.price', 'Цена (KZT)')}
              </Label>
              <Input
                id="templatePrice"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="5000"
                min="0"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('common.cancel', 'Отмена')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !name.trim()}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving', 'Сохранение...')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('templates.update', 'Обновить')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
