import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.handleReset = this.handleReset.bind(this);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset() {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-2xl bg-neutral-900 border border-rose-500/30 text-white flex flex-col items-center justify-center text-center space-y-3 my-4 max-w-md mx-auto shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-sm font-bold text-neutral-100">
            {this.props.fallbackTitle || 'कुनै प्राविधिक समस्या आयो'}
          </h3>
          <p className="text-xs text-neutral-400">
            अनुप्रयोग सुरक्षित छ। कृपया पुन: प्रयास गर्नुहोस्।
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <RefreshCw size={14} />
            <span>पुन: खोल्नुहोस् / ताजा गर्नुहोस्</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
