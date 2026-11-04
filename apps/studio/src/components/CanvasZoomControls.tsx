import React from "react";
import { OdSegmentedControl } from "@open-draw/ui";

export interface CanvasZoomControlsProps {
  readonly zoomPercent: number;
  readonly handleZoom: (factor: number) => void;
  readonly handleResetZoom: () => void;
}

export function CanvasZoomControls(props: CanvasZoomControlsProps): React.JSX.Element {
  const { zoomPercent, handleZoom, handleResetZoom } = props;

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

  return (
    <div className="od-canvas-overlay-bottom-right">
      <OdSegmentedControl
        items={zoomItems}
        value="percent"
        aria-label="Canvas zoom controls"
        onSelect={handleZoomSelect}
      />
    </div>
  );
}
