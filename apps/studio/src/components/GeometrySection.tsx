import React from "react";
import type { BoundingBox } from "@open-draw/contracts";
import { MIN_SHAPE_SIZE } from "@open-draw/canvas";
import type { Shape } from "@open-draw/document";
import { OdField } from "@open-draw/ui";

export interface GeometrySectionProps {
  readonly selectedShape: Shape;
  readonly handleSetBoundingBox: (box: BoundingBox) => void;
}

export function GeometrySection(props: GeometrySectionProps): React.JSX.Element {
  const { selectedShape, handleSetBoundingBox } = props;
  const box = selectedShape.boundingBox;

  const updateX = (val: number) => {
    if (!Number.isNaN(val)) {
      handleSetBoundingBox({ ...box, x: val });
    }
  };

  const updateY = (val: number) => {
    if (!Number.isNaN(val)) {
      handleSetBoundingBox({ ...box, y: val });
    }
  };

  const updateWidth = (val: number) => {
    if (!Number.isNaN(val)) {
      handleSetBoundingBox({ ...box, width: Math.max(MIN_SHAPE_SIZE, Math.round(val)) });
    }
  };

  const updateHeight = (val: number) => {
    if (!Number.isNaN(val)) {
      handleSetBoundingBox({ ...box, height: Math.max(MIN_SHAPE_SIZE, Math.round(val)) });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
      <div className="od-grid-2col">
        <OdField label="X" htmlFor={`geom-x-${selectedShape.id}`}>
          <div className="od-input-badge-wrapper">
            <input
              id={`geom-x-${selectedShape.id}`}
              type="number"
              className="od-input"
              value={Math.round(box.x)}
              aria-label="X position"
              onChange={(e) => updateX(Number(e.target.value))}
            />
            <span className="od-input-badge">PX</span>
          </div>
        </OdField>
        <OdField label="Y" htmlFor={`geom-y-${selectedShape.id}`}>
          <div className="od-input-badge-wrapper">
            <input
              id={`geom-y-${selectedShape.id}`}
              type="number"
              className="od-input"
              value={Math.round(box.y)}
              aria-label="Y position"
              onChange={(e) => updateY(Number(e.target.value))}
            />
            <span className="od-input-badge">PX</span>
          </div>
        </OdField>
      </div>

      <div className="od-grid-2col">
        <OdField label="W" htmlFor={`geom-w-${selectedShape.id}`}>
          <div className="od-input-badge-wrapper">
            <input
              id={`geom-w-${selectedShape.id}`}
              type="number"
              min={MIN_SHAPE_SIZE}
              className="od-input"
              value={Math.round(box.width)}
              aria-label="Width"
              onChange={(e) => updateWidth(Number(e.target.value))}
            />
            <span className="od-input-badge">PX</span>
          </div>
        </OdField>
        <OdField label="H" htmlFor={`geom-h-${selectedShape.id}`}>
          <div className="od-input-badge-wrapper">
            <input
              id={`geom-h-${selectedShape.id}`}
              type="number"
              min={MIN_SHAPE_SIZE}
              className="od-input"
              value={Math.round(box.height)}
              aria-label="Height"
              onChange={(e) => updateHeight(Number(e.target.value))}
            />
            <span className="od-input-badge">PX</span>
          </div>
        </OdField>
      </div>
    </div>
  );
}
