import React from "react";
import { OdIcon } from "@open-draw/ui";

export interface SidebarPanelHeaderProps {
  readonly title: string;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly action?: React.ReactNode;
  readonly style?: React.CSSProperties;
}

export function SidebarPanelHeader(props: SidebarPanelHeaderProps): React.JSX.Element {
  const { title, isExpanded, onToggle, action, style } = props;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`Toggle ${title} panel`}
      className="od-panel-header"
      style={style}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "16px",
            height: "16px",
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
            color: "var(--od-text-secondary)",
          }}
        >
          <OdIcon name="chevron" size={14} />
        </span>
        <span className="od-panel-title" style={{ letterSpacing: "0.02em" }}>
          {title}
        </span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
