import React from "react";
import {
  PLATFORM_BY_VALUE,
  PLATFORMS,
  ROOT_ROLES,
  STYLE_PROFILES,
  type DesignStyleId,
  type PlatformId,
  type PlatformProfile,
  type RootRole,
  type SemanticConflict,
  type SemanticDefinition,
  type StyleId,
} from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { resolveShapeDisplayName } from "@open-draw/semantics";
import { OdField } from "@open-draw/ui";
import { ComponentSemanticSection } from "./ComponentSemanticSection";
import { DesignStyleSelect } from "./DesignStyleSelect";

export interface ContainerInspectorProps {
  readonly selectedShape: Shape;
  readonly rootPlatform: PlatformId | undefined;
  readonly rootStyle: StyleId;
  readonly rootDesignStyle?: DesignStyleId | undefined;
  readonly rootRole?: RootRole | undefined;
  readonly activeProfile: PlatformProfile | undefined;
  readonly conflict?: SemanticConflict | undefined;
  readonly semanticDef?: SemanticDefinition | undefined;
  readonly semanticProps?: Record<string, string | number | boolean>;
  readonly handleSetLabel: (labelStr: string) => void;
  readonly handleSetContent?: (contentStr: string) => void;
  readonly handleSetPlatform: (platform: PlatformId | "") => void;
  readonly handleSetStyle: (style: StyleId) => void;
  readonly handleSetDesignStyle?: ((designStyle: DesignStyleId | "") => void) | undefined;
  readonly handleSetRole?: ((role: RootRole | "") => void) | undefined;
  readonly handleSetSemantic?: (semanticIdStr: string) => void;
  readonly handlePropertyChange?: (propId: string, val: string | number | boolean) => void;
  readonly handleStyleChange?: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ) => void;
  readonly handleStylePreview?: (
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ) => void;
  readonly handleStyleCommit?: (
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

export function ContainerInspector(props: ContainerInspectorProps): React.JSX.Element {
  const {
    selectedShape,
    rootPlatform,
    rootStyle,
    rootDesignStyle,
    rootRole,
    activeProfile,
    conflict,
    semanticDef,
    semanticProps,
    handleSetLabel,
    handleSetContent,
    handleSetPlatform,
    handleSetStyle,
    handleSetDesignStyle,
    handleSetRole,
    handleSetSemantic,
    handlePropertyChange,
    handleStyleChange,
    handleStylePreview,
    handleStyleCommit,
  } = props;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--od-12)" }}>
      {/* IDENTITY SECTION */}
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

      <span className="od-meta">ID: {selectedShape.id}</span>

      {handleSetRole && (
        <OdField label="Role">
          <select
            className="od-select"
            style={{ width: "100%" }}
            value={rootRole ?? ROOT_ROLES.screen}
            onChange={(e) => handleSetRole((e.target.value as RootRole) || ROOT_ROLES.screen)}
          >
            <option value={ROOT_ROLES.screen}>Screen / Page</option>
            <option value={ROOT_ROLES.component}>Standalone Component</option>
          </select>
        </OdField>
      )}

      {/* PLATFORM & STYLE SECTION */}
      <div className="od-divider" style={{ width: "100%", margin: "var(--od-4) 0" }} />
      <span className="od-label">Platform & Style</span>

      <OdField label="Platform Profile">
        <select
          className="od-select"
          style={{ width: "100%" }}
          value={rootPlatform ? (PLATFORMS[rootPlatform] ?? rootPlatform) : ""}
          onChange={(e) => {
            const val = e.target.value;
            const platform = val ? (PLATFORM_BY_VALUE[val] ?? (val as PlatformId)) : "";
            handleSetPlatform(platform);
          }}
        >
          <option value="">(None / Platform-Agnostic)</option>
          <option value={PLATFORMS.web}>Web</option>
          <option value={PLATFORMS.androidNative}>Android Native (Material 3)</option>
          <option value={PLATFORMS.flutter}>Flutter</option>
          <option value={PLATFORMS.ios}>iOS (Apple HIG)</option>
        </select>
      </OdField>

      <OdField label="Render Style">
        <select
          className="od-select"
          style={{ width: "100%" }}
          value={rootStyle}
          onChange={(e) => handleSetStyle(e.target.value as StyleId)}
        >
          <option value={STYLE_PROFILES.minimal}>Minimal Wireframe</option>
          <option value={STYLE_PROFILES.crayon}>Crayon / Hand-drawn</option>
        </select>
      </OdField>

      {rootPlatform !== undefined && handleSetDesignStyle && (
        <DesignStyleSelect
          rootDesignStyle={rootDesignStyle}
          handleSetDesignStyle={handleSetDesignStyle}
        />
      )}

      {rootRole === ROOT_ROLES.component &&
        handleSetSemantic &&
        handlePropertyChange &&
        handleSetContent &&
        handleStyleChange &&
        handleStylePreview &&
        handleStyleCommit && (
          <ComponentSemanticSection
            selectedShape={selectedShape}
            activeProfile={activeProfile}
            conflict={conflict}
            semanticDef={semanticDef}
            semanticProps={semanticProps ?? {}}
            handleSetContent={handleSetContent}
            handleSetSemantic={handleSetSemantic}
            handlePropertyChange={handlePropertyChange}
            handleStyleChange={handleStyleChange}
            handleStylePreview={handleStylePreview}
            handleStyleCommit={handleStyleCommit}
          />
        )}
    </div>
  );
}
