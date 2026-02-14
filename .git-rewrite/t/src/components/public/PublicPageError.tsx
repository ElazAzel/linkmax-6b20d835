/**
 * PublicPageError - Error state for public pages
 * Shown when page not found or failed to load
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, RefreshCw } from 'lucide-react';

interface PublicPageErrorProps {
  type?: 'not-found' | 'error';
  onRetry?: () => void;
}

export const PublicPageError = memo(function PublicPageError({ 
  type = 'not-found',
  onRetry 
}: PublicPageErrorProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="h-20 w-20 rounded-[24px] bg-muted/50 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h1 className="text-2xl font-black mb-2">
          {type === 'not-found' 
            ? t('errors.pageNotFound', 'Страница не найдена')
            : t('errors.loadError', 'Ошибка загрузки')
          }
        </h1>
        
        <p className="text-muted-foreground mb-8">
          {type === 'not-found'
            ? t('errors.invalidLink', 'Проверьте правильность ссылки или страница была удалена')
            : t('errors.tryAgain', 'Попробуйте обновить страницу')
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <Button 
              variant="outline" 
              className="h-12 px-6 rounded-xl"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.retry', 'Попробовать снова')}
            </Button>
          )}
          
          <Button 
            asChild 
            className="h-12 px-6 rounded-xl"
          >
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              {t('common.goHome', 'На главную')}
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-8">
          {t('errors.createYourPage', 'Хотите создать свою страницу?')}{' '}
          <Link to="/auth" className="text-primary hover:underline font-medium">
            {t('common.signUp', 'Регистрация')}
          </Link>
        </p>
      </div>
    </div>
  );
});
