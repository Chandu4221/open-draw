import React from "react";

export interface CanvasBrandProps {
  readonly onBackToLanding?: (() => void) | undefined;
}

export function CanvasBrand({ onBackToLanding }: CanvasBrandProps): React.JSX.Element {
  return (
    <div
      className="od-canvas-brand"
      onClick={onBackToLanding}
      style={{ cursor: onBackToLanding ? "pointer" : "default" }}
      title={onBackToLanding ? "Back to home" : undefined}
    >
      <span
        className="od-label"
        style={{
          fontSize: "var(--od-text-sm)",
          fontWeight: 700,
          color: "var(--od-canvas-text, #09090b)",
          letterSpacing: "0.02em",
        }}
      >
        OpenDraw Studio
      </span>
    </div>
  );
}
