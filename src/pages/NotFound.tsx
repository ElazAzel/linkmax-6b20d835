import { useEffect, type CSSProperties } from "react";
import { useLocation, Link } from '@/lib/router-compat';
import { logger } from '@/lib/utils/logger';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Home from 'lucide-react/dist/esm/icons/home';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    // A mistyped or crawled URL is not an app error: keep it out of Sentry.
    logger.info(`404: ${location.pathname}`, { context: 'NotFoundPage' });
  }, [location]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md w-full">
        <div className="glass rounded-[2.5rem] p-10 shadow-glass-lg border border-white/10 space-y-6">
          <div
            className="lm-enter text-8xl font-black text-primary/20 select-none"
            style={{ '--lm-enter-y': '0px', '--lm-enter-scale': 0.6, '--lm-enter-dur': '0.5s', '--lm-enter-delay': '100ms' } as CSSProperties}
          >
            404
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {t('notFound.message', 'Oops! Page not found')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('notFound.description', 'The page you\'re looking for doesn\'t exist or has been moved.')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild className="flex-1 rounded-xl gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                {t('notFound.returnHome', 'Home')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-xl gap-2">
              <Link to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                {t('notFound.goToDashboard', 'Dashboard')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
