import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console in structured format for future monitoring integration
    console.error(JSON.stringify({
      type: 'CRASH',
      section: this.props.section || 'unknown',
      error: error.message,
      stack: error.stack?.slice(0, 500),
      componentStack: info.componentStack?.slice(0, 500),
      timestamp: new Date().toISOString(),
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-3xl border border-rose-100 shadow-sm">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-rose-500" />
          </div>
          <h3 className="text-sm font-black text-slate-800 mb-1">
            {this.props.section ? `${this.props.section} section encountered an error` : 'Something went wrong'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-5 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred. The rest of the app is still working.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
