import React, { useEffect, useRef } from "react";
import type { Shape } from "@open-draw/document";
import { OdField, OdIcon } from "@open-draw/ui";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function toColorInputValue(val: string | undefined | null, fallback: string): string {
  if (val && HEX_COLOR_RE.test(val)) return val;
  return fallback;
}

interface ColorPickerRowProps {
  readonly label: string;
  readonly fieldKey: "fill" | "stroke";
  readonly value: string | undefined | null;
  readonly fallbackHex: string;
  readonly shapeId: string;
  readonly onPreview: (val: string | null) => void;
  readonly onCommit: (val: string | null, startVal: string | null) => void;
  readonly onReset: () => void;
}

function ColorPickerRow(props: ColorPickerRowProps): React.JSX.Element {
  const { label, fieldKey, value, fallbackHex, shapeId, onPreview, onCommit, onReset } = props;
  const hexInputId = `shape-${shapeId}-${fieldKey}-hex`;
  const colorPickerId = `shape-${shapeId}-${fieldKey}-color`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sessionRef = useRef<{ start: string | null; active: boolean }>({
    start: null,
    active: false,
  });

  useEffect(() => {
    sessionRef.current = { start: null, active: false };
  }, [shapeId]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onNativeChange = () => {
      if (sessionRef.current.active) {
        const start = sessionRef.current.start;
        sessionRef.current = { start: null, active: false };
        if (el.value !== start) onCommit(el.value, start);
      }
    };
    el.addEventListener("change", onNativeChange);
    return () => el.removeEventListener("change", onNativeChange);
  }, [onCommit]);

  const commitValue = (raw: string | null) => {
    if (sessionRef.current.active) {
      const start = sessionRef.current.start;
      sessionRef.current = { start: null, active: false };
      const val = raw === null ? null : raw.trim().length === 0 ? null : raw.trim();
      if (val !== start) onCommit(val, start);
    }
  };

  const startSession = () => {
    if (!sessionRef.current.active) {
      sessionRef.current = { start: value ?? null, active: true };
    }
  };

  return (
    <OdField label={label} htmlFor={hexInputId}>
      <div style={{ display: "flex", gap: "var(--od-4)", alignItems: "center", width: "100%" }}>
        <input
          ref={inputRef}
          id={colorPickerId}
          type="color"
          className="od-input"
          aria-label={`${label} color picker`}
          value={toColorInputValue(value, fallbackHex)}
          onFocus={startSession}
          onChange={(e) => {
            startSession();
            onPreview(e.target.value);
          }}
          onBlur={() => {
            if (sessionRef.current.active) {
              const start = sessionRef.current.start;
              sessionRef.current = { start: null, active: false };
              const val = inputRef.current?.value ?? value ?? null;
              if (val !== start) onCommit(val, start);
            }
          }}
          style={{
            width: "26px",
            height: "var(--od-control-height)",
            padding: 0,
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
        <input
          id={hexInputId}
          type="text"
          className="od-input"
          placeholder={fallbackHex}
          aria-label={`${label} hex code or none`}
          value={value ?? ""}
          onFocus={startSession}
          onChange={(e) => {
            const raw = e.target.value.trim();
            onPreview(raw.length === 0 ? null : raw);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitValue(e.currentTarget.value);
              (e.target as HTMLElement).blur();
            }
          }}
          onBlur={(e) => commitValue(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "0 var(--od-4)",
            fontSize: "var(--od-text-xs)",
          }}
        />
        <button
          type="button"
          onClick={onReset}
          className="od-btn od-btn--ghost"
          aria-label={`Reset ${label.toLowerCase()} to default`}
          title={`Reset ${label.toLowerCase()} to default`}
          style={{
            height: "var(--od-control-height)",
            width: "24px",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <OdIcon name="undo" />
        </button>
      </div>
    </OdField>
  );
}

interface StrokeWidthRowProps {
  readonly value: number | undefined | null;
  readonly shapeId: string;
  readonly onPreview: (val: number | null) => void;
  readonly onCommit: (val: number | null, startVal: number | null) => void;
  readonly onReset: () => void;
}

function StrokeWidthRow(props: StrokeWidthRowProps): React.JSX.Element {
  const { value, shapeId, onPreview, onCommit, onReset } = props;
  const strokeInputId = `shape-${shapeId}-stroke-width`;
  const sessionRef = useRef<{ start: number | null; active: boolean }>({
    start: null,
    active: false,
  });

  useEffect(() => {
    sessionRef.current = { start: null, active: false };
  }, [shapeId]);

  const startSession = () => {
    if (!sessionRef.current.active) {
      sessionRef.current = { start: value ?? null, active: true };
    }
  };

  const commitValue = (raw: string | null) => {
    if (sessionRef.current.active) {
      const start = sessionRef.current.start;
      sessionRef.current = { start: null, active: false };
      const val = raw === null || raw.trim().length === 0 ? null : Number(raw.trim());
      if (val !== start) onCommit(val, start);
    }
  };

  return (
    <OdField label="Stroke Width" htmlFor={strokeInputId}>
      <div style={{ display: "flex", gap: "var(--od-8)", alignItems: "center", width: "100%" }}>
        <input
          id={strokeInputId}
          type="number"
          min="0"
          max="64"
          className="od-input"
          aria-label="Stroke width in pixels"
          value={value ?? ""}
          placeholder="1"
          onFocus={startSession}
          onChange={(e) => {
            const raw = e.target.value.trim();
            onPreview(raw.length === 0 ? null : Number(raw));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitValue(e.currentTarget.value);
              (e.target as HTMLElement).blur();
            }
          }}
          onBlur={(e) => commitValue(e.target.value)}
          style={{ width: "80px", height: "var(--od-control-height)" }}
        />
        <button
          type="button"
          onClick={onReset}
          className="od-btn od-btn--ghost"
          aria-label="Reset stroke width to default"
          style={{
            height: "var(--od-control-height)",
            padding: "0 var(--od-8)",
            fontSize: "var(--od-text-xs)",
            flexShrink: 0,
          }}
        >
          Default
        </button>
      </div>
    </OdField>
  );
}

export interface ShapeStyleInspectorProps {
  readonly selectedShape: Shape;
  readonly handleStyleChange: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ) => void;
  readonly handleStylePreview: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ) => void;
  readonly handleStyleCommit: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
    startStyle?: {
      fill?: string | null;
      stroke?: string | null;
      strokeWidth?: number | null;
    },
  ) => void;
}

