import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class BlockErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Block rendering error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="w-full p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-center gap-3 text-destructive">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div className="text-sm font-medium">
                        Error loading block
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
