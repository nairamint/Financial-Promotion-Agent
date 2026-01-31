/**
 * React Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing
 * the entire application.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error);
            console.error('Component stack:', errorInfo.componentStack);
        }

        // Log to monitoring service (e.g., Sentry) in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Integrate with Sentry or other monitoring service
            // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
        }

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Update state with error info
        this.setState({ errorInfo });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <AlertTriangle className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Something Went Wrong</h1>
                                    <p className="text-red-100 mt-1">
                                        We encountered an unexpected error
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Details */}
                        <div className="p-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                                <h2 className="text-sm font-semibold text-slate-700 mb-2">
                                    Error Details
                                </h2>
                                <p className="text-sm text-slate-600 font-mono break-words">
                                    {this.state.error?.message || 'Unknown error occurred'}
                                </p>
                            </div>

                            {/* Development-only stack trace */}
                            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                                <details className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                                    <summary className="text-sm font-semibold text-slate-700 cursor-pointer">
                                        Component Stack Trace (Development Only)
                                    </summary>
                                    <pre className="text-xs text-slate-600 mt-2 overflow-auto max-h-64 whitespace-pre-wrap font-mono">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}

                            {/* Recovery Options */}
                            <div className="space-y-3">
                                <p className="text-sm text-slate-600">
                                    You can try one of the following options:
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={this.handleReset}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Try Again
                                    </button>

                                    <button
                                        onClick={this.handleGoHome}
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        <Home className="h-4 w-4" />
                                        Go to Home
                                    </button>
                                </div>
                            </div>

                            {/* Support Information */}
                            <div className="mt-6 pt-6 border-t border-slate-200">
                                <p className="text-xs text-slate-500">
                                    If this error persists, please contact support with the error
                                    details shown above. Your session has been logged for
                                    investigation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook-based error boundary for functional components
 * Note: This is a wrapper around the class-based ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
): React.FC<P> {
    return (props: P) => (
        <ErrorBoundary fallback={fallback}>
            <Component {...props} />
        </ErrorBoundary>
    );
}
