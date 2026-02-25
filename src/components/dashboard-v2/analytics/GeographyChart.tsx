/**
 * GeographyChart - Geographic distribution of visitors
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Globe from 'lucide-react/dist/esm/icons/globe';

interface GeoData {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
}

interface GeographyChartProps {
  data: GeoData[];
  totalVisitors: number;
}

// Country code to flag emoji
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Country name translations for common codes
const countryNames: Record<string, Record<string, string>> = {
  RU: { ru: 'Россия', en: 'Russia' },
  KZ: { ru: 'Казахстан', en: 'Kazakhstan' },
  UA: { ru: 'Украина', en: 'Ukraine' },
  BY: { ru: 'Беларусь', en: 'Belarus' },
  US: { ru: 'США', en: 'USA' },
  DE: { ru: 'Германия', en: 'Germany' },
  GB: { ru: 'Великобритания', en: 'United Kingdom' },
  FR: { ru: 'Франция', en: 'France' },
  UZ: { ru: 'Узбекистан', en: 'Uzbekistan' },
  KG: { ru: 'Кыргызстан', en: 'Kyrgyzstan' },
  TJ: { ru: 'Таджикистан', en: 'Tajikistan' },
  AZ: { ru: 'Азербайджан', en: 'Azerbaijan' },
  GE: { ru: 'Грузия', en: 'Georgia' },
  AM: { ru: 'Армения', en: 'Armenia' },
  TR: { ru: 'Турция', en: 'Turkey' },
  AE: { ru: 'ОАЭ', en: 'UAE' },
  unknown: { ru: 'Другие', en: 'Other' },
};

export const GeographyChart = memo(function GeographyChart({
  data,
  totalVisitors,
}: GeographyChartProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('ru') ? 'ru' : 'en';

  const getCountryName = (code: string, fallback: string) => {
    return countryNames[code]?.[lang] || fallback;
  };

  if (!data.length) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-bold">{t('analytics.geography.title', 'География')}</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('analytics.geography.noData', 'Нет данных о географии')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="font-bold">{t('analytics.geography.title', 'География')}</h3>
      </div>

      <div className="space-y-3">
        {data.slice(0, 6).map((geo, index) => (
          <div key={geo.countryCode || index} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getFlagEmoji(geo.countryCode)}</span>
                <span className="text-sm font-medium">
                  {getCountryName(geo.countryCode, geo.country)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{geo.count}</span>
                <span className="text-sm font-bold">{geo.percentage.toFixed(0)}%</span>
              </div>
            </div>
            <Progress value={geo.percentage} className="h-1.5" />
          </div>
        ))}
      </div>

      {data.length > 6 && (
        <div className="mt-3 pt-3 border-t border-border/50 text-center">
          <span className="text-xs text-muted-foreground">
            {t('analytics.geography.andMore', 'и ещё {{count}} стран', { count: data.length - 6 })}
          </span>
        </div>
      )}
    </Card>
  );
});
