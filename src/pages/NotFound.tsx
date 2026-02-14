import { useEffect } from "react";
import { useLocation, Link } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    logger.error('404 Error: User attempted to access non-existent route:', location.pathname, { context: 'NotFoundPage' });
  }, [location]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          {t('notFound.message', 'Oops! Page not found')}
        </p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          {t('notFound.returnHome', 'Return to Home')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
