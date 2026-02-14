import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { Crown, Image, Palette, Sparkles, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PageBackground } from '@/types/page';

interface PageBackgroundSettingsProps {
  background?: PageBackground;
  onChange: (background: PageBackground | undefined) => void;
  canUseFeature: boolean;
}

export const PageBackgroundSettings = memo(function PageBackgroundSettings({
  background,
  onChange,
  canUseFeature,
}: PageBackgroundSettingsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const currentType = background?.type || 'solid';
  const currentValue = background?.value || '';
  const gradientAngle = background?.gradientAngle || 135;

  const handleTypeChange = (type: PageBackground['type']) => {
    onChange({
      type,
      value: type === 'solid' ? '#1a1a2e' : type === 'gradient' ? '#667eea,#764ba2' : '',
      gradientAngle: type === 'gradient' ? 135 : undefined,
    });
  };

  const handleValueChange = (value: string) => {
    onChange({ ...background, type: currentType, value });
  };

  const handleGradientAngleChange = (angle: number) => {
    onChange({ ...background, type: 'gradient', value: currentValue, gradientAngle: angle });
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  if (!canUseFeature) {
    return (
      <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold">{t('settings.pageBackground', 'Фон страницы')}</h3>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Crown className="h-3 w-3" />
            Business
          </Badge>
        </div>
        
        <Alert className="bg-muted/50">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {t('settings.pageBackgroundLocked', 'Пользовательский фон страницы доступен только на тарифе Business. Установите цвет, градиент, изображение или GIF в качестве фона вашей страницы.')}
          </AlertDescription>
        </Alert>
        
        <Button
          size="sm"
          onClick={() => navigate('/pricing')}
          className="w-full mt-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          <Crown className="h-3.5 w-3.5 mr-1.5" />
          {t('premium.upgradeToBusiness', 'Перейти на Business')}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Image className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold">{t('settings.pageBackground', 'Фон страницы')}</h3>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Crown className="h-3 w-3" />
            Business
          </Badge>
        </div>
        {background && (
          <Button variant="ghost" size="sm" onClick={handleRemove} className="text-xs text-muted-foreground">
            {t('common.remove', 'Убрать')}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-muted-foreground">{t('settings.backgroundType', 'Тип фона')}</Label>
          <Select value={currentType} onValueChange={(v) => handleTypeChange(v as PageBackground['type'])}>
            <SelectTrigger className="bg-background/50 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {t('settings.solidColor', 'Сплошной цвет')}
                </div>
              </SelectItem>
              <SelectItem value="gradient">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('settings.gradient', 'Градиент')}
                </div>
              </SelectItem>
              <SelectItem value="image">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  {t('settings.imageOrGif', 'Изображение / GIF')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentType === 'solid' && (
          <div>
            <Label className="text-xs text-muted-foreground">{t('settings.backgroundColor', 'Цвет фона')}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={currentValue || '#1a1a2e'}
                onChange={(e) => handleValueChange(e.target.value)}
                className="w-14 h-10 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={currentValue || '#1a1a2e'}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="#1a1a2e"
                className="flex-1 bg-background/50"
              />
            </div>
          </div>
        )}

        {currentType === 'gradient' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">{t('settings.gradientColors', 'Цвета градиента (через запятую)')}</Label>
              <Input
                type="text"
                value={currentValue || '#667eea,#764ba2'}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="#667eea,#764ba2"
                className="mt-1 bg-background/50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('settings.gradientHint', 'Укажите 2-3 цвета через запятую')}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('settings.gradientAngle', 'Угол градиента')}: {gradientAngle}°</Label>
              <Input
                type="range"
                min="0"
                max="360"
                value={gradientAngle}
                onChange={(e) => handleGradientAngleChange(parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </>
        )}

        {currentType === 'image' && (
          <div>
            <Label className="text-xs text-muted-foreground">{t('settings.backgroundImage', 'Изображение или GIF')}</Label>
            <div className="mt-1">
              <MediaUpload
                value={currentValue}
                onChange={(url) => handleValueChange(url || '')}
                allowGif={true}
              />
            </div>
          </div>
        )}

        {background && (
          <div className="mt-3 p-2 rounded-lg border border-border/50 bg-muted/30">
            <Label className="text-xs text-muted-foreground">{t('settings.preview', 'Превью')}</Label>
            <div 
              className="mt-2 h-20 rounded-lg border border-border/30"
              style={getBackgroundPreviewStyle(background)}
            />
          </div>
        )}
      </div>
    </Card>
  );
});

function getBackgroundPreviewStyle(background?: PageBackground): React.CSSProperties {
  if (!background) return {};
  
  switch (background.type) {
    case 'solid':
      return { backgroundColor: background.value };
    case 'gradient':
      const colors = background.value.split(',').map(c => c.trim());
      return { 
        background: `linear-gradient(${background.gradientAngle || 135}deg, ${colors.join(', ')})` 
      };
    case 'image':
      return { 
        backgroundImage: `url(${background.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    default:
      return {};
  }
}
