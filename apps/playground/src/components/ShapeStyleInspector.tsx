import React, { useEffect, useRef } from "react";
import type { Shape } from "@open-draw/document";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function toColorInputValue(val: string | undefined | null, fallback: string): string {
  if (val && HEX_COLOR_RE.test(val)) return val;
  return fallback;
}

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "#64748b",
  marginBottom: "2px",
};
const BTN_STYLE: React.CSSProperties = {
  fontSize: "11px",
  padding: "4px 6px",
  cursor: "pointer",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  background: "#f8fafc",
};

interface ColorPickerRowProps {
  readonly label: string;
  readonly value: string | undefined | null;
  readonly fallbackHex: string;
  readonly shapeId: string;
  readonly onPreview: (val: string | null) => void;
  readonly onCommit: (val: string | null, startVal: string | null) => void;
  readonly onReset: () => void;
}

function ColorPickerRow(props: ColorPickerRowProps): React.JSX.Element {
  const { label, value, fallbackHex, shapeId, onPreview, onCommit, onReset } = props;
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
    <div>
      <label style={LABEL_STYLE}>{label}:</label>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          ref={inputRef}
          type="color"
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
          placeholder={`${fallbackHex} or none`}
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
          style={{ flex: 1, padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
        />
        <button type="button" onClick={onReset} style={BTN_STYLE}>
          Reset
        </button>
      </div>
    </div>
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
    <div>
      <label style={LABEL_STYLE}>Stroke Width:</label>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          type="number"
          min="0"
          max="64"
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
          style={{
            width: "80px",
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
          }}
        />
        <button type="button" onClick={onReset} style={BTN_STYLE}>
          Default
        </button>
      </div>
    </div>
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
    <div style={{ marginTop: "16px", marginBottom: "16px" }}>
      <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
        Shape Styling (F1)
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <ColorPickerRow
          label="Fill Color"
          value={selectedShape.fill}
          fallbackHex="#ffffff"
          shapeId={selectedShape.id}
          onPreview={(val) => handleStylePreview(val, undefined, undefined)}
          onCommit={(val, start) => handleStyleCommit(val, undefined, undefined, { fill: start })}
          onReset={() => handleStyleChange(null, undefined, undefined)}
        />
        <ColorPickerRow
          label="Stroke Color"
          value={selectedShape.stroke}
          fallbackHex="#1f2933"
          shapeId={selectedShape.id}
          onPreview={(val) => handleStylePreview(undefined, val, undefined)}
          onCommit={(val, start) => handleStyleCommit(undefined, val, undefined, { stroke: start })}
          onReset={() => handleStyleChange(undefined, null, undefined)}
        />
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
    </div>
  );
}
