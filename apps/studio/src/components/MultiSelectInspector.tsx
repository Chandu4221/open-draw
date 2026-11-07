import React, { useState } from "react";
import type { Shape } from "@open-draw/document";
import { OdButton, OdIconButton } from "@open-draw/ui";

export interface MultiSelectInspectorProps {
  readonly selectedShapes: readonly Shape[];
  readonly onAlign: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  readonly onDistribute: (axis: "horizontal" | "vertical") => void;
  readonly onBatchStyleChange: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ) => void;
  readonly onBatchDelete: () => void;
  readonly onClearSelection: () => void;
}

export function MultiSelectInspector(props: MultiSelectInspectorProps): React.JSX.Element {
  const {
    selectedShapes,
    onAlign,
    onDistribute,
    onBatchStyleChange,
    onBatchDelete,
    onClearSelection,
  } = props;

  const [fill, setFill] = useState<string>("#ffffff");
  const [stroke, setStroke] = useState<string>("#09090b");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);

  const canDistribute = selectedShapes.length >= 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-16)" }}>
      {/* Header Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: "var(--od-8)",
          borderBottom: "var(--od-border-width) solid var(--od-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--od-6)" }}>
          <span
            style={{
              padding: "2px 6px",
              borderRadius: "var(--od-radius-sm)",
              backgroundColor: "var(--od-accent)",
              color: "var(--od-text-on-accent)",
              fontSize: "var(--od-text-xs)",
              fontWeight: 700,
            }}
          >
            {selectedShapes.length}
          </span>
          <span className="od-label" style={{ margin: 0 }}>
            Shapes Selected
          </span>
        </div>
        <OdButton
          variant="ghost"
          onClick={onClearSelection}
          style={{ height: "24px", fontSize: "11px" }}
        >
          Clear
        </OdButton>
      </div>

      {/* Alignment Tools */}
      <div>
        <span className="od-label" style={{ display: "block", marginBottom: "var(--od-6)" }}>
          Align
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--od-4)" }}>
          <OdIconButton
            name="align-left"
            aria-label="Align Left"
            title="Align Left"
            onClick={() => onAlign("left")}
            style={{ width: "100%", height: "28px" }}
          />
          <OdIconButton
            name="align-center-horizontal"
            aria-label="Align Horizontal Center"
            title="Align Horizontal Center"
            onClick={() => onAlign("center")}
            style={{ width: "100%", height: "28px" }}
          />
          <OdIconButton
            name="align-right"
            aria-label="Align Right"
            title="Align Right"
            onClick={() => onAlign("right")}
            style={{ width: "100%", height: "28px" }}
          />
          <OdIconButton
            name="align-top"
            aria-label="Align Top"
            title="Align Top"
            onClick={() => onAlign("top")}
            style={{ width: "100%", height: "28px" }}
          />
          <OdIconButton
            name="align-center-vertical"
            aria-label="Align Vertical Center"
            title="Align Vertical Center"
            onClick={() => onAlign("middle")}
            style={{ width: "100%", height: "28px" }}
          />
          <OdIconButton
            name="align-bottom"
            aria-label="Align Bottom"
            title="Align Bottom"
            onClick={() => onAlign("bottom")}
            style={{ width: "100%", height: "28px" }}
          />
        </div>
      </div>

      {/* Distribution Tools */}
      <div>
        <span className="od-label" style={{ display: "block", marginBottom: "var(--od-6)" }}>
          Distribute
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--od-8)" }}>
          <OdIconButton
            name="distribute-horizontal"
            aria-label={canDistribute ? "Distribute Horizontally" : "Need 3+ shapes to distribute"}
            title={canDistribute ? "Distribute Horizontally" : "Need 3+ shapes to distribute"}
            onClick={() => onDistribute("horizontal")}
            disabled={!canDistribute}
            style={{ width: "100%", height: "28px" }}
          />
          <OdIconButton
            name="distribute-vertical"
            aria-label={canDistribute ? "Distribute Vertically" : "Need 3+ shapes to distribute"}
            title={canDistribute ? "Distribute Vertically" : "Need 3+ shapes to distribute"}
            onClick={() => onDistribute("vertical")}
            disabled={!canDistribute}
            style={{ width: "100%", height: "28px" }}
          />
        </div>
      </div>

      {/* Batch Styling */}
      <div>
        <span className="od-label" style={{ display: "block", marginBottom: "var(--od-6)" }}>
          Shared Style
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
            <label className="od-meta" style={{ width: "70px" }}>
              Fill
            </label>
            <input
              type="color"
              value={fill}
              onChange={(e) => {
                setFill(e.target.value);
                onBatchStyleChange(e.target.value, undefined, undefined);
              }}
              style={{
                width: "28px",
                height: "28px",
                padding: 0,
                border: "var(--od-border-width) solid var(--od-border)",
                borderRadius: "var(--od-radius-sm)",
                cursor: "pointer",
              }}
            />
            <span className="od-meta">{fill}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
            <label className="od-meta" style={{ width: "70px" }}>
              Stroke
            </label>
            <input
              type="color"
              value={stroke}
              onChange={(e) => {
                setStroke(e.target.value);
                onBatchStyleChange(undefined, e.target.value, undefined);
              }}
              style={{
                width: "28px",
                height: "28px",
                padding: 0,
                border: "var(--od-border-width) solid var(--od-border)",
                borderRadius: "var(--od-radius-sm)",
                cursor: "pointer",
              }}
            />
            <span className="od-meta">{stroke}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
            <label className="od-meta" style={{ width: "70px" }}>
              Width
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={strokeWidth}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!Number.isNaN(val) && val > 0) {
                  setStrokeWidth(val);
                  onBatchStyleChange(undefined, undefined, val);
                }
              }}
              className="od-input"
              style={{ width: "60px", height: "28px" }}
            />
          </div>
        </div>
      </div>

      {/* Batch Delete */}
      <div style={{ marginTop: "var(--od-8)" }}>
        <OdButton
          onClick={onBatchDelete}
          style={{
            width: "100%",
            justifyContent: "center",
            color: "var(--od-danger)",
            borderColor: "var(--od-danger)",
          }}
        >
          Delete {selectedShapes.length} Shapes
        </OdButton>
      </div>
    </div>
  );
}
