import React from "react";
import { DEVICE_TYPES, type DeviceType } from "@open-draw/contracts";
import { TOOLS, type ToolId } from "@open-draw/canvas";
import type { PlatformProfile } from "@open-draw/contracts";
import {
  OdButton,
  OdIconButton,
  OdSegmentedControl,
  OdTooltip,
  type IconId,
  type OdSegmentedItem,
} from "@open-draw/ui";

export interface ToolbarProps {
  readonly tool: ToolId;
  readonly chooseTool: (tool: ToolId) => void;
  readonly handleExportMarkdown: () => void;
  readonly handleExportSvg: () => void;
  readonly handleExportPng: () => void;
  readonly includeLegend: boolean;
  readonly setIncludeLegend: (include: boolean) => void;
  readonly handleSave: () => void;
  readonly handleLoad: () => void;
  readonly handleUndo?: () => void;
  readonly handleRedo?: () => void;
  readonly handleDuplicate?: () => void;
  readonly handleDelete?: () => void;
  readonly activeProfile: PlatformProfile | undefined;
  readonly activeDeviceType: DeviceType | undefined;
  readonly handleDeviceChange: (deviceType?: DeviceType) => void;
  readonly handleZoom: (factor: number) => void;
  readonly handleResetZoom: () => void;
  readonly zoomPercent: number;
  readonly showTagChips: boolean;
  readonly toggleShowTagChips: () => void;
  readonly showSidebar: boolean;
  readonly setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

const DEVICE_ICON_MAP: Record<DeviceType, IconId> = {
  mobile: "smartphone",
  tablet: "tablet",
  laptop: "laptop",
  desktop: "desktop",
  largeScreen: "monitor",
};

export function Toolbar(props: ToolbarProps): React.JSX.Element {
  const {
    tool,
    chooseTool,
    handleExportMarkdown,
    handleExportSvg,
    handleExportPng,
    includeLegend,
    setIncludeLegend,
    handleSave,
    handleLoad,
    handleUndo,
    handleRedo,
    handleDuplicate,
    handleDelete,
    activeProfile,
    activeDeviceType,
    handleDeviceChange,
    handleZoom,
    handleResetZoom,
    zoomPercent,
    showTagChips,
    toggleShowTagChips,
    showSidebar,
    setShowSidebar,
  } = props;

  const zoomItems: readonly OdSegmentedItem<string>[] = [
    { id: "zoom-out", icon: "zoom-out", tooltip: "Zoom out" },
    { id: "percent", label: `${zoomPercent}%`, tooltip: "Reset zoom" },
    { id: "zoom-in", icon: "zoom-in", tooltip: "Zoom in" },
    { id: "fit-all", icon: "fit-all", tooltip: "Fit to view / Reset" },
  ];

  const handleZoomSelect = (id: string): void => {
    if (id === "zoom-out") handleZoom(0.8);
    else if (id === "zoom-in") handleZoom(1.25);
    else handleResetZoom();
  };

  const deviceItems: readonly OdSegmentedItem<string>[] = [
    { id: "all", label: "All", tooltip: "All device types" },
    ...(activeProfile?.deviceTypes ?? []).map((dt) => ({
      id: dt,
      icon: DEVICE_ICON_MAP[dt] ?? "monitor",
      tooltip: DEVICE_TYPES[dt],
      "aria-label": DEVICE_TYPES[dt],
    })),
  ];

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
      <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
        <span
          className="od-label"
          style={{ fontSize: "var(--od-text-sm)", fontWeight: 700, marginRight: "var(--od-8)" }}
        >
          OpenDraw
        </span>

        {/* Group 1: Tools */}
        <div
          role="toolbar"
          aria-label="Drawing Tools"
          style={{ display: "flex", alignItems: "center", gap: "var(--od-4)" }}
        >
          <OdTooltip text="Select (V)">
            <OdIconButton
              name="select-tool"
              aria-label="Select tool (V)"
              active={tool === TOOLS.select}
              onClick={() => chooseTool(TOOLS.select)}
            />
          </OdTooltip>
          <OdTooltip text="Rectangle (R)">
            <OdIconButton
              name="rect-tool"
              aria-label="Draw rectangle (R)"
              active={tool === TOOLS.drawRect}
              onClick={() => chooseTool(TOOLS.drawRect)}
            />
          </OdTooltip>
          <OdTooltip text="Ellipse (O)">
            <OdIconButton
              name="ellipse-tool"
              aria-label="Draw ellipse (O)"
              active={tool === TOOLS.drawEllipse}
              onClick={() => chooseTool(TOOLS.drawEllipse)}
            />
          </OdTooltip>
          <OdTooltip text="Line (L)">
            <OdIconButton
              name="line-tool"
              aria-label="Draw line (L)"
              active={tool === TOOLS.drawLine}
              onClick={() => chooseTool(TOOLS.drawLine)}
            />
          </OdTooltip>
          <OdTooltip text="Pen (P)">
            <OdIconButton
              name="pen-tool"
              aria-label="Draw pen path (P)"
              active={tool === TOOLS.drawPenPath}
              onClick={() => chooseTool(TOOLS.drawPenPath)}
            />
          </OdTooltip>
        </div>

        <div className="od-divider" />

        {/* Group 2: Document */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--od-4)" }}>
          <OdButton variant="ghost" onClick={handleSave}>
            Save
          </OdButton>
          <OdButton variant="ghost" onClick={handleLoad}>
            Open
          </OdButton>
          <OdButton variant="ghost" onClick={handleExportMarkdown}>
            MD
          </OdButton>
          <OdButton variant="ghost" onClick={handleExportSvg}>
            SVG
          </OdButton>
          <OdButton variant="ghost" onClick={handleExportPng}>
            PNG
          </OdButton>
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
        </div>

        {/* Group 3: Edit actions */}
        {(handleUndo || handleRedo || handleDuplicate || handleDelete) && (
          <>
            <div className="od-divider" />
            <div style={{ display: "flex", alignItems: "center", gap: "var(--od-4)" }}>
              {handleUndo && (
                <OdTooltip text="Undo (Ctrl+Z)">
                  <OdIconButton name="undo" aria-label="Undo" ghost onClick={handleUndo} />
                </OdTooltip>
              )}
              {handleRedo && (
                <OdTooltip text="Redo (Ctrl+Y)">
                  <OdIconButton name="redo" aria-label="Redo" ghost onClick={handleRedo} />
                </OdTooltip>
              )}
              {handleDuplicate && (
                <OdTooltip text="Duplicate (Ctrl+D)">
                  <OdIconButton
                    name="duplicate"
                    aria-label="Duplicate"
                    ghost
                    onClick={handleDuplicate}
                  />
                </OdTooltip>
              )}
              {handleDelete && (
                <OdTooltip text="Delete (Del)">
                  <OdIconButton name="delete" aria-label="Delete" ghost onClick={handleDelete} />
                </OdTooltip>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
        {/* Group 4: Device form factor */}
        {activeProfile?.deviceTypes && activeProfile.deviceTypes.length > 0 && (
          <OdSegmentedControl
            items={deviceItems}
            value={activeDeviceType ?? "all"}
            aria-label="Device form factor"
            onSelect={(id) => handleDeviceChange(id === "all" ? undefined : (id as DeviceType))}
          />
        )}

        {/* Group 5: Zoom */}
        <OdSegmentedControl
          items={zoomItems}
          value="percent"
          aria-label="Zoom controls"
          onSelect={handleZoomSelect}
        />

        <div className="od-divider" />

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
