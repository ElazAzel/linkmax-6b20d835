import { useEffect } from "react";
import { useLocation, Link } from 'react-router-dom';
import { logger } from '@/lib/utils/logger';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Home from 'lucide-react/dist/esm/icons/home';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    logger.error('404 Error: User attempted to access non-existent route:', location.pathname, { context: 'NotFoundPage' });
  }, [location]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-md w-full"
      >
        <div className="glass rounded-[2.5rem] p-10 shadow-glass-lg border border-white/10 space-y-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="text-8xl font-black text-primary/20 select-none"
          >
            404
          </motion.div>
          
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
      </motion.div>
    </div>
  );
};

export default NotFound;
