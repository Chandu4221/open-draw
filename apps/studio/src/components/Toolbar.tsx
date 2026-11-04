import React from "react";
import { OdButton, OdIconButton, OdTooltip } from "@open-draw/ui";

export interface ToolbarProps {
  readonly brandLabel?: string;
  readonly handleExportSvg?: () => void;
  readonly handleExportPng?: () => void;
  readonly includeLegend?: boolean;
  readonly setIncludeLegend?: (include: boolean) => void;
  readonly handleLoad?: () => void;
  readonly showTagChips: boolean;
  readonly toggleShowTagChips: () => void;
  readonly showSidebar: boolean;
  readonly setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Toolbar(props: ToolbarProps): React.JSX.Element {
  const {
    brandLabel = "OpenDraw Studio",
    handleExportSvg,
    handleExportPng,
    includeLegend,
    setIncludeLegend,
    handleLoad,
    showTagChips,
    toggleShowTagChips,
    showSidebar,
    setShowSidebar,
  } = props;

  return (
    <header
      className="od-panel"
      style={{
        borderRadius: 0,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        padding: "var(--od-8) var(--od-16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--od-12)",
        flexWrap: "wrap",
        zIndex: 10,
      }}
    >
      {/* Top Left: ONLY LOGO */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          className="od-label"
          style={{
            fontSize: "var(--od-text-sm)",
            fontWeight: 700,
            color: "var(--od-text)",
            letterSpacing: "0.02em",
          }}
        >
          {brandLabel}
        </span>
      </div>

      {/* Top Right: Secondary view controls and image export */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
        {handleLoad && (
          <OdButton variant="ghost" onClick={handleLoad}>
            Open
          </OdButton>
        )}
        {handleExportSvg && (
          <OdButton variant="ghost" onClick={handleExportSvg}>
            SVG
          </OdButton>
        )}
        {handleExportPng && (
          <OdButton variant="ghost" onClick={handleExportPng}>
            PNG
          </OdButton>
        )}
        {setIncludeLegend && includeLegend !== undefined && (
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--od-4)",
              cursor: "pointer",
              fontSize: "var(--od-text-xs)",
              color: "var(--od-text-secondary)",
              marginLeft: "var(--od-4)",
            }}
          >
            <input
              type="checkbox"
              checked={includeLegend}
              onChange={(e) => setIncludeLegend(e.target.checked)}
            />
            Legend
          </label>
        )}

        {(handleLoad || handleExportSvg || handleExportPng) && <div className="od-divider" />}

        {/* View toggles */}
        <OdTooltip text={showTagChips ? "Hide Semantic Chips" : "Show Semantic Chips"}>
          <OdIconButton
            name="help"
            aria-label="Toggle Semantic Chips"
            active={showTagChips}
            onClick={toggleShowTagChips}
          />
        </OdTooltip>
        <OdTooltip text={showSidebar ? "Hide Sidebar" : "Show Sidebar"}>
          <OdIconButton
            name="panel"
            aria-label="Toggle Sidebar"
            active={showSidebar}
            onClick={() => setShowSidebar((prev) => !prev)}
          />
        </OdTooltip>
      </div>
    </header>
  );
}
