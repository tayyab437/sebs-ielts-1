import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error caught by top-level ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });

    // Detect if this was a chunk loading / dynamic import failure from a new deployment
    const isChunkLoadError = 
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("dynamically imported module") ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Loading CSS chunk");

    if (isChunkLoadError) {
      const alreadyRefreshed = sessionStorage.getItem("chunk_retry_refreshed") === "true";
      if (!alreadyRefreshed) {
        sessionStorage.setItem("chunk_retry_refreshed", "true");
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    try {
      sessionStorage.removeItem("chunk_retry_refreshed");
      sessionStorage.removeItem("page-has-been-force-refreshed");
    } catch (_) {}
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      sessionStorage.removeItem("chunk_retry_refreshed");
      sessionStorage.removeItem("page-has-been-force-refreshed");
    } catch (_) {}
    window.location.href = "/";
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Error clearing storage:", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-8 shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-black tracking-tight text-white uppercase">
                Application Recovery
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected component error occurred. You can reload the page or clear local cache to resume your learning session.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-left overflow-x-auto max-h-32">
                <p className="text-[11px] font-mono text-red-400 break-words font-semibold">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase tracking-wider transition"
              >
                <Home className="w-3.5 h-3.5" />
                Go to Home
              </button>
            </div>

            <div className="pt-2 border-t border-slate-700/50">
              <button
                onClick={this.handleClearAndReload}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline font-medium transition"
              >
                Clear cached local data and restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
