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
  } = props;

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
          Name (R-042)
        </label>
        <input
          type="text"
          placeholder={resolveShapeDisplayName(selectedShape, activeProfile)}
          value={selectedShape.label ?? ""}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            boxSizing: "border-box",
          }}
          onChange={(e) => handleSetLabel(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
          Text Content
        </label>
        <input
          type="text"
          placeholder="Text displayed inside shape..."
          value={selectedShape.content ?? ""}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            boxSizing: "border-box",
          }}
          onChange={(e) => handleSetContent(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: "6px", color: "#64748b" }}>
        <strong>Shape ID:</strong> {selectedShape.id}
      </div>
      <div style={{ marginBottom: "12px", fontSize: "12px", color: "#64748b" }}>
        <strong>Container:</strong>{" "}
        {rootShape
          ? `${resolveShapeDisplayName(rootShape, activeProfile)} (${rootShape.id})`
          : "Canvas (Root)"}
      </div>
      {conflict && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #f87171",
            borderRadius: "4px",
            padding: "8px 12px",
            marginBottom: "12px",
            color: "#991b1b",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "2px" }}>
            Semantic Conflict ({conflict.status})
          </div>
          <div style={{ fontSize: "12px", marginBottom: "6px" }}>{conflict.reason}</div>
          <button
            type="button"
            style={{
              fontSize: "11px",
              padding: "2px 6px",
              cursor: "pointer",
              backgroundColor: "#ffffff",
              border: "1px solid #f87171",
              borderRadius: "3px",
              color: "#991b1b",
            }}
            onClick={() => handleSetSemantic("")}
          >
            Clear Tag to Baseline (NONE)
          </button>
        </div>
      )}

      {activeProfile && (
        <div style={{ marginTop: "12px", marginBottom: "12px" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
            Semantic Tag (R-024)
          </label>
          <select
            value={selectedShape.meta.semantic?.id ?? ""}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
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
        </div>
      )}

      {semanticDef?.properties && semanticDef.properties.length > 0 && (
        <div style={{ marginTop: "12px", marginBottom: "12px" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
            Properties ({semanticDef.displayName})
          </label>
          {semanticDef.properties.map((schema) => {
            const val = semanticProps[schema.id];
            return (
              <div key={schema.id} style={{ marginBottom: "8px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 500,
                    marginBottom: "2px",
                  }}
                >
                  {schema.label}
                </label>
                {schema.control === CONTROL_TYPES.text && (
                  <input
                    type="text"
                    value={val !== undefined ? String(val) : ""}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      boxSizing: "border-box",
                    }}
                    onChange={(e) => handlePropertyChange(schema.id, e.target.value)}
                  />
                )}
                {schema.control === CONTROL_TYPES.number && (
                  <input
                    type="number"
                    value={val !== undefined ? Number(val) : ""}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      boxSizing: "border-box",
                    }}
                    onChange={(e) =>
                      handlePropertyChange(
                        schema.id,
                        e.target.value.length === 0 ? 0 : Number(e.target.value),
                      )
                    }
                  />
                )}
                {schema.control === CONTROL_TYPES.toggle && (
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handlePropertyChange(schema.id, e.target.checked)}
                    />
                    <span>Enabled</span>
                  </label>
                )}
                {schema.control === CONTROL_TYPES.select && (
                  <select
                    value={val !== undefined ? String(val) : (schema.options?.[0]?.value ?? "")}
                    style={{
                      width: "100%",
                      padding: "4px 8px",
                      boxSizing: "border-box",
                    }}
                    onChange={(e) => handlePropertyChange(schema.id, e.target.value)}
                  >
                    {schema.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ShapeStyleInspector selectedShape={selectedShape} handleStyleChange={handleStyleChange} />

      <ResponsiveControls
        selectedShape={selectedShape}
        activeProfile={activeProfile}
        handleToggleHiddenOn={handleToggleHiddenOn}
        handleOrderChange={handleOrderChange}
      />
    </div>
  );
}
