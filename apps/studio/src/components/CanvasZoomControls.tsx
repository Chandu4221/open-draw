import React from "react";
import { OdButton, OdIconButton, OdTooltip } from "@open-draw/ui";

export interface CanvasZoomControlsProps {
  readonly zoomPercent: number;
  readonly handleZoom: (factor: number) => void;
  readonly handleResetZoom: () => void;
}

export function CanvasZoomControls(props: CanvasZoomControlsProps): React.JSX.Element {
  const { zoomPercent, handleZoom, handleResetZoom } = props;

  return (
    <div className="od-canvas-overlay-bottom-right">
      <div className="od-zoom-controls" role="toolbar" aria-label="Canvas zoom controls">
        <OdTooltip text="Zoom out (-)">
          <OdIconButton
            name="zoom-out"
            aria-label="Zoom out"
            ghost
            onClick={() => handleZoom(1 / 1.2)}
          />
        </OdTooltip>
        <OdTooltip text="Reset zoom (100%)">
          <OdButton
            variant="ghost"
            onClick={handleResetZoom}
            aria-label={`Zoom level: ${zoomPercent}%, click to reset`}
            style={{
              padding: "0 var(--od-6)",
              minWidth: "46px",
              height: "var(--od-control-height)",
              fontSize: "var(--od-text-xs)",
              fontWeight: 600,
            }}
          >
            {zoomPercent}%
          </OdButton>
        </OdTooltip>
        <OdTooltip text="Zoom in (+)">
          <OdIconButton name="zoom-in" aria-label="Zoom in" ghost onClick={() => handleZoom(1.2)} />
        </OdTooltip>
        <OdTooltip text="Fit view">
          <OdIconButton name="fit-all" aria-label="Fit view" ghost onClick={handleResetZoom} />
        </OdTooltip>
      </div>
    </div>
  );
}
