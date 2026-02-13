import React from "react";

type State = { hasError: boolean; error?: Error };

type Props = { children: React.ReactNode; inline?: boolean };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App error:", error, errorInfo);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError && this.state.error) {
      const err = this.state.error;
      const message = err?.message || String(err);
      const stack = err?.stack;
      const inline = this.props.inline;

      if (inline) {
        return (
          <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            Wallet unavailable{" "}
            <button type="button" className="btn btn--ghost" style={{ padding: "0 0.25rem" }} onClick={this.reset}>
              Retry
            </button>
          </span>
        );
      }

      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            background: "#0a0a0d",
            color: "#f4f4f6",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <pre
            style={{
              maxWidth: "min(90vw, 640px)",
              minHeight: "4rem",
              overflow: "auto",
              padding: "1rem",
              background: "#16161e",
              borderRadius: "8px",
              fontSize: "0.875rem",
              color: "#ef4444",
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {message}
            {stack ? `\n\n${stack}` : ""}
          </pre>
          <button
            type="button"
            onClick={this.reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
