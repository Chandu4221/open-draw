import React from "react";
import {
  isRootId,
  type DeviceType,
  type PlatformId,
  type PlatformProfile,
  type SemanticConflict,
  type SemanticDefinition,
  type StyleId,
} from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { ContainerInspector } from "./ContainerInspector";
import { ShapeInspector } from "./ShapeInspector";

export interface InspectorProps {
  readonly selectedShape: Shape | undefined;
  readonly rootShape: Shape | undefined;
  readonly rootPlatform: PlatformId | undefined;
  readonly rootStyle: StyleId;
  readonly activeProfile: PlatformProfile | undefined;
  readonly conflict: SemanticConflict | undefined;
  readonly semanticDef: SemanticDefinition | undefined;
  readonly semanticProps: Record<string, string | number | boolean>;
  readonly handleSetLabel: (labelStr: string) => void;
  readonly handleSetContent: (contentStr: string) => void;
  readonly handleSetPlatform: (platform: PlatformId | "") => void;
  readonly handleSetStyle: (style: StyleId) => void;
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

export function Inspector(props: InspectorProps): React.JSX.Element {
  const {
    selectedShape,
    rootShape,
    rootPlatform,
    rootStyle,
    activeProfile,
    conflict,
    semanticDef,
    semanticProps,
    handleSetLabel,
    handleSetContent,
    handleSetPlatform,
    handleSetStyle,
    handleSetSemantic,
    handlePropertyChange,
    handleToggleHiddenOn,
    handleOrderChange,
    handleStyleChange,
    handleStylePreview,
    handleStyleCommit,
  } = props;

  return (
    <div
      style={{
        marginBottom: "20px",
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "16px",
      }}
    >
      <h2 style={{ fontSize: "15px", margin: "0 0 12px 0", color: "#0f172a" }}>
        {!selectedShape
          ? "Inspector"
          : isRootId(selectedShape.parent)
            ? "Container Inspector"
            : "Shape Inspector"}
      </h2>
      {!selectedShape ? (
        <p style={{ color: "#64748b", margin: 0 }}>Select a shape to inspect.</p>
      ) : isRootId(selectedShape.parent) ? (
        <ContainerInspector
          selectedShape={selectedShape}
          rootPlatform={rootPlatform}
          rootStyle={rootStyle}
          activeProfile={activeProfile}
          handleSetLabel={handleSetLabel}
          handleSetPlatform={handleSetPlatform}
          handleSetStyle={handleSetStyle}
        />
      ) : (
        <ShapeInspector
          selectedShape={selectedShape}
          rootShape={rootShape}
          activeProfile={activeProfile}
          conflict={conflict}
          semanticDef={semanticDef}
          semanticProps={semanticProps}
          handleSetLabel={handleSetLabel}
          handleSetContent={handleSetContent}
          handleSetSemantic={handleSetSemantic}
          handlePropertyChange={handlePropertyChange}
          handleToggleHiddenOn={handleToggleHiddenOn}
          handleOrderChange={handleOrderChange}
          handleStyleChange={handleStyleChange}
          handleStylePreview={handleStylePreview}
          handleStyleCommit={handleStyleCommit}
        />
      )}
    </div>
  );
}
