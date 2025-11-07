// components/system/ErrorBoundary.tsx

import React, { ErrorInfo, ReactNode } from "react";
import { logCrash } from "../../libs/logging/crashLogger";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

const ErrorFallback: React.FC = () => {
    // Replaced t() with hardcoded English strings. Using hooks that depend on
    // context (like useLocale) is unsafe in a top-level error boundary's fallback UI,
    // as the context provider itself may have crashed.
    return (
        <div
          role="alert"
          className="p-4 border-2 border-red-500 bg-red-50 m-4 rounded-lg text-center"
        >
          <h2 className="font-bold text-red-800 text-lg">
            Something went wrong.
          </h2>
          <p className="text-red-700 my-2">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
    );
}


export class ErrorBoundary extends React.Component<Props, State> {
  // FIX: Added constructor to initialize state and call super(props). This makes `this.state` and `this.props` available throughout the component and resolves the errors.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      (window as any).__lastReactComponentStack = info?.componentStack;
    } catch {}
    logCrash(error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}