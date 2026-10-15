import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { RenderContextProvider } from '@/contexts/RenderContext';
import { getBackgroundStyle, getThemeBackgroundStyle, getPageThemeScope } from '@/lib/appearance/style-utils';
import { usePageFonts } from '@/hooks/page/usePageFonts';
import type { PageData } from '@/types/page';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';
const GridBlocksRenderer = lazy(() => import('@/components/blocks/GridBlocksRenderer').then(m => ({ default: m.GridBlocksRenderer })));

export function DraftPreviewDialog({ open, onOpenChange, pageData, isOwnerPremium, ownerTier, pageOwnerId }: { open: boolean; onOpenChange: (open: boolean) => void; pageData: PageData | null; isOwnerPremium?: boolean; ownerTier?: PremiumTier; pageOwnerId?: string }) {
  const { t } = useTranslation();
  usePageFonts(pageData?.theme);
  const scope = getPageThemeScope(pageData?.theme || {});
  const background = getBackgroundStyle(pageData?.theme.customBackground);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92dvh] w-[calc(100%-16px)] max-w-2xl overflow-y-auto rounded-3xl p-0">
    <div className="p-4 pr-12"><DialogTitle>{t('editor.preview', 'Предпросмотр')}</DialogTitle><DialogDescription>{t('pageV2.draft.previewHint', 'Только для вас. Публичная страница обновится после публикации.')}</DialogDescription></div>
    {pageData && <RenderContextProvider value="public-preview"><div className={`${scope.className} bg-background text-foreground relative isolate min-h-64 pb-8`} style={{ ...getThemeBackgroundStyle(pageData.theme), ...scope.style }}>
      <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 ${background.className}`} style={background.style} />
      {background.overlay && <div aria-hidden style={background.overlay} />}
      <div className="lm-page-width relative z-[1]"><Suspense fallback={<div className="h-40 animate-pulse bg-muted" />}><GridBlocksRenderer blocks={pageData.blocks} isPreview pageId={pageData.id} pageOwnerId={pageOwnerId ?? pageData.userId} isOwnerPremium={isOwnerPremium} ownerTier={ownerTier} animation="none" /></Suspense></div>
    </div></RenderContextProvider>}
  </DialogContent></Dialog>;
}
