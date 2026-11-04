import React from "react";
import { OdIcon, OdSegmentedControl } from "@open-draw/ui";

export interface CanvasZoomControlsProps {
  readonly zoomPercent: number;
  readonly handleZoom: (factor: number) => void;
  readonly handleResetZoom: () => void;
  readonly showSidebar?: boolean;
  readonly setShowSidebar?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function CanvasZoomControls(props: CanvasZoomControlsProps): React.JSX.Element {
  const { zoomPercent, handleZoom, handleResetZoom, showSidebar, setShowSidebar } = props;

  const zoomItems = [
    { id: "zoom-out", icon: "zoom-out" as const, label: "-" },
    { id: "percent", label: `${zoomPercent}%` },
    { id: "zoom-in", icon: "zoom-in" as const, label: "+" },
    { id: "fit-all", icon: "fit-all" as const, label: "Fit" },
  ];

  const handleZoomSelect = (id: string) => {
    if (id === "zoom-out") handleZoom(1 / 1.2);
    else if (id === "zoom-in") handleZoom(1.2);
    else if (id === "percent" || id === "fit-all") handleResetZoom();
  };

  const isSidebarVisible = showSidebar ?? false;
  const labelText = isSidebarVisible ? "Hide Inspector" : "Show Inspector";

  return (
    <div className="od-canvas-overlay-bottom-right">
      {setShowSidebar && (
        <button
          type="button"
          aria-label={labelText}
          className={`od-panel-toggle-btn ${isSidebarVisible ? "od-panel-toggle-btn--active" : ""}`}
          onClick={() => setShowSidebar((prev) => !prev)}
        >
          <span>{labelText}</span>
          <OdIcon name="panel" size={16} />
        </button>
      )}

      <div className="od-zoom-controls">
        <OdSegmentedControl
          items={zoomItems}
          value="percent"
          aria-label="Canvas zoom controls"
          onSelect={handleZoomSelect}
        />
      </div>
    </div>
  );
}
