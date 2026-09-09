import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Without this, one thrown render error blanks the page with no message — the
 * school sees white and leaves. A visible failure with a way out is the
 * difference between a bad moment and a lost registration.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card p-8 text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">
            Something went wrong on this page
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your order is safe. Reload to try again, or go back to the start and use
            your order reference to pick up where you left off.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold"
            >
              Reload the page
            </button>
            <a
              href="/"
              className="w-full bg-secondary text-secondary-foreground rounded-lg py-2.5 font-semibold"
            >
              Back to the start
            </a>
          </div>
        </div>
      </div>
    );
  }
}
