import React from "react";
import type { Shape } from "@open-draw/document";

export interface ShapeStyleInspectorProps {
  readonly selectedShape: Shape;
  readonly handleStyleChange: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ) => void;
}

export function ShapeStyleInspector(props: ShapeStyleInspectorProps): React.JSX.Element {
  const { selectedShape, handleStyleChange } = props;
  const currentFill = selectedShape.fill ?? "";
  const currentStroke = selectedShape.stroke ?? "#1f2933";

  return (
    <div style={{ marginTop: "16px", marginBottom: "16px" }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
        Shape Styling (F1)
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#64748b",
              marginBottom: "2px",
            }}
          >
            Fill Color:
          </label>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              type="color"
              value={currentFill && currentFill !== "none" ? currentFill : "#ffffff"}
              onChange={(e) => handleStyleChange(e.target.value, undefined, undefined)}
              style={{
                width: "32px",
                height: "28px",
                padding: 0,
                cursor: "pointer",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
              }}
            />
            <input
              type="text"
              placeholder="#ffffff or none"
              value={selectedShape.fill ?? ""}
              onChange={(e) => {
                const val = e.target.value.trim();
                handleStyleChange(val.length === 0 ? null : val, undefined, undefined);
              }}
              style={{
                flex: 1,
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
            <button
              type="button"
              onClick={() => handleStyleChange(null, undefined, undefined)}
              style={{
                fontSize: "11px",
                padding: "4px 6px",
                cursor: "pointer",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                background: "#f8fafc",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#64748b",
              marginBottom: "2px",
            }}
          >
            Stroke Color:
          </label>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              type="color"
              value={currentStroke && currentStroke !== "none" ? currentStroke : "#1f2933"}
              onChange={(e) => handleStyleChange(undefined, e.target.value, undefined)}
              style={{
                width: "32px",
                height: "28px",
                padding: 0,
                cursor: "pointer",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
              }}
            />
            <input
              type="text"
              placeholder="#1f2933 or none"
              value={selectedShape.stroke ?? ""}
              onChange={(e) => {
                const val = e.target.value.trim();
                handleStyleChange(undefined, val.length === 0 ? null : val, undefined);
              }}
              style={{
                flex: 1,
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
            <button
              type="button"
              onClick={() => handleStyleChange(undefined, null, undefined)}
              style={{
                fontSize: "11px",
                padding: "4px 6px",
                cursor: "pointer",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                background: "#f8fafc",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "#64748b",
              marginBottom: "2px",
            }}
          >
            Stroke Width:
          </label>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              type="number"
              min="0"
              max="64"
              value={selectedShape.strokeWidth ?? ""}
              placeholder="1"
              onChange={(e) => {
                const val = e.target.value.trim();
                handleStyleChange(undefined, undefined, val.length === 0 ? null : Number(val));
              }}
              style={{
                width: "80px",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            />
            <button
              type="button"
              onClick={() => handleStyleChange(undefined, undefined, null)}
              style={{
                fontSize: "11px",
                padding: "4px 6px",
                cursor: "pointer",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                background: "#f8fafc",
              }}
            >
              Default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
