import React, { useEffect, useRef } from "react";
import type { Shape } from "@open-draw/document";

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function toColorInputValue(val: string | undefined | null, fallback: string): string {
  if (val && HEX_COLOR_RE.test(val)) return val;
  return fallback;
}

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
      <span className="od-label" style={{ display: "block", marginBottom: "var(--od-2)" }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: "var(--od-6)", alignItems: "center" }}>
        <input
          ref={inputRef}
          type="color"
          className="od-input"
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
            height: "var(--od-control-height)",
            padding: 0,
            cursor: "pointer",
          }}
        />
        <input
          type="text"
          className="od-input"
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
          style={{ flex: 1 }}
        />
        <button
          type="button"
          onClick={onReset}
          className="od-btn od-btn--ghost"
          style={{ height: "24px", padding: "0 6px", fontSize: "11px" }}
        >
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
      <span className="od-label" style={{ display: "block", marginBottom: "var(--od-2)" }}>
        Stroke Width
      </span>
      <div style={{ display: "flex", gap: "var(--od-6)", alignItems: "center" }}>
        <input
          type="number"
          min="0"
          max="64"
          className="od-input"
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
          style={{ width: "80px" }}
        />
        <button
          type="button"
          onClick={onReset}
          className="od-btn od-btn--ghost"
          style={{ height: "24px", padding: "0 6px", fontSize: "11px" }}
        >
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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
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
  );
}
