import React, { useState } from "react";
import type { Shape } from "@open-draw/document";
import {
  OdBadge,
  OdButton,
  OdCard,
  OdField,
  OdIcon,
  OdIconButton,
  OdInputGroup,
} from "@open-draw/ui";

export type AlignmentType = "left" | "center" | "right" | "top" | "middle" | "bottom";

export interface MultiSelectInspectorProps {
  readonly selectedShapes: readonly Shape[];
  readonly onAlign: (alignment: AlignmentType) => void;
  readonly onDistribute: (axis: "horizontal" | "vertical") => void;
  readonly onBatchStyleChange: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ) => void;
  readonly onBatchDelete: () => void;
  readonly onClearSelection: () => void;
}

const ALIGN_ACTIONS = [
  { alignment: "left", name: "align-left", label: "Align Left" },
  { alignment: "center", name: "align-center-horizontal", label: "Align Horizontal Center" },
  { alignment: "right", name: "align-right", label: "Align Right" },
  { alignment: "top", name: "align-top", label: "Align Top" },
  { alignment: "middle", name: "align-center-vertical", label: "Align Vertical Center" },
  { alignment: "bottom", name: "align-bottom", label: "Align Bottom" },
] as const;

const DISTRIBUTE_ACTIONS = [
  { axis: "horizontal", name: "distribute-horizontal", label: "Distribute Horizontally" },
  { axis: "vertical", name: "distribute-vertical", label: "Distribute Vertically" },
] as const;

const COLOR_SWATCH_STYLE: React.CSSProperties = {
  width: "26px",
  height: "var(--od-control-height)",
  padding: 0,
  cursor: "pointer",
  flexShrink: 0,
};

const HEX_INPUT_STYLE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  width: 0,
  padding: "0 var(--od-4)",
  fontSize: "var(--od-text-xs)",
};

const DIVIDER_STYLE: React.CSSProperties = {
  width: "1px",
  height: "16px",
  backgroundColor: "var(--od-border)",
  margin: "0 2px",
  flexShrink: 0,
};

