import { memo } from 'react';
import { Download, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DownloadBlock as DownloadBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface DownloadBlockProps {
  block: DownloadBlockType;
  onClick?: () => void;
}

export const DownloadBlock = memo(function DownloadBlock({ block, onClick }: DownloadBlockProps) {
  const { t, i18n } = useTranslation();
  
  const handleDownload = () => {
    if (onClick) onClick();
    // Small delay to ensure tracking request is sent
    setTimeout(() => {
      window.open(block.fileUrl, '_blank', 'noopener,noreferrer');
    }, 10);
  };

  const title = getI18nText(block.title, i18n.language as SupportedLanguage);
  const description = getI18nText(block.description, i18n.language as SupportedLanguage);
  const buttonText = getI18nText(block.buttonText, i18n.language as SupportedLanguage) || t('actions.download', 'Download');

  return (
    <div className={cn(
      "flex w-full",
      block.alignment === 'left' ? 'justify-start' : block.alignment === 'right' ? 'justify-end' : 'justify-center'
    )}>
      <Card className="w-full max-w-md p-4 sm:p-5 bg-card border-border shadow-sm rounded-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1 line-clamp-2">{title}</h3>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 line-clamp-2">{description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground mb-2 sm:mb-3">
              <span className="truncate max-w-[120px] sm:max-w-none">{block.fileName}</span>
              {block.fileSize && (
                <>
                  <span>•</span>
                  <span>{block.fileSize}</span>
                </>
              )}
            </div>
            <Button 
              onClick={handleDownload} 
              size="sm" 
              className="w-full h-10 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform"
            >
              <Download className="h-4 w-4 mr-2" />
              {buttonText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
});
