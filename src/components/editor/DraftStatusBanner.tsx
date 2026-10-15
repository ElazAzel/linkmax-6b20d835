import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { PageDraftError } from '@/services/page-drafts';
import type { PageData } from '@/types/page';

export function DraftStatusBanner({ error, onRetry, onReload, pageData }: { error?: PageDraftError | null; onRetry: () => void; onReload: () => void; pageData: PageData | null }) {
  const { t } = useTranslation();
  if (!error) return null;
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(pageData, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'linkmax-page-draft.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div role="alert" className="mx-4 rounded-3xl border border-border bg-card p-4 md:mx-0">
    <p className="text-sm">{t(`pageV2.draft.${error.kind}`)}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={download}>{t('pageV2.draft.download')}</Button>
      {error.kind === 'conflict' ? <Button size="sm" onClick={onReload}>{t('pageV2.draft.reload')}</Button> : error.kind !== 'access' && <Button size="sm" onClick={onRetry}>{t('common.retry', 'Повторить')}</Button>}
    </div>
  </div>;
}
