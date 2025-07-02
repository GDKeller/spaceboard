import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="card w-96 bg-base-100 shadow-xl">
            <div className="card-body text-center">
              <h2 className="card-title justify-center text-error">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Something went wrong
              </h2>
              
              <p className="text-sm text-gray-600 mb-4">
                The application encountered an unexpected error. Please try refreshing the page.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="collapse collapse-arrow bg-base-200 mb-4">
                  <summary className="collapse-title text-xs font-medium">
                    Error Details (Development)
                  </summary>
                  <div className="collapse-content text-xs text-left">
                    <pre className="whitespace-pre-wrap text-red-600">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap text-gray-600 mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="card-actions justify-center">
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={this.handleReset}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;