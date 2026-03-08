/**
 * ZoneErrorBoundary - Error boundary wrapper for zone screens
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  screenName?: string;
}

interface State {
  hasError: boolean;
}

class ZoneErrorBoundaryInner extends Component<Props & { t: (key: string, fallback: string) => string }, State> {
  constructor(props: Props & { t: (key: string, fallback: string) => string }) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Zone Error [${this.props.screenName || 'unknown'}]:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    const { t, screenName, children } = this.props;

    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">
              {t('zones.error.title', 'Что-то пошло не так')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('zones.error.description', 'Произошла ошибка при загрузке')}
              {screenName && ` "${screenName}"`}.
            </p>
          </div>
          <Button variant="outline" onClick={this.handleRetry} className="gap-2 min-h-11">
            <RefreshCcw className="h-4 w-4" />
            {t('zones.error.retry', 'Попробовать снова')}
          </Button>
        </div>
      );
    }

    return children;
  }
}

export function ZoneErrorBoundary({ children, screenName }: Props) {
  const { t } = useTranslation();
  return (
    <ZoneErrorBoundaryInner t={t} screenName={screenName}>
      {children}
    </ZoneErrorBoundaryInner>
  );
}
