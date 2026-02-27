import React, { Component, ErrorInfo, ReactNode } from 'react';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';
import { Button } from '@/components/ui';

interface Props {
    children: ReactNode;
    screenName: string;
}

interface State {
    hasError: boolean;
}

export class ScreenErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false
        };
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
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
                    <div className="p-3 rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Что-то пошло не так</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Произошла ошибка при загрузке экрана "{this.props.screenName}".
                        </p>
                    </div>
                    <Button variant="outline" onClick={this.handleRetry} className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        Попробовать снова
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
