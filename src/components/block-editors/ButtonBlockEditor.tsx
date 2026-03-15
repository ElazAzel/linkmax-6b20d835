import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateButtonBlock } from '@/lib/blocks/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { EditorSection, EditorField, EditorDivider } from './EditorSection';
import { AlignmentButton } from './EditorUtils';
import { getRandomSuggestion, type SuggestionContext } from '@/lib/intelligence/writing-algorithm';
import { useDashboard } from '@/hooks/dashboard/useDashboard';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Square from 'lucide-react/dist/esm/icons/square';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Type from 'lucide-react/dist/esm/icons/type';
import Palette from 'lucide-react/dist/esm/icons/palette';
import MousePointerClick from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import AlignLeft from 'lucide-react/dist/esm/icons/align-left';
import AlignCenter from 'lucide-react/dist/esm/icons/align-center';
import AlignRight from 'lucide-react/dist/esm/icons/align-right';
import Move from 'lucide-react/dist/esm/icons/move';

function ButtonBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const data = formData as any;
  const handleChange = (updates: any) => onChange(updates);

  const { pageData } = useDashboard();
  const currentNiche = pageData?.niche || 'general';

  const handleMagicWand = () => {
    const context: SuggestionContext = {
      city: pageData?.city || '',
      company_name: (pageData?.blocks.find(b => b.type === 'profile') as any)?.name || '',
    };

    const suggestion = getRandomSuggestion(currentNiche, 'button', context);
    if (suggestion) {
      handleChange({
        ...data,
        title: {
          ...migrateToMultilingual(data.title),
          ru: suggestion
        }
      });
    }
  };

  // Progress tracking
  const contentFilled = [
    data.title?.ru || data.title?.en,
    data.url
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Content Section */}
      <EditorSection
        title={t('editor.sections.content', 'Content')}
        icon={<Type className="h-5 w-5 text-primary" />}
        collapsible={false}
        filledCount={contentFilled}
        totalCount={2}
      >
        <MultilingualInput
          label={t('fields.title', 'Title')}
          value={migrateToMultilingual(data.title)}
          onChange={(value) => handleChange({ ...data, title: value })}
          onMagicWand={handleMagicWand}
          placeholder={t('placeholders.buttonText', 'Button text')}
          required
        />

        <EditorField label="URL" required>
          <Input
            type="url"
            value={data.url || ''}
            onChange={(e) => handleChange({ ...data, url: e.target.value })}
            placeholder="https://example.com"
            className="h-12 rounded-xl"
          />
        </EditorField>
      </EditorSection>

      {/* Appearance Section */}
      <EditorSection
        title={t('editor.sections.appearance', 'Appearance')}
        icon={<Palette className="h-5 w-5 text-primary" />}
        defaultOpen={true}
      >
        <EditorField label={t('fields.backgroundType', 'Background Type')}>
          <Select
            value={data.background?.type || 'solid'}
            onValueChange={(value: string) => handleChange({ ...data, background: { ...data.background, type: value } })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">{t('fields.solidColor', 'Solid Color')}</SelectItem>
              <SelectItem value="gradient">{t('fields.gradient', 'Gradient')}</SelectItem>
              <SelectItem value="image">{t('fields.image', 'Image')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        {data.background?.type === 'solid' && (
          <EditorField label={t('fields.backgroundColor', 'Background Color')}>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={data.background?.value || '#000000'}
                onChange={(e) => handleChange({ ...data, background: { ...data.background, value: e.target.value } })}
                className="h-12 w-16 rounded-xl p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={data.background?.value || '#000000'}
                onChange={(e) => handleChange({ ...data, background: { ...data.background, value: e.target.value } })}
                className="flex-1 h-12 rounded-xl font-mono"
              />
            </div>
          </EditorField>
        )}

        {data.background?.type === 'gradient' && (
          <>
            <EditorField label={t('fields.gradientColors', 'Gradient Colors')}>
              <Input
                value={data.background?.value || ''}
                onChange={(e) => handleChange({ ...data, background: { ...data.background, value: e.target.value } })}
                placeholder="#ff0000, #0000ff"
                className="h-12 rounded-xl"
              />
            </EditorField>
            <EditorField label={t('fields.gradientAngle', 'Gradient Angle')}>
              <div className="flex gap-2 items-center">
                <Input
                  type="range"
                  min="0"
                  max="360"
                  value={data.background?.gradientAngle || 135}
                  onChange={(e) => handleChange({ ...data, background: { ...data.background, gradientAngle: parseInt(e.target.value) } })}
                  className="flex-1"
                />
                <span className="w-12 text-center text-sm font-mono">
                  {data.background?.gradientAngle || 135}°
                </span>
              </div>
            </EditorField>
          </>
        )}

        {data.background?.type === 'image' && (
          <MediaUpload
            label={t('fields.backgroundImage', 'Background Image')}
            value={data.background?.value || ''}
            onChange={(value) => handleChange({ ...data, background: { ...data.background, value } })}
            accept="image/*"
          />
        )}

        <EditorDivider />

        <EditorField label={t('fields.width', 'Width')}>
          <Select value={data.width || 'medium'} onValueChange={(value: string) => handleChange({ ...data, width: value })}>
            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full"><span className="flex items-center gap-2"><Maximize2 className="h-4 w-4" />{t('fields.fullWidth', 'Full Width')}</span></SelectItem>
              <SelectItem value="medium"><span className="flex items-center gap-2"><Square className="h-4 w-4" />{t('fields.mediumWidth', 'Medium')}</span></SelectItem>
              <SelectItem value="small"><span className="flex items-center gap-2"><Minus className="h-4 w-4" />{t('fields.smallWidth', 'Small')}</span></SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.alignment', 'Alignment')}>
          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
            <AlignmentButton
              value="left"
              current={data.alignment || 'center'}
              icon={<AlignLeft className="h-5 w-5" />}
              label={t('fields.left', 'Left')}
              onClick={(v) => handleChange({ ...data, alignment: v })}
            />
            <AlignmentButton
              value="center"
              current={data.alignment || 'center'}
              icon={<AlignCenter className="h-5 w-5" />}
              label={t('fields.center', 'Center')}
              onClick={(v) => handleChange({ ...data, alignment: v })}
            />
            <AlignmentButton
              value="right"
              current={data.alignment || 'center'}
              icon={<AlignRight className="h-5 w-5" />}
              label={t('fields.right', 'Right')}
              onClick={(v) => handleChange({ ...data, alignment: v })}
            />
          </div>
        </EditorField>
      </EditorSection>

      {/* Effects Section */}
      <EditorSection
        title={t('editor.sections.effects', 'Effects')}
        icon={<MousePointerClick className="h-5 w-5 text-primary" />}
        defaultOpen={false}
      >
        <EditorField label={t('fields.hoverEffect', 'Hover Effect')}>
          <Select
            value={data.hoverEffect || 'none'}
            onValueChange={(value: string) => handleChange({ ...data, hoverEffect: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none"><span className="flex items-center gap-2">{t('fields.none', 'None')}</span></SelectItem>
              <SelectItem value="glow"><span className="flex items-center gap-2">✨ {t('fields.glow', 'Glow')}</span></SelectItem>
              <SelectItem value="scale"><span className="flex items-center gap-2"><Maximize2 className="h-4 w-4" /> {t('fields.scale', 'Scale')}</span></SelectItem>
              <SelectItem value="shadow"><span className="flex items-center gap-2">🌑 {t('fields.shadow', 'Shadow')}</span></SelectItem>
            </SelectContent>
          </Select>
        </EditorField>
      </EditorSection>
    </div>
  );
}

export const ButtonBlockEditor = withBlockEditor(ButtonBlockEditorComponent, {
  hint: 'Create custom buttons with gradients, images, and hover effects',
  validate: validateButtonBlock,
});
