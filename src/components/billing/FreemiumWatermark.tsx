import { memo } from 'react';
import Crown from 'lucide-react/dist/esm/icons/crown';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { useTranslation } from 'react-i18next';

interface FreemiumWatermarkProps {
  show: boolean;
  slug?: string;
}

export const FreemiumWatermark = memo(function FreemiumWatermark({ show, slug }: FreemiumWatermarkProps) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="flex justify-center py-6">
      <a
        href={slug ? `${getAppDomain()}/from/${slug}` : getAppDomain()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-foreground/5 px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Crown className="h-3.5 w-3.5" />
        <span>
          {t('publicPage.poweredBy', 'Powered by')} <strong className="font-semibold">LinkMAX</strong>
        </span>
      </a>
    </div>
  );
});