export function ShapeStyleInspector(props: ShapeStyleInspectorProps): React.JSX.Element {
  const { selectedShape, handleStyleChange, handleStylePreview, handleStyleCommit } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-12)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--od-8)" }}>
        <ColorPickerRow
          label="Fill"
          fieldKey="fill"
          value={selectedShape.fill}
          fallbackHex="#ffffff"
          shapeId={selectedShape.id}
          onPreview={(val) => handleStylePreview(val, undefined, undefined)}
          onCommit={(val, start) => handleStyleCommit(val, undefined, undefined, { fill: start })}
          onReset={() => handleStyleChange(null, undefined, undefined)}
        />
        <ColorPickerRow
          label="Stroke"
          fieldKey="stroke"
          value={selectedShape.stroke}
          fallbackHex="#1f2933"
          shapeId={selectedShape.id}
          onPreview={(val) => handleStylePreview(undefined, val, undefined)}
          onCommit={(val, start) => handleStyleCommit(undefined, val, undefined, { stroke: start })}
          onReset={() => handleStyleChange(undefined, null, undefined)}
        />
      </div>
      <StrokeWidthRow
        value={selectedShape.strokeWidth}
        shapeId={selectedShape.id}
        onPreview={(val) => handleStylePreview(undefined, undefined, val)}
        onCommit={(val, start) =>
          handleStyleCommit(undefined, undefined, val, { strokeWidth: start })
        }
        onReset={() => handleStyleChange(undefined, undefined, null)}
      />
    </div>
  );
}
