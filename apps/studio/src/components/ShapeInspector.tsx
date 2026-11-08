import React, { useRef } from "react";
import type {
  BoundingBox,
  DeviceType,
  PlatformProfile,
  SemanticConflict,
  SemanticDefinition,
} from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { resolveShapeDisplayName } from "@open-draw/semantics";
import { OdCard, OdField } from "@open-draw/ui";
import { GeometrySection } from "./GeometrySection";
import { ShapeSemanticSection } from "./ShapeSemanticSection";
import { ShapeStyleInspector } from "./ShapeStyleInspector";

export interface ShapeInspectorProps {
  readonly selectedShape: Shape;
  readonly rootShape: Shape | undefined;
  readonly activeProfile: PlatformProfile | undefined;
  readonly conflict: SemanticConflict | undefined;
  readonly semanticDef: SemanticDefinition | undefined;
  readonly semanticProps: Record<string, string | number | boolean>;
  readonly handleSetLabel: (
    labelStr: string,
    options?: { record?: boolean; startVal?: string | null },
  ) => void;
  readonly handleSetContent: (
    contentStr: string,
    options?: { record?: boolean; startVal?: string | null },
  ) => void;
  readonly handleSetSemantic: (semanticIdStr: string) => void;
  readonly handlePropertyChange: (propId: string, val: string | number | boolean) => void;
  readonly handleToggleHiddenOn?: ((dt: DeviceType) => void) | undefined;
  readonly handleOrderChange?: ((dt: DeviceType, valStr: string) => void) | undefined;
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
  readonly handleSetBoundingBox?: ((box: BoundingBox) => void) | undefined;
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
    handleStyleChange,
    handleStylePreview,
    handleStyleCommit,
    handleSetBoundingBox,
  } = props;

  const labelStartRef = useRef<string | null>(null);
  const contentStartRef = useRef<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* 1. IDENTITY */}
      <OdCard title="Identity" collapsible defaultExpanded>
        <OdField label="Name" htmlFor="shape-name">
          <input
            id="shape-name"
            type="text"
            className="od-input"
            style={{ width: "100%" }}
            placeholder={resolveShapeDisplayName(selectedShape, activeProfile)}
            value={selectedShape.label ?? ""}
            onFocus={() => {
              labelStartRef.current = selectedShape.label ?? null;
            }}
            onChange={(e) => handleSetLabel(e.target.value, { record: false })}
            onBlur={(e) => {
              const val = e.target.value.trim().length === 0 ? null : e.target.value;
              if (labelStartRef.current !== val) {
                handleSetLabel(e.target.value, { record: true, startVal: labelStartRef.current });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        </OdField>

        <OdField label="Content" htmlFor="shape-content">
          <input
            id="shape-content"
            type="text"
            className="od-input"
            style={{ width: "100%" }}
            placeholder="Text displayed inside shape..."
            value={selectedShape.content ?? ""}
            onFocus={() => {
              contentStartRef.current = selectedShape.content ?? null;
            }}
            onChange={(e) => handleSetContent(e.target.value, { record: false })}
            onBlur={(e) => {
              const val = e.target.value.trim().length === 0 ? null : e.target.value;
              if (contentStartRef.current !== val) {
                handleSetContent(e.target.value, {
                  record: true,
                  startVal: contentStartRef.current,
                });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        </OdField>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-2)" }}>
          <span className="od-meta">ID: {selectedShape.id}</span>
          <span className="od-meta">
            Container:{" "}
            {rootShape
              ? `${resolveShapeDisplayName(rootShape, activeProfile)} (${rootShape.id})`
              : "Canvas"}
          </span>
        </div>
      </OdCard>

      {/* 2. GEOMETRY */}
      {handleSetBoundingBox && (
        <OdCard title="Geometry" collapsible defaultExpanded>
          <GeometrySection
            selectedShape={selectedShape}
            handleSetBoundingBox={handleSetBoundingBox}
          />
        </OdCard>
      )}

      {/* 3. PLATFORM & SEMANTICS */}
      <OdCard title="Platform & Semantics" collapsible defaultExpanded>
        <ShapeSemanticSection
          selectedShape={selectedShape}
          activeProfile={activeProfile}
          conflict={conflict}
          semanticDef={semanticDef}
          semanticProps={semanticProps}
          handleSetSemantic={handleSetSemantic}
          handlePropertyChange={handlePropertyChange}
        />
      </OdCard>

      {/* 4. STYLE */}
      <OdCard title="Style" collapsible defaultExpanded>
        <ShapeStyleInspector
          selectedShape={selectedShape}
          handleStyleChange={handleStyleChange}
          handleStylePreview={handleStylePreview}
          handleStyleCommit={handleStyleCommit}
        />
      </OdCard>
    </div>
  );
}
