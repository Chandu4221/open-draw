import React from "react";
import type {
  DeviceType,
  PlatformProfile,
  SemanticConflict,
  SemanticDefinition,
} from "@open-draw/contracts";
import { CONTROL_TYPES } from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { resolveShapeDisplayName } from "@open-draw/semantics";
import { OdField } from "@open-draw/ui";
import { ResponsiveControls } from "./ResponsiveControls";
import { ShapeStyleInspector } from "./ShapeStyleInspector";

export interface ShapeInspectorProps {
  readonly selectedShape: Shape;
  readonly rootShape: Shape | undefined;
  readonly activeProfile: PlatformProfile | undefined;
  readonly conflict: SemanticConflict | undefined;
  readonly semanticDef: SemanticDefinition | undefined;
  readonly semanticProps: Record<string, string | number | boolean>;
  readonly handleSetLabel: (labelStr: string) => void;
  readonly handleSetContent: (contentStr: string) => void;
  readonly handleSetSemantic: (semanticIdStr: string) => void;
  readonly handlePropertyChange: (propId: string, val: string | number | boolean) => void;
  readonly handleToggleHiddenOn: (dt: DeviceType) => void;
  readonly handleOrderChange: (dt: DeviceType, valStr: string) => void;
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

export function ShapeInspector(props: ShapeInspectorProps): React.JSX.Element {
  const {
    selectedShape,
    rootShape,
    activeProfile,
    conflict,
    semanticDef,
    semanticProps,
    handleSetLabel,
    handleSetContent,
    handleSetSemantic,
    handlePropertyChange,
    handleToggleHiddenOn,
    handleOrderChange,
    handleStyleChange,
    handleStylePreview,
    handleStyleCommit,
  } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-12)" }}>
      {/* IDENTITY */}
      <span className="od-label">Identity</span>

      <OdField label="Name">
        <input
          type="text"
          className="od-input"
          style={{ width: "100%" }}
          placeholder={resolveShapeDisplayName(selectedShape, activeProfile)}
          value={selectedShape.label ?? ""}
          onChange={(e) => handleSetLabel(e.target.value)}
        />
      </OdField>

      <OdField label="Content">
        <input
          type="text"
          className="od-input"
          style={{ width: "100%" }}
          placeholder="Text displayed inside shape..."
          value={selectedShape.content ?? ""}
          onChange={(e) => handleSetContent(e.target.value)}
        />
      </OdField>

      <span className="od-meta">ID: {selectedShape.id}</span>
      <span className="od-meta">
        Container:{" "}
        {rootShape
          ? `${resolveShapeDisplayName(rootShape, activeProfile)} (${rootShape.id})`
          : "Canvas"}
      </span>

      {/* SEMANTICS */}
      <div className="od-divider" style={{ width: "100%", margin: "var(--od-4) 0" }} />
      <span className="od-label">Semantics</span>

      {conflict && (
        <div
          style={{
            backgroundColor: "var(--od-danger-soft)",
            border: "var(--od-border-width) solid var(--od-danger)",
            borderRadius: "var(--od-radius-sm)",
            padding: "var(--od-8)",
            color: "var(--od-danger)",
            fontSize: "var(--od-text-xs)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "var(--od-2)" }}>
            Conflict: {conflict.status}
          </div>
          <div style={{ marginBottom: "var(--od-4)" }}>{conflict.reason}</div>
          <button
            type="button"
            className="od-btn od-btn--ghost"
            style={{ height: "22px", padding: "0 6px", fontSize: "11px" }}
            onClick={() => handleSetSemantic("")}
          >
            Clear Tag
          </button>
        </div>
      )}

      {activeProfile && (
        <OdField label="Semantic Tag">
          <select
            className="od-select"
            style={{ width: "100%" }}
            value={selectedShape.meta.semantic?.id ?? ""}
            onChange={(e) => handleSetSemantic(e.target.value)}
          >
            <option value="">(None / Baseline)</option>
            {Object.values(activeProfile.semantics).map((def) => (
              <option key={def.id} value={def.id}>
                {def.displayName} ({def.id})
              </option>
            ))}
            {selectedShape.meta.semantic &&
              !activeProfile.semantics[selectedShape.meta.semantic.id] && (
                <option value={selectedShape.meta.semantic.id}>
                  [Foreign] {selectedShape.meta.semantic.id} ({selectedShape.meta.semantic.platform}
                  )
                </option>
              )}
          </select>
        </OdField>
      )}

      {semanticDef?.properties && semanticDef.properties.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
          <span className="od-label" style={{ fontSize: "10px" }}>
            Properties ({semanticDef.displayName})
          </span>
          {semanticDef.properties.map((schema) => {
            const val = semanticProps[schema.id];
            return (
              <OdField key={schema.id} label={schema.label}>
                {schema.control === CONTROL_TYPES.text && (
                  <input
                    type="text"
                    className="od-input"
                    style={{ width: "100%" }}
                    value={val !== undefined ? String(val) : ""}
                    onChange={(e) => handlePropertyChange(schema.id, e.target.value)}
                  />
                )}
                {schema.control === CONTROL_TYPES.number && (
                  <input
                    type="number"
                    className="od-input"
                    style={{ width: "100%" }}
                    value={val !== undefined ? Number(val) : ""}
                    onChange={(e) =>
                      handlePropertyChange(
                        schema.id,
                        e.target.value.length === 0 ? 0 : Number(e.target.value),
                      )
                    }
                  />
                )}
                {schema.control === CONTROL_TYPES.toggle && (
                  <label style={{ display: "flex", alignItems: "center", gap: "var(--od-4)" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handlePropertyChange(schema.id, e.target.checked)}
                    />
                    <span style={{ fontSize: "var(--od-text-sm)" }}>Enabled</span>
                  </label>
                )}
                {schema.control === CONTROL_TYPES.select && (
                  <select
                    className="od-select"
                    style={{ width: "100%" }}
                    value={val !== undefined ? String(val) : (schema.options?.[0]?.value ?? "")}
                    onChange={(e) => handlePropertyChange(schema.id, e.target.value)}
                  >
                    {schema.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </OdField>
            );
          })}
        </div>
      )}

      {/* STYLE */}
      <div className="od-divider" style={{ width: "100%", margin: "var(--od-4) 0" }} />
      <span className="od-label">Style</span>
      <ShapeStyleInspector
        selectedShape={selectedShape}
        handleStyleChange={handleStyleChange}
        handleStylePreview={handleStylePreview}
        handleStyleCommit={handleStyleCommit}
      />

      {/* RESPONSIVE */}
      <div className="od-divider" style={{ width: "100%", margin: "var(--od-4) 0" }} />
      <span className="od-label">Responsive</span>
      <ResponsiveControls
        selectedShape={selectedShape}
        activeProfile={activeProfile}
        handleToggleHiddenOn={handleToggleHiddenOn}
        handleOrderChange={handleOrderChange}
      />
    </div>
  );
}
