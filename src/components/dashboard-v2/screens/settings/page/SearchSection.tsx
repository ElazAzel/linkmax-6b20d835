import { memo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Search from 'lucide-react/dist/esm/icons/search';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Bot from 'lucide-react/dist/esm/icons/bot';
import Check from 'lucide-react/dist/esm/icons/check';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { cn } from '@/lib/utils/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { INDEXABLE_THRESHOLD } from '@/lib/seo/quality-score';
import { getPublicHost } from './helpers';

interface SearchSectionProps {
  pageTitle?: string;
  pageSlug?: string;
  seoTitle?: string;
  seoDescription?: string;
  isIndexable?: boolean;
  qualityScore?: number;
  city?: string;
  profession?: string;
  onUpdateSeo?: (seo: { title?: string; description?: string }) => void;
  onToggleIndexable?: (indexable: boolean) => void;
  onSaved: () => void;
}

const SeoScoreBadge = memo(function SeoScoreBadge({ score }: { score?: number }) {
  const { t } = useTranslation();
  if (score === undefined || score === null) return null;

  const color = score >= 70 ? 'text-success bg-success/12 border-success/20'
    : score >= INDEXABLE_THRESHOLD ? 'text-warning bg-warning/12 border-warning/20'
      : 'text-destructive bg-destructive/12 border-destructive/20';
  const label = score >= 70 ? t('seo.good', 'Хорошо')
    : score >= INDEXABLE_THRESHOLD ? t('seo.average', 'Средне')
      : t('seo.weak', 'Слабо');

  return (
    <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium', color)} data-testid="seo-score-badge">
      <TrendingUp className="h-4 w-4" />
      <span>{t('seo.scoreLabel', 'Готовность к поиску')}: {score}/100</span>
      <span className="text-xs opacity-80">— {label}</span>
    </div>
  );
});

export const SearchSection = memo(function SearchSection({
  pageTitle, pageSlug, seoTitle, seoDescription, isIndexable, qualityScore, city, profession,
  onUpdateSeo, onToggleIndexable, onSaved,
}: SearchSectionProps) {
  const { t } = useTranslation();
  const [titleInput, setTitleInput] = useState(seoTitle || '');
  const [descInput, setDescInput] = useState(seoDescription || '');
  const saved = useRef({ title: seoTitle || '', description: seoDescription || '' });

  const commit = () => {
    const title = titleInput.trim();
    const description = descInput.trim();
    if (title === saved.current.title && description === saved.current.description) return;
    if (!onUpdateSeo) return;
    saved.current = { title, description };
    onUpdateSeo({ title: title || undefined, description: description || undefined });
    onSaved();
  };

  const tips: string[] = [];
  if (!city) tips.push(t('seo.tips.addCity', 'Укажите город для локального поиска'));
  if (!profession) tips.push(t('seo.tips.addProfession', 'Укажите профессию или специализацию'));
  if (!titleInput) tips.push(t('seo.tips.addTitle', 'Заполните заголовок для поиска'));
  if (!descInput) tips.push(t('seo.tips.addDescription', 'Заполните описание для поиска'));

  return (
    <>
      <SeoScoreBadge score={qualityScore} />

      <div className="space-y-1 rounded-control border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">{t('dashboard.pageSettings.googlePreview', 'Так страница выглядит в поиске')}</p>
        <p className="truncate text-sm font-medium text-info">{titleInput || pageTitle || pageSlug || t('dashboard.pageSettings.untitled', 'Без названия')}</p>
        <p className="truncate text-xs text-success">{getPublicHost()}/{pageSlug || ''}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{descInput || t('dashboard.pageSettings.noDescription', 'Описание не задано')}</p>
      </div>

      {tips.length > 0 && (
        <div className="space-y-1 rounded-xl border border-warning/30 bg-warning/12 p-3">
          <p className="flex items-center gap-1 text-xs font-semibold text-warning">
            <AlertTriangle className="h-3 w-3" />
            {t('seo.tips.title', 'Что улучшить')}
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-warning">
            {tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="page-seo-title" className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          {t('dashboard.pageSettings.seoTitle', 'Заголовок для поиска')}
        </Label>
        <Input
          id="page-seo-title"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          onBlur={commit}
          placeholder={t('dashboard.pageSettings.seoTitlePlaceholder', 'Например: Маникюр в Алматы — Айгерим')}
          className="h-12 rounded-xl"
          maxLength={60}
        />
        <p className="text-right text-xs text-muted-foreground">{titleInput.length}/60</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="page-seo-description">{t('dashboard.pageSettings.seoDescription', 'Описание для поиска')}</Label>
        <Textarea
          id="page-seo-description"
          value={descInput}
          onChange={(e) => setDescInput(e.target.value)}
          onBlur={commit}
          placeholder={t('dashboard.pageSettings.seoDescPlaceholder', 'Одно-два предложения о том, чем вы полезны клиенту')}
          className="resize-none rounded-xl"
          rows={3}
          maxLength={160}
        />
        <p className="text-right text-xs text-muted-foreground">{descInput.length}/160</p>
      </div>

      <div className="flex items-center justify-between gap-4 py-2">
        <div className="space-y-0.5">
          <Label htmlFor="page-indexable" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            {t('dashboard.pageSettings.indexable', 'Показывать в поиске')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.pageSettings.indexableHint', 'Страницу смогут найти в Google, Яндексе и других поисковиках')}
          </p>
        </div>
        <Switch
          id="page-indexable"
          checked={isIndexable ?? true}
          onCheckedChange={(checked: boolean) => { onToggleIndexable?.(checked); onSaved(); }}
        />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-info/30 bg-info/12 px-3 py-2">
        <Bot className="h-4 w-4 shrink-0 text-info" />
        <span className="text-xs text-info">
          {t('seo.aiBotReady', 'Разметка для ChatGPT и других AI-поисковиков добавляется автоматически')}
        </span>
        <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-success" />
      </div>
    </>
  );
});
