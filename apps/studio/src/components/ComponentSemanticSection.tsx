import React, { useMemo } from "react";
import type { PlatformProfile, SemanticConflict, SemanticDefinition } from "@open-draw/contracts";
import { CONTROL_TYPES } from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { OdField } from "@open-draw/ui";
import {
  groupProfileSemantics,
  loadRecentSemanticTags,
  resolveRecentDefinitions,
  saveRecentSemanticTag,
} from "./semantic-select-helpers";
import { ShapeStyleInspector } from "./ShapeStyleInspector";

export interface ComponentSemanticSectionProps {
  readonly selectedShape: Shape;
  readonly activeProfile: PlatformProfile | undefined;
  readonly conflict: SemanticConflict | undefined;
  readonly semanticDef: SemanticDefinition | undefined;
  readonly semanticProps: Record<string, string | number | boolean>;
  readonly handleSetContent: (contentStr: string) => void;
  readonly handleSetSemantic: (semanticIdStr: string) => void;
  readonly handlePropertyChange: (propId: string, val: string | number | boolean) => void;
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

export function ComponentSemanticSection(props: ComponentSemanticSectionProps): React.JSX.Element {
  const {
    selectedShape,
    activeProfile,
    conflict,
    semanticDef,
    semanticProps,
    handleSetContent,
    handleSetSemantic,
    handlePropertyChange,
    handleStyleChange,
    handleStylePreview,
    handleStyleCommit,
  } = props;

  const groupedSemantics = useMemo(() => groupProfileSemantics(activeProfile), [activeProfile]);

  const recentDefs = useMemo(() => {
    const tags = loadRecentSemanticTags(activeProfile?.id);
    return resolveRecentDefinitions(activeProfile, tags);
  }, [activeProfile]);

  const onSelectSemantic = (semanticId: string) => {
    if (semanticId) {
      saveRecentSemanticTag(semanticId, activeProfile?.id);
    }
    handleSetSemantic(semanticId);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-12)" }}>
      <OdField label="Content" htmlFor="component-content">
        <input
          id="component-content"
          type="text"
          className="od-input"
          style={{ width: "100%" }}
          placeholder="Text displayed inside component..."
          value={selectedShape.content ?? ""}
          onChange={(e) => handleSetContent(e.target.value)}
        />
      </OdField>

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
        <OdField label="Semantic Tag" htmlFor="component-semantic-tag">
          <select
            id="component-semantic-tag"
            className="od-select"
            style={{ width: "100%" }}
            value={selectedShape.meta.semantic?.id ?? ""}
            onChange={(e) => onSelectSemantic(e.target.value)}
          >
            <option value="">(None / Baseline)</option>
            {recentDefs.length > 0 && (
              <optgroup label="── Recently Used ──">
                {recentDefs.map((def) => (
                  <option key={`recent-${def.id}`} value={def.id}>
                    {def.displayName} ({def.id})
                  </option>
                ))}
              </optgroup>
            )}
            {groupedSemantics.map((group) => (
              <optgroup key={group.category} label={`── ${group.title} (${group.items.length}) ──`}>
                {group.items.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.displayName} ({def.id})
                  </option>
                ))}
              </optgroup>
            ))}
            {selectedShape.meta.semantic &&
              !activeProfile.semantics[selectedShape.meta.semantic.id] && (
                <optgroup label="── Foreign Platform ──">
                  <option value={selectedShape.meta.semantic.id}>
                    [Foreign] {selectedShape.meta.semantic.id} (
                    {selectedShape.meta.semantic.platform})
                  </option>
                </optgroup>
              )}
          </select>
        </OdField>
      )}

      {semanticDef?.properties && semanticDef.properties.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}>
          <span className="od-label">Properties ({semanticDef.displayName})</span>
          {semanticDef.properties.map((schema) => {
            const val = semanticProps[schema.id];
            const propInputId = `component-prop-${selectedShape.id}-${schema.id}`;
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
                {schema.control === CONTROL_TYPES.select && (
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
                )}
              </OdField>
            );
          })}
        </div>
      )}

      <div className="od-divider od-divider--horizontal" />
      <h3 className="od-section-header">Style</h3>
      <ShapeStyleInspector
        selectedShape={selectedShape}
        handleStyleChange={handleStyleChange}
        handleStylePreview={handleStylePreview}
        handleStyleCommit={handleStyleCommit}
      />
    </div>
  );
}
