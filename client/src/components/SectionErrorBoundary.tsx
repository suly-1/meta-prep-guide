/**
 * SectionErrorBoundary — lightweight inline error boundary for individual
 * AI-powered sections. Unlike the global ErrorBoundary (full-page takeover),
 * this renders a compact error card so one failing component cannot crash
 * the entire tab.
 */
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Human-readable label shown in the error card, e.g. "AI Mock Session" */
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const label = this.props.label ?? "This section";
      return (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="text-sm font-semibold">{label} encountered an error</span>
          </div>
          {this.state.error && (
            <pre className="text-xs text-muted-foreground bg-secondary/40 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.reset}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
