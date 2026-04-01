import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
  copied: boolean; // Track copy status
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleCopy = async () => {
    if (!this.state.error) return;

    const textToCopy = `Error: ${this.state.error.name}: ${this.state.error.message}\n\nStack Trace:\n${this.state.error.stack}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error("Failed to copy logs", err);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 flex flex-col items-center justify-center h-full text-zinc-500 bg-zinc-900/10 italic text-xs relative">
          <p>Something went wrong while rendering this viewer.</p>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-2 text-blue-500 hover:underline"
            >
              Try again
            </button>
            <button
              onClick={() => this.setState({ showDetails: !this.state.showDetails })}
              className="mt-2 text-zinc-600 hover:text-zinc-400"
            >
              {this.state.showDetails ? "Hide details" : "Show details"}
            </button>
          </div>

          {this.state.showDetails && this.state.error && (
            <div className="absolute inset-4 z-50 bg-[#18181b] border border-zinc-700/50 rounded-lg p-4 shadow-2xl overflow-auto select-text not-italic">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-red-400 font-bold uppercase tracking-wider text-[10px]">Development Error Info</h4>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={this.handleCopy}
                    className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded text-zinc-300 transition-colors"
                  >
                    {this.state.copied ? "✓ Copied!" : "Copy Logs"}
                  </button>
                  <button onClick={() => this.setState({ showDetails: false })} className="text-zinc-500 hover:text-white">✕</button>
                </div>
              </div>
              <p className="text-zinc-200 font-mono mb-2 font-bold">{this.state.error.name}: {this.state.error.message}</p>
              <pre className="text-zinc-400 font-mono text-[10px] whitespace-pre-wrap leading-relaxed opacity-80">
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}