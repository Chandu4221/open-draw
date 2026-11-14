import React from "react";
import type { Shape } from "@open-draw/canvas";
import type { PlatformProfile } from "@open-draw/profiles";
import {
  CONTROL_TYPES,
  getShapeSemantic,
  type SemanticConflict,
  type SemanticDefinition,
} from "@open-draw/semantics";
import { OdField, OdSegmentedControl } from "@open-draw/ui";
import { SemanticSelect } from "./SemanticSelect";

export interface ShapeSemanticSectionProps {
  readonly selectedShape: Shape;
  readonly activeProfile: PlatformProfile | undefined;
  readonly conflict: SemanticConflict | undefined;
  readonly semanticDef: SemanticDefinition | undefined;
  readonly semanticProps: Record<string, string | number | boolean>;
  readonly handleSetSemantic: (semanticIdStr: string) => void;
  readonly handlePropertyChange: (propId: string, val: string | number | boolean) => void;
}

export function ShapeSemanticSection(props: ShapeSemanticSectionProps): React.JSX.Element {
  const {
    selectedShape,
    activeProfile,
    conflict,
    semanticDef,
    semanticProps,
    handleSetSemantic,
    handlePropertyChange,
  } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-12)" }}>
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

      {activeProfile ? (
        <OdField label="Semantic Tag" htmlFor="shape-semantic-tag">
          <SemanticSelect
            id="shape-semantic-tag"
            activeProfile={activeProfile}
            selectedTag={getShapeSemantic(selectedShape)?.id ?? ""}
            onSelect={handleSetSemantic}
          />
        </OdField>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-4)" }}>
          <OdField label="Semantic Tag" htmlFor="shape-semantic-tag">
            <select
              id="shape-semantic-tag"
              className="od-select"
              style={{ width: "100%" }}
              disabled
              value=""
            >
              <option value="">(None / Platform-Agnostic)</option>
            </select>
          </OdField>
          <span className="od-meta" style={{ fontStyle: "italic" }}>
            Set a platform profile on container to enable platform semantics.
          </span>
        </div>
      )}

      {semanticDef?.properties && semanticDef.properties.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
          <span className="od-label">Properties ({semanticDef.displayName})</span>
          {semanticDef.properties.map((schema) => {
            const val = semanticProps[schema.id];
            const propInputId = `shape-prop-${selectedShape.id}-${schema.id}`;
            return (
              <OdField key={schema.id} label={schema.label} htmlFor={propInputId}>
                {schema.control === CONTROL_TYPES.text && (
                  <input
                    id={propInputId}
                    type="text"
                    className="od-input"
                    style={{ width: "100%" }}
                    value={val !== undefined ? String(val) : ""}
                    onChange={(e) => handlePropertyChange(schema.id, e.target.value)}
                  />
                )}
                {schema.control === CONTROL_TYPES.number && (
                  <input
                    id={propInputId}
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
                  <label
                    htmlFor={propInputId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--od-4)",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      id={propInputId}
                      type="checkbox"
                      checked={Boolean(val)}
                      onChange={(e) => handlePropertyChange(schema.id, e.target.checked)}
                    />
                    <span style={{ fontSize: "var(--od-text-sm)" }}>Enabled</span>
                  </label>
                )}
                {schema.control === CONTROL_TYPES.select &&
                  (schema.id === "level" && schema.options && schema.options.length > 0 ? (
                    <OdSegmentedControl
                      items={schema.options.map((opt) => ({
                        id: opt.value,
                        label: opt.label.includes("/")
                          ? (opt.label.split("/")[0] ?? opt.label).trim()
                          : opt.label,
                        tooltip: opt.label,
                        "aria-label": opt.label,
                      }))}
                      value={val !== undefined ? String(val) : (schema.options[0]?.value ?? "")}
                      aria-label={schema.label}
                      className="od-segmented--full"
                      onSelect={(id) => handlePropertyChange(schema.id, id)}
                    />
                  ) : (
                    <select
                      id={propInputId}
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
                  ))}
              </OdField>
            );
          })}
        </div>
      )}
    </div>
  );
}
