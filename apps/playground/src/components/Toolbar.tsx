import React from "react";
import { DEVICE_TYPES, type DeviceType } from "@open-draw/contracts";
import { TOOLS, type ToolId } from "@open-draw/canvas";
import type { PlatformProfile } from "@open-draw/contracts";

export interface ToolbarProps {
  readonly tool: ToolId;
  readonly chooseTool: (tool: ToolId) => void;
  readonly handleExportMarkdown: () => void;
  readonly handleSave: () => void;
  readonly handleLoad: () => void;
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
  readonly statusMessage: string;
}

export function Toolbar(props: ToolbarProps): React.JSX.Element {
  const {
    tool,
    chooseTool,
    handleExportMarkdown,
    handleSave,
    handleLoad,
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
    statusMessage,
  } = props;

  return (
    <header
      style={{
        padding: "8px 16px",
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        flexShrink: 0,
      }}
    >
      <h1 style={{ fontSize: "18px", margin: "0 0 8px 0" }}>OpenDraw Playground</h1>
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: "13px",
        }}
      >
        <button type="button" onClick={() => chooseTool(TOOLS.select)}>
          Select (V)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawRect)}>
          Draw rect (R)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawEllipse)}>
          Draw ellipse (O)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawLine)}>
          Draw line (L)
        </button>
        <button type="button" onClick={() => chooseTool(TOOLS.drawPenPath)}>
          Draw pen (P)
        </button>
        <span>|</span>
        <button type="button" onClick={handleExportMarkdown}>
          Export Markdown
        </button>
        <button type="button" onClick={handleSave}>
          Export JSON
        </button>
        <button type="button" onClick={handleLoad}>
          Load JSON
        </button>
        <span>|</span>
        <span>Tool: {tool}</span>
        {activeProfile?.deviceTypes && activeProfile.deviceTypes.length > 0 && (
          <>
            <span>|</span>
            <span style={{ fontWeight: 600 }}>Device:</span>
            <button
              type="button"
              style={{
                fontWeight: activeDeviceType === undefined ? 700 : 400,
                backgroundColor: activeDeviceType === undefined ? "#2563eb" : undefined,
                color: activeDeviceType === undefined ? "#ffffff" : undefined,
              }}
              onClick={() => handleDeviceChange(undefined)}
            >
              All
            </button>
            {activeProfile.deviceTypes.map((dt) => (
              <button
                key={dt}
                type="button"
                style={{
                  fontWeight: activeDeviceType === dt ? 700 : 400,
                  backgroundColor: activeDeviceType === dt ? "#2563eb" : undefined,
                  color: activeDeviceType === dt ? "#ffffff" : undefined,
                }}
                onClick={() => handleDeviceChange(dt)}
              >
                {DEVICE_TYPES[dt]}
              </button>
            ))}
          </>
        )}
        <span>|</span>
        <span style={{ fontWeight: 600 }}>Zoom:</span>
        <button type="button" onClick={() => handleZoom(0.8)} title="Zoom Out">
          -
        </button>
        <span style={{ minWidth: "38px", textAlign: "center" }}>{zoomPercent}%</span>
        <button type="button" onClick={() => handleZoom(1.25)} title="Zoom In">
          +
        </button>
        <button type="button" onClick={handleResetZoom} title="Reset to 100%">
          Reset
        </button>
        <span>|</span>
        <button
          type="button"
          onClick={toggleShowTagChips}
          style={{
            fontWeight: 600,
            backgroundColor: showTagChips ? "#2563eb" : undefined,
            color: showTagChips ? "#ffffff" : undefined,
          }}
        >
          {showTagChips ? "Hide Chips" : "Show Chips"}
        </button>
        <button
          type="button"
          onClick={() => setShowSidebar((prev) => !prev)}
          style={{
            fontWeight: 600,
            backgroundColor: showSidebar ? undefined : "#e0e7ff",
            borderColor: showSidebar ? undefined : "#6366f1",
          }}
        >
          {showSidebar ? "Hide Sidebar" : "Show Sidebar"}
        </button>
        {statusMessage && (
          <span style={{ color: "#2563eb", marginLeft: "8px" }}>[{statusMessage}]</span>
        )}
      </div>
    </header>
  );
}
