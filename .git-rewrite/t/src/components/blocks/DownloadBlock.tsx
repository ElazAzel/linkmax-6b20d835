import { memo } from 'react';
import { Download, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DownloadBlock as DownloadBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

interface DownloadBlockProps {
  block: DownloadBlockType;
}

export const DownloadBlock = memo(function DownloadBlock({ block }: DownloadBlockProps) {
  const { t, i18n } = useTranslation();
  
  const handleDownload = () => {
    window.open(block.fileUrl, '_blank', 'noopener,noreferrer');
  };

  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);
  const description = getTranslatedString(block.description, i18n.language as SupportedLanguage);

  const alignmentClass = block.alignment === 'left' ? 'mr-auto' 
    : block.alignment === 'right' ? 'ml-auto' 
    : 'mx-auto';

  return (
    <div className={`flex ${block.alignment === 'left' ? 'justify-start' : block.alignment === 'right' ? 'justify-end' : 'justify-center'}`}>
      <Card className={`${alignmentClass} max-w-md p-6`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mb-2">{description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>{block.fileName}</span>
              {block.fileSize && (
                <>
                  <span>•</span>
                  <span>{block.fileSize}</span>
                </>
              )}
            </div>
            <Button onClick={handleDownload} size="sm" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              {t('actions.download', 'Download')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
});
