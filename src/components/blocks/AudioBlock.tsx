import { memo, useState } from 'react';
import Music from 'lucide-react/dist/esm/icons/music';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { useTranslation } from 'react-i18next';
import type { AudioBlock as AudioBlockData } from '@/types/page';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { getSafeAudioUrl } from '@/lib/blocks/audio';

export const AudioBlock = memo(function AudioBlock({ block, onClick }: { block: AudioBlockData; onClick?: () => void }) {
  const { t, i18n } = useTranslation();
  const [failedUrl, setFailedUrl] = useState<string>();
  const external = block.sourceType === 'external';
  const url = getSafeAudioUrl(external ? block.externalUrl : block.fileUrl);
  const cover = getSafeAudioUrl(block.coverUrl);
  const title = getI18nText(block.title, i18n.language as SupportedLanguage) || t('blockTypes.audio');
  const description = getI18nText(block.description, i18n.language as SupportedLanguage);
  const content = <>
    <div className="flex items-center gap-3 min-w-0">
      {cover ? <img src={cover} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted"><Music className="h-6 w-6" aria-hidden="true" /></div>}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold break-words">{title}</h3>
        {description && <p className="text-sm opacity-70 break-words">{description}</p>}
        {external && url && <p className="text-xs opacity-70 truncate">{new URL(url).hostname}</p>}
      </div>
      {external && <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />}
    </div>
  </>;
  if (external && url) return <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClick} className="block w-full rounded-3xl p-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{content}</a>;
  return <div className="w-full min-w-0 space-y-3 p-4">
    {content}
    {!external && url ? <audio key={url} src={url} controls preload="metadata" aria-label={title} onPlay={onClick} onError={() => setFailedUrl(url)} className="w-full min-w-0" /> : <p className="text-sm opacity-70">{t('audioBlock.addSource')}</p>}
    {url && failedUrl === url && <p role="status" className="text-sm">{t('audioBlock.playbackError')}</p>}
  </div>;
});