function getSelectionSummary(shapes: readonly Shape[]): string {
  if (shapes.length === 0) return "No items";
  const counts = new Map<string, number>();
  for (const s of shapes) {
    counts.set(s.kind, (counts.get(s.kind) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const [kind, count] of counts.entries()) {
    parts.push(`${count} ${kind}${count > 1 ? "s" : ""}`);
  }
  return parts.join(", ");
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
  const summaryText = getSelectionSummary(selectedShapes);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* 1. SELECTION */}
      <OdCard
        title="Selection"
        collapsible
        defaultExpanded
        action={
          <OdButton
            variant="ghost"
            onClick={onClearSelection}
            style={{ height: "24px", fontSize: "var(--od-text-xs)", padding: "0 var(--od-8)" }}
            aria-label="Clear selection"
          >
            Clear
          </OdButton>
        }
      >
        <OdField label="Selected Items">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--od-8)" }}>
            <OdBadge variant="accent">{selectedShapes.length}</OdBadge>
            <span className="od-meta" style={{ textTransform: "capitalize" }}>
              {summaryText}
            </span>
          </div>
        </OdField>
      </OdCard>

      {/* 2. ALIGN & DISTRIBUTE */}
      <OdCard title="Align & Distribute" collapsible defaultExpanded>
        <OdField
          label="Alignment & Distribution"
          {...(!canDistribute ? { meta: "Distribute: 3+ shapes" } : {})}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--od-4)",
              width: "100%",
            }}
          >
            {ALIGN_ACTIONS.map((item) => (
              <OdIconButton
                key={item.alignment}
                name={item.name}
                aria-label={item.label}
                title={item.label}
                onClick={() => onAlign(item.alignment)}
                style={{ flex: 1, height: "28px", minWidth: 0, padding: 0 }}
              />
            ))}
            <div style={DIVIDER_STYLE} />
            {DISTRIBUTE_ACTIONS.map((item) => (
              <OdIconButton
                key={item.axis}
                name={item.name}
                aria-label={canDistribute ? item.label : `${item.label} (requires 3+ shapes)`}
                title={canDistribute ? item.label : `${item.label} (requires 3+ shapes)`}
                disabled={!canDistribute}
                onClick={() => onDistribute(item.axis)}
                style={{ flex: 1, height: "28px", minWidth: 0, padding: 0 }}
              />
            ))}
          </div>
        </OdField>
      </OdCard>

      {/* 3. SHARED STYLE */}
      <OdCard title="Shared Style" collapsible defaultExpanded>
        <OdField label="Fill" htmlFor="multi-select-fill-hex">
          <div style={{ display: "flex", gap: "var(--od-4)", alignItems: "center", width: "100%" }}>
            <input
              id="multi-select-fill-color"
              type="color"
              className="od-input"
              aria-label="Shared fill color picker"
              value={fill.startsWith("#") && fill.length === 7 ? fill : "#ffffff"}
              onChange={(e) => {
                setFill(e.target.value);
                onBatchStyleChange(e.target.value, undefined, undefined);
              }}
              style={COLOR_SWATCH_STYLE}
            />
            <input
              id="multi-select-fill-hex"
              type="text"
              className="od-input"
              placeholder="#ffffff"
              aria-label="Shared fill hex code"
              value={fill}
              onChange={(e) => {
                const val = e.target.value;
                setFill(val);
                if (val === "" || /^#[0-9a-fA-F]{6}$/.test(val)) {
                  onBatchStyleChange(val || null, undefined, undefined);
                }
              }}
              style={HEX_INPUT_STYLE}
            />
          </div>
        </OdField>

        <OdField label="Stroke" htmlFor="multi-select-stroke-hex">
          <div style={{ display: "flex", gap: "var(--od-4)", alignItems: "center", width: "100%" }}>
            <input
              id="multi-select-stroke-color"
              type="color"
              className="od-input"
              aria-label="Shared stroke color picker"
              value={stroke.startsWith("#") && stroke.length === 7 ? stroke : "#09090b"}
              onChange={(e) => {
                setStroke(e.target.value);
                onBatchStyleChange(undefined, e.target.value, undefined);
              }}
              style={COLOR_SWATCH_STYLE}
            />
            <input
              id="multi-select-stroke-hex"
              type="text"
              className="od-input"
              placeholder="#09090b"
              aria-label="Shared stroke hex code"
              value={stroke}
              onChange={(e) => {
                const val = e.target.value;
                setStroke(val);
                if (val === "" || /^#[0-9a-fA-F]{6}$/.test(val)) {
                  onBatchStyleChange(undefined, val || null, undefined);
                }
              }}
              style={HEX_INPUT_STYLE}
            />
          </div>
        </OdField>

        <OdField label="Stroke Width" htmlFor="multi-select-stroke-width">
          <OdInputGroup
            id="multi-select-stroke-width"
            type="number"
            min={1}
            max={24}
            unit="PX"
            aria-label="Shared stroke width in pixels"
            value={strokeWidth}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!Number.isNaN(val) && val > 0) {
                setStrokeWidth(val);
                onBatchStyleChange(undefined, undefined, val);
              }
            }}
          />
        </OdField>
      </OdCard>

      {/* 4. ACTIONS */}
      <OdCard title="Actions" collapsible defaultExpanded>
        <OdButton
          variant="ghost"
          onClick={onBatchDelete}
          style={{
            width: "100%",
            justifyContent: "center",
            color: "var(--od-danger)",
            borderColor: "var(--od-border)",
            height: "32px",
            fontSize: "var(--od-text-xs)",
            gap: "var(--od-6)",
          }}
        >
          <OdIcon name="delete" size={14} />
          <span>Delete {selectedShapes.length} Shapes</span>
        </OdButton>
      </OdCard>
    </div>
  );
}
