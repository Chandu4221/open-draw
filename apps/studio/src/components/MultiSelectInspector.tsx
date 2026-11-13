import React, { useMemo, useState } from "react";
import type { Shape } from "@open-draw/canvas";
import {
  OdBadge,
  OdButton,
  OdCard,
  OdField,
  OdIcon,
  OdIconButton,
  OdInputGroup,
} from "@open-draw/ui";
import {
  ALIGN_ACTIONS,
  COLOR_SWATCH_STYLE,
  computeSharedStyles,
  DISTRIBUTE_ACTIONS,
  DIVIDER_STYLE,
  getSelectionSummary,
  HEX_INPUT_STYLE,
  toColorInputValue,
} from "./multi-select-helpers";

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

export function MultiSelectInspector(props: MultiSelectInspectorProps): React.JSX.Element {
  const {
    selectedShapes,
    onAlign,
    onDistribute,
    onBatchStyleChange,
    onBatchDelete,
    onClearSelection,
  } = props;

  const sharedStyles = useMemo(() => computeSharedStyles(selectedShapes), [selectedShapes]);

  const shapesKey = useMemo(
    () => selectedShapes.map((s) => `${s.id}:${s.fill}:${s.stroke}:${s.strokeWidth}`).join("|"),
    [selectedShapes],
  );

  const [prevShapesKey, setPrevShapesKey] = useState(shapesKey);
  const [fillInput, setFillInput] = useState<string | null>(null);
  const [strokeInput, setStrokeInput] = useState<string | null>(null);
  const [strokeWidthInput, setStrokeWidthInput] = useState<string | null>(null);

  if (shapesKey !== prevShapesKey) {
    setPrevShapesKey(shapesKey);
    setFillInput(null);
    setStrokeInput(null);
    setStrokeWidthInput(null);
  }

  const effectiveFill =
    fillInput !== null ? fillInput : sharedStyles.isFillMixed ? "" : (sharedStyles.fill ?? "");
  const fillPlaceholder = sharedStyles.isFillMixed ? "Mixed" : "#ffffff";
  const fillColorPickerValue = toColorInputValue(fillInput ?? sharedStyles.fill, "#ffffff");

  const effectiveStroke =
    strokeInput !== null
      ? strokeInput
      : sharedStyles.isStrokeMixed
        ? ""
        : (sharedStyles.stroke ?? "");
  const strokePlaceholder = sharedStyles.isStrokeMixed ? "Mixed" : "#09090b";
  const strokeColorPickerValue = toColorInputValue(strokeInput ?? sharedStyles.stroke, "#09090b");

  const effectiveStrokeWidth =
    strokeWidthInput !== null
      ? strokeWidthInput
      : sharedStyles.isStrokeWidthMixed
        ? ""
        : sharedStyles.strokeWidth !== undefined
          ? String(sharedStyles.strokeWidth)
          : "2";
  const strokeWidthPlaceholder = sharedStyles.isStrokeWidthMixed ? "Mixed" : "2";

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
              value={fillColorPickerValue}
              onChange={(e) => {
                setFillInput(e.target.value);
                onBatchStyleChange(e.target.value, undefined, undefined);
              }}
              style={COLOR_SWATCH_STYLE}
            />
            <input
              id="multi-select-fill-hex"
              type="text"
              className="od-input"
              placeholder={fillPlaceholder}
              aria-label="Shared fill hex code"
              value={effectiveFill}
              onChange={(e) => {
                const val = e.target.value;
                setFillInput(val);
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
              value={strokeColorPickerValue}
              onChange={(e) => {
                setStrokeInput(e.target.value);
                onBatchStyleChange(undefined, e.target.value, undefined);
              }}
              style={COLOR_SWATCH_STYLE}
            />
            <input
              id="multi-select-stroke-hex"
              type="text"
              className="od-input"
              placeholder={strokePlaceholder}
              aria-label="Shared stroke hex code"
              value={effectiveStroke}
              onChange={(e) => {
                const val = e.target.value;
                setStrokeInput(val);
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
            value={effectiveStrokeWidth}
            placeholder={strokeWidthPlaceholder}
            onChange={(e) => {
              const val = e.target.value;
              setStrokeWidthInput(val);
              const num = Number(val);
              if (!Number.isNaN(num) && num > 0) {
                onBatchStyleChange(undefined, undefined, num);
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
