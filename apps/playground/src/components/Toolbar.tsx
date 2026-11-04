import React from "react";
import { OdButton, OdIconButton, OdTooltip } from "@open-draw/ui";

export interface ToolbarProps {
  readonly brandLabel?: string;
  readonly handleExportSvg?: () => void;
  readonly handleExportPng?: () => void;
  readonly handleLoad?: () => void;
  readonly onOpenExportModal?: () => void;
  readonly showSidebar: boolean;
  readonly setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Toolbar(props: ToolbarProps): React.JSX.Element {
  const {
    brandLabel = "OpenDraw",
    handleExportSvg,
    handleExportPng,
    handleLoad,
    onOpenExportModal,
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

      {/* Top Right: File actions [open icon] [save svg] [save png] [save icon] and sidebar toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
        {handleLoad && (
          <OdTooltip text="Open document">
            <OdIconButton name="open" aria-label="Open document" ghost onClick={handleLoad} />
          </OdTooltip>
        )}
        {handleExportSvg && (
          <OdButton variant="ghost" onClick={handleExportSvg}>
            Save SVG
          </OdButton>
        )}
        {handleExportPng && (
          <OdButton variant="ghost" onClick={handleExportPng}>
            Save PNG
          </OdButton>
        )}
        {onOpenExportModal && (
          <OdTooltip text="Save / Export wireframe">
            <OdIconButton
              name="save"
              aria-label="Save or export wireframe"
              ghost
              onClick={onOpenExportModal}
            />
          </OdTooltip>
        )}

        {(handleLoad || handleExportSvg || handleExportPng || onOpenExportModal) && (
          <div className="od-divider" />
        )}

        {/* View toggles */}
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
