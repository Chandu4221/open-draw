import React from "react";

export interface CanvasBrandProps {
  readonly onBackToLanding?: (() => void) | undefined;
}

export function CanvasBrand({ onBackToLanding }: CanvasBrandProps): React.JSX.Element {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onBackToLanding?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onBackToLanding?.();
    }
  };

  return (
    <div className="od-canvas-brand" style={{ pointerEvents: "auto" }}>
      <a
        href="#home"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label="OpenDraw Studio - Back to home page"
        title="Back to home page"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
          cursor: onBackToLanding ? "pointer" : "default",
          padding: "4px 8px",
          borderRadius: "var(--od-radius-sm, 4px)",
          color: "var(--od-canvas-text, #09090b)",
          transition: "opacity 0.15s ease",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          OpenDraw
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "2px 6px",
            borderRadius: "4px",
            backgroundColor: "var(--od-surface, #ffffff)",
            border: "1px solid var(--od-border, #e4e4e7)",
            color: "var(--od-text-secondary, #52525b)",
          }}
        >
          Studio
        </span>
      </a>
    </div>
  );
}
