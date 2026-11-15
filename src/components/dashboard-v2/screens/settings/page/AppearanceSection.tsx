import { memo, useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import Palette from 'lucide-react/dist/esm/icons/palette';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Store from 'lucide-react/dist/esm/icons/store';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { PremiumFeatureGate } from '@/components/billing/PremiumFeatureGate';
import { GroupTitle } from './shared';

interface AppearanceSectionProps {
  isPremium: boolean;
  faviconUrl?: string;
  hideBranding?: boolean;
  onUpdateBranding?: (branding: { faviconUrl?: string; hideBranding?: boolean }) => void;
  onOpenTheme?: () => void;
  onOpenTemplates?: () => void;
  onOpenMarketplace?: () => void;
  onOpenAIBuilder?: () => void;
  onSaved: () => void;
}

interface LinkRowProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
  onClick?: () => void;
}

function LinkRow({ icon: Icon, title, description, badge, onClick }: LinkRowProps) {
  if (!onClick) return null;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      onClick={onClick}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
        <Icon className="h-5 w-5 text-primary" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-medium">{title}</span>
          {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        </span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

export const AppearanceSection = memo(function AppearanceSection({
  isPremium, faviconUrl, hideBranding, onUpdateBranding,
  onOpenTheme, onOpenTemplates, onOpenMarketplace, onOpenAIBuilder, onSaved,
}: AppearanceSectionProps) {
  const { t } = useTranslation();
  const [favicon, setFavicon] = useState(faviconUrl || '');
  const [hidden, setHidden] = useState(hideBranding || false);

  const saveBranding = (next: { favicon?: string; hidden?: boolean }) => {
    const nextFavicon = next.favicon ?? favicon;
    const nextHidden = next.hidden ?? hidden;
    onUpdateBranding?.({ faviconUrl: nextFavicon || undefined, hideBranding: nextHidden });
  };

  return (
    <>
      <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border">
        <LinkRow
          icon={Palette}
          title={t('dashboard.pageSettings.theme', 'Тема и цвета')}
          description={t('dashboard.pageSettings.themeDesc', 'Цвета, шрифты и фон страницы')}
          badge={isPremium ? undefined : 'PRO'}
          onClick={onOpenTheme}
        />
        <LinkRow
          icon={LayoutTemplate}
          title={t('dashboard.pageSettings.templates', 'Шаблоны')}
          description={t('dashboard.pageSettings.templatesDesc', 'Готовые дизайны страниц')}
          onClick={onOpenTemplates}
        />
        <LinkRow
          icon={Store}
          title={t('dashboard.pageSettings.marketplace', 'Маркетплейс')}
          description={t('dashboard.pageSettings.marketplaceDesc', 'Шаблоны от сообщества')}
          onClick={onOpenMarketplace}
        />
        <LinkRow
          icon={Sparkles}
          title={t('dashboard.pageSettings.aiBuilderBtn', 'Заполнить страницу с AI')}
          description={t('dashboard.pageSettings.aiBuilderDesc', 'AI подготовит тексты и блоки под вашу нишу')}
          onClick={onOpenAIBuilder}
        />
      </div>

      <div className="space-y-3 border-t border-border pt-5">
        <GroupTitle>
          {t('dashboard.pageSettings.whiteLabel', 'Свой бренд')}
          {!isPremium && <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-xs uppercase text-primary">PRO</Badge>}
        </GroupTitle>
        <PremiumFeatureGate requiredTier="pro" outcomeKey="design">
          <div className="space-y-4">
            <div className="space-y-1">
              <MediaUpload
                label={t('dashboard.pageSettings.favicon', 'Иконка во вкладке браузера')}
                value={favicon}
                onChange={(url) => {
                  setFavicon(url);
                  saveBranding({ favicon: url });
                }}
                accept="image/png,image/jpeg,image/webp"
                allowGif={false}
                placeholder="https://example.com/favicon.png"
              />
              <p className="text-xs text-muted-foreground">
                {t('dashboard.pageSettings.faviconHint', 'Квадратная картинка PNG, от 64×64 пикселей')}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="page-hide-branding">{t('dashboard.pageSettings.hideBranding', 'Скрыть логотип LinkMAX')}</Label>
                <p className="text-sm leading-snug text-muted-foreground">
                  {t('dashboard.pageSettings.hideBrandingHint', 'Внизу страницы не будет подписи «Сделано на LinkMAX»')}
                </p>
              </div>
              <Switch
                id="page-hide-branding"
                checked={hidden}
                disabled={!isPremium}
                onCheckedChange={(checked: boolean) => {
                  setHidden(checked);
                  saveBranding({ hidden: checked });
                  onSaved();
                }}
              />
            </div>
          </div>
        </PremiumFeatureGate>
      </div>
    </>
  );
});
