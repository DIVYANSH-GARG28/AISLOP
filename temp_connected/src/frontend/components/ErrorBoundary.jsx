import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Application Error Recovered</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                An unexpected component error occurred. The Error Boundary caught it to prevent a blank white screen.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-left text-[11px] font-mono text-slate-700 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
