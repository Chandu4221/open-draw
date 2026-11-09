import React from "react";
import { OdButton } from "@open-draw/ui";
import { clearDraftDocument } from "../use-studio-draft";

export interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  readonly onReset?: () => void;
}

export interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const isTest =
      (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV ===
      "test";
    if (!isTest) {
      console.error("OpenDraw Studio render crash caught by ErrorBoundary:", error, errorInfo);
    }
  }

  handleReload = (): void => {
    if (typeof window !== "undefined" && window.location) {
      window.location.reload();
    }
  };

  handleResetDraft = (): void => {
    clearDraftDocument();
    this.props.onReset?.();
    if (typeof window !== "undefined" && window.location) {
      window.location.reload();
    }
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            backgroundColor: "var(--od-bg)",
            color: "var(--od-text)",
            fontFamily: "var(--od-font-family, sans-serif)",
            padding: "var(--od-24)",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              display: "flex",
              flexDirection: "column",
              gap: "var(--od-16)",
              backgroundColor: "var(--od-bg-elevated, #fff)",
              border: "1px solid var(--od-border, #e2e8f0)",
              borderRadius: "var(--od-radius-md, 8px)",
              padding: "var(--od-24)",
              boxShadow: "var(--od-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "var(--od-text-xl, 1.25rem)" }}>
              Something went wrong in Studio
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "var(--od-text-sm, 0.875rem)",
                color: "var(--od-text-secondary, #64748b)",
              }}
            >
              An unexpected render error occurred. You can reload the page or reset the saved draft
              if corrupted state caused the failure.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  margin: 0,
                  padding: "var(--od-12)",
                  backgroundColor: "var(--od-bg-secondary, #f8fafc)",
                  borderRadius: "var(--od-radius-sm, 4px)",
                  fontSize: "var(--od-text-xs, 0.75rem)",
                  color: "var(--od-danger, #ef4444)",
                  overflowX: "auto",
                  textAlign: "left",
                }}
              >
                <code>{this.state.error.message}</code>
              </pre>
            )}
            <div
              style={{
                display: "flex",
                gap: "var(--od-12)",
                justifyContent: "center",
                marginTop: "var(--od-8)",
              }}
            >
              <OdButton variant="ghost" onClick={this.handleReload}>
                Reload
              </OdButton>
              <OdButton variant="primary" onClick={this.handleResetDraft}>
                Reset draft and reload
              </OdButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
