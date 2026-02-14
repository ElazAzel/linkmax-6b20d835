import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { AIButton } from '@/components/form-fields/AIButton';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { generateMagicTitle } from '@/lib/ai-helpers';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateLinkBlock } from '@/lib/block-validators';
import { getBestFaviconUrl, extractDomain, getGoogleFaviconUrl } from '@/lib/favicon-utils';
import { RefreshCw, Link2 } from 'lucide-react';

function LinkBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const [aiLoading, setAiLoading] = useState(false);
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const iconMode = formData.iconMode || 'auto';

  // Auto-fetch favicon when URL changes and in auto mode
  const fetchFavicon = useCallback(async (url: string) => {
    if (!url) {
      setFaviconPreview(null);
      return;
    }

    setFaviconLoading(true);
    try {
      const faviconUrl = await getBestFaviconUrl(url);
      setFaviconPreview(faviconUrl);
      
      // Update formData with the favicon URL
      if (faviconUrl && iconMode === 'auto') {
        onChange({ ...formData, faviconUrl });
      }
    } catch (error) {
      console.error('Error fetching favicon:', error);
      setFaviconPreview(null);
    } finally {
      setFaviconLoading(false);
    }
  }, [iconMode]);

  // Fetch favicon when URL changes (only in auto mode)
  useEffect(() => {
    if (iconMode === 'auto' && formData.url) {
      // Use cached favicon or fetch new one
      if (formData.faviconUrl) {
        setFaviconPreview(formData.faviconUrl);
      } else {
        fetchFavicon(formData.url);
      }
    } else if (iconMode === 'manual') {
      setFaviconPreview(formData.customIconUrl || null);
    }
  }, [formData.url, iconMode, formData.faviconUrl, formData.customIconUrl]);

  const handleRefreshFavicon = async () => {
    if (formData.url) {
      // Clear cached favicon and refetch
      onChange({ ...formData, faviconUrl: undefined });
      await fetchFavicon(formData.url);
    }
  };

  const handleGenerateTitle = async () => {
    if (!formData.url) return;
    
    setAiLoading(true);
    try {
      const title = await generateMagicTitle(formData.url);
      onChange({ ...formData, title: { ru: title, en: '', kk: '' } });
    } finally {
      setAiLoading(false);
    }
  };

  const handleIconModeChange = (mode: string) => {
    onChange({ 
      ...formData, 
      iconMode: mode as 'auto' | 'manual',
      // Clear the other mode's data when switching
      ...(mode === 'auto' ? { customIconUrl: undefined } : { faviconUrl: undefined })
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{t('fields.url', 'URL')}</Label>
        <Input
          type="url"
          value={formData.url || ''}
          onChange={(e) => onChange({ ...formData, url: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('fields.title', 'Заголовок')}</Label>
          <AIButton
            onClick={handleGenerateTitle}
            loading={aiLoading}
            disabled={!formData.url}
            title={t('ai.generateWithAI', 'Generate with AI')}
            variant="icon"
          />
        </div>
        <MultilingualInput
          label=""
          value={migrateToMultilingual(formData.title)}
          onChange={(value) => onChange({ ...formData, title: value })}
          required
        />
      </div>

      {/* Icon Settings */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t('fields.iconMode', 'Иконка')}</Label>
          {/* Preview */}
          <div className="flex items-center gap-2">
            {faviconLoading ? (
              <div className="h-6 w-6 rounded border border-border bg-muted animate-pulse" />
            ) : faviconPreview ? (
              <img 
                src={faviconPreview} 
                alt="Favicon" 
                className="h-6 w-6 rounded border border-border object-contain"
              />
            ) : (
              <div className="h-6 w-6 rounded border border-border bg-muted flex items-center justify-center">
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        
        <Select
          value={iconMode}
          onValueChange={handleIconModeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">{t('fields.iconAuto', 'Авто (favicon сайта)')}</SelectItem>
            <SelectItem value="manual">{t('fields.iconManual', 'Вручную')}</SelectItem>
          </SelectContent>
        </Select>

        {iconMode === 'auto' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefreshFavicon}
            disabled={!formData.url || faviconLoading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${faviconLoading ? 'animate-spin' : ''}`} />
            {t('fields.refreshIcon', 'Обновить иконку')}
          </Button>
        )}

        {iconMode === 'manual' && (
          <div className="space-y-3">
            <MediaUpload
              label={t('fields.customIcon', 'Своя иконка')}
              value={formData.customIconUrl || ''}
              onChange={(value) => onChange({ ...formData, customIconUrl: value })}
              accept="image/*"
            />
            
            {/* Fallback icon selector when no custom icon */}
            {!formData.customIconUrl && (
              <div>
                <Label>{t('fields.fallbackIcon', 'Стандартная иконка')}</Label>
                <Select
                  value={formData.icon || 'globe'}
                  onValueChange={(value) => onChange({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="globe">Globe</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div>
        <Label>{t('fields.style', 'Button Style')}</Label>
        <Select
          value={formData.style || 'default'}
          onValueChange={(value) => onChange({ ...formData, style: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{t('styles.default', 'Default')}</SelectItem>
            <SelectItem value="rounded">{t('styles.rounded', 'Rounded')}</SelectItem>
            <SelectItem value="pill">{t('styles.pill', 'Pill (Fully Rounded)')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t('fields.alignment', 'Alignment')}</Label>
        <Select
          value={formData.alignment || 'center'}
          onValueChange={(value) => onChange({ ...formData, alignment: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">{t('fields.left', 'Left')}</SelectItem>
            <SelectItem value="center">{t('fields.center', 'Center')}</SelectItem>
            <SelectItem value="right">{t('fields.right', 'Right')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <Label>{t('fields.backgroundType', 'Background Type')}</Label>
        <Select
          value={formData.background?.type || 'solid'}
          onValueChange={(value) =>
            onChange({
              ...formData,
              background: { ...formData.background, type: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">{t('fields.solidColor', 'Solid Color')}</SelectItem>
            <SelectItem value="gradient">{t('fields.gradient', 'Gradient')}</SelectItem>
            <SelectItem value="image">{t('fields.image', 'Image')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.background?.type === 'solid' && (
        <div>
          <Label>{t('fields.backgroundColor', 'Background Color')}</Label>
          <Input
            type="color"
            value={formData.background?.value || '#000000'}
            onChange={(e) =>
              onChange({
                ...formData,
                background: { ...formData.background, value: e.target.value },
              })
            }
          />
        </div>
      )}

      {formData.background?.type === 'gradient' && (
        <>
          <div>
            <Label>{t('fields.gradientColors', 'Gradient Colors')}</Label>
            <Input
              value={formData.background?.value || ''}
              onChange={(e) =>
                onChange({
                  ...formData,
                  background: { ...formData.background, value: e.target.value },
                })
              }
              placeholder="#ff0000, #0000ff"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('fields.enterCommaSeparatedColors', 'Enter comma-separated colors')}
            </p>
          </div>
          <div>
            <Label>{t('fields.gradientAngle', 'Gradient Angle (degrees)')}</Label>
            <Input
              type="number"
              value={formData.background?.gradientAngle || 135}
              onChange={(e) =>
                onChange({
                  ...formData,
                  background: {
                    ...formData.background,
                    gradientAngle: parseInt(e.target.value),
                  },
                })
              }
              min="0"
              max="360"
            />
          </div>
        </>
      )}

      {formData.background?.type === 'image' && (
        <MediaUpload
          label={t('fields.backgroundImage', 'Background Image')}
          value={formData.background?.value || ''}
          onChange={(value) =>
            onChange({
              ...formData,
              background: { ...formData.background, value },
            })
          }
          accept="image/*"
        />
      )}
    </div>
  );
}

export const LinkBlockEditor = withBlockEditor(LinkBlockEditorComponent, {
  hint: 'Add clickable links to any external page or resource',
  validate: validateLinkBlock,
});
