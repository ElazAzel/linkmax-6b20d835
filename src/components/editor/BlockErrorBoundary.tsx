import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

type InnerProps = Props & { t: (key: string, fallback: string) => string };

interface State {
    hasError: boolean;
    error?: Error;
}

class BlockErrorBoundaryInner extends Component<InnerProps, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Block rendering error:', error, errorInfo);
        // Lazy-load Sentry to avoid pulling it into the main bundle
        import('@/lib/utils/sentry').then(({ Sentry, isSentryEnabled }) => {
            if (isSentryEnabled) {
                Sentry.withScope((scope) => {
                    scope.setTag('component', 'BlockErrorBoundary');
                    scope.setExtra('componentStack', errorInfo.componentStack);
                    Sentry.captureException(error);
                });
            }
        });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    public render() {
        const { t, fallback, children } = this.props;

        if (this.state.hasError) {
            return fallback || (
                <div className="w-full p-4 rounded-card border border-destructive/20 bg-destructive/5 flex items-center justify-between gap-3 text-destructive">
                    <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div className="text-sm font-medium break-words">
                            {t('resilience.blockError', 'Блок не удалось отобразить')}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={this.handleRetry}
                        aria-label={t('resilience.retry', 'Повторить')}
                        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium underline-offset-2 hover:underline"
                    >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        {t('resilience.retry', 'Повторить')}
                    </button>
                </div>
            );
        }

        return children;
    }
}

export function BlockErrorBoundary({ children, fallback }: Props) {
    const { t } = useTranslation();
    return (
        <BlockErrorBoundaryInner t={t} fallback={fallback}>
            {children}
        </BlockErrorBoundaryInner>
    );
}
