import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    screenName: string;
}

type InnerProps = Props & { t: (key: string, fallback: string) => string };

interface State {
    hasError: boolean;
}

class ScreenErrorBoundaryInner extends Component<InnerProps, State> {
    constructor(props: InnerProps) {
        super(props);
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Error in screen ${this.props.screenName}:`, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false });
    };

    public render() {
        const { t, screenName, children } = this.props;

        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
                    <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">
                            {t('resilience.screenError', 'Раздел не загрузился')}
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            {t('resilience.sectionError', 'Этот раздел не загрузился')}
                            {screenName ? ` — ${screenName}` : ''}
                        </p>
                    </div>
                    <Button variant="outline" onClick={this.handleRetry} className="gap-2 min-h-11">
                        <RefreshCcw className="h-4 w-4" />
                        {t('resilience.retry', 'Повторить')}
                    </Button>
                </div>
            );
        }

        return children;
    }
}

export function ScreenErrorBoundary({ children, screenName }: Props) {
    const { t } = useTranslation();
    return (
        <ScreenErrorBoundaryInner t={t} screenName={screenName}>
            {children}
        </ScreenErrorBoundaryInner>
    );
}
