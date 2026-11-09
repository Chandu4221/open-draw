import React from "react";
import {
  PLATFORM_BY_VALUE,
  PLATFORMS,
  ROOT_ROLES,
  STYLE_PROFILES,
  type BoundingBox,
  type DesignStyleId,
  type PlatformId,
  type PlatformProfile,
  type RootRole,
  type SemanticConflict,
  type SemanticDefinition,
  type ShapeId,
  type StyleId,
  type ThemePalette,
} from "@open-draw/contracts";
import type { Shape } from "@open-draw/document";
import { resolveShapeDisplayName } from "@open-draw/semantics";
import { OdCard, OdField, OdSegmentedControl } from "@open-draw/ui";
import { ComponentSemanticSection } from "./ComponentSemanticSection";
import { DesignStyleSelect } from "./DesignStyleSelect";
import { GeometrySection } from "./GeometrySection";
import { ThemePaletteSection } from "./ThemePaletteSection";

export interface ContainerInspectorProps {
  readonly selectedShape: Shape;
  readonly rootPlatform: PlatformId | undefined;
  readonly rootStyle: StyleId;
  readonly rootDesignStyle?: DesignStyleId | undefined;
  readonly rootRole?: RootRole | undefined;
  readonly rootTheme?: ThemePalette | undefined;
  readonly rootDarkMode?: boolean | undefined;
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
  readonly showChildChips?: boolean | undefined;
  readonly handleToggleChildChips?: ((rootId: ShapeId) => void) | undefined;
  readonly handleSetTheme?: ((theme: ThemePalette | undefined) => void) | undefined;
  readonly handleSetDarkMode?: ((darkMode: boolean) => void) | undefined;
  readonly handleSetBoundingBox?: ((box: BoundingBox) => void) | undefined;
}

export function ContainerInspector(props: ContainerInspectorProps): React.JSX.Element {
  const {
    selectedShape,
    rootPlatform,
    rootStyle,
    rootDesignStyle,
    rootRole,
    rootTheme,
    rootDarkMode,
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
    handleSetTheme,
    handleSetDarkMode,
    handleSetSemantic,
    handlePropertyChange,
    handleStyleChange,
    handleStylePreview,
    handleStyleCommit,
    showChildChips,
    handleToggleChildChips,
    handleSetBoundingBox,
  } = props;

  const roleItems =
    rootPlatform === PLATFORMS.web
      ? [
          { id: ROOT_ROLES.screen, label: "Page" },
          { id: ROOT_ROLES.component, label: "Component" },
        ]
      : [
          { id: ROOT_ROLES.screen, label: "Screen" },
          { id: ROOT_ROLES.component, label: "Component" },
        ];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* 1. IDENTITY & PLATFORM */}
      <OdCard title="Identity & Platform" collapsible defaultExpanded>
        <OdField label="Name" htmlFor="container-name">
          <input
            id="container-name"
            type="text"
            className="od-input"
            style={{ width: "100%" }}
            placeholder={resolveShapeDisplayName(selectedShape, activeProfile)}
            value={selectedShape.label ?? ""}
            onChange={(e) => handleSetLabel(e.target.value)}
          />
        </OdField>

        <span className="od-meta">ID: {selectedShape.id}</span>

        <OdField label="Platform Profile" htmlFor="container-platform-profile">
          <select
            id="container-platform-profile"
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

        {rootPlatform !== undefined && handleSetRole && (
          <OdField label="Root Role">
            <OdSegmentedControl
              items={roleItems}
              value={rootRole ?? ROOT_ROLES.screen}
              aria-label="Root container role"
              onSelect={(id) => handleSetRole((id as RootRole) || ROOT_ROLES.screen)}
            />
          </OdField>
        )}
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

      {/* 3. DESIGN THEMING */}
      <OdCard title="Design Theming" collapsible defaultExpanded>
        {rootPlatform !== undefined && handleSetDesignStyle && (
          <DesignStyleSelect
            rootDesignStyle={rootDesignStyle}
            handleSetDesignStyle={handleSetDesignStyle}
          />
        )}

        <OdField label="Canvas Render Style" htmlFor="container-canvas-render-style">
          <select
            id="container-canvas-render-style"
            className="od-select"
            style={{ width: "100%" }}
            value={rootStyle}
            onChange={(e) => handleSetStyle(e.target.value as StyleId)}
          >
            <option value={STYLE_PROFILES.minimal}>Minimal Wireframe</option>
            <option value={STYLE_PROFILES.crayon}>Crayon / Hand-drawn</option>
          </select>
        </OdField>

        {handleSetDarkMode && (
          <OdField label="Dark Mode" htmlFor="container-dark-mode">
            <label className="od-switch">
              <input
                id="container-dark-mode"
                type="checkbox"
                role="switch"
                aria-checked={rootDarkMode ?? false}
                checked={rootDarkMode ?? false}
                onChange={(e) => handleSetDarkMode(e.target.checked)}
              />
              <span className="od-switch__track" aria-hidden="true">
                <span className="od-switch__thumb" />
              </span>
              <span>Dual Light/Dark AI Directives</span>
            </label>
          </OdField>
        )}

        {handleSetTheme && (
          <div style={{ marginTop: "var(--od-8)" }}>
            <span className="od-label" style={{ display: "block", marginBottom: "var(--od-6)" }}>
              Theme Palette
            </span>
            <ThemePaletteSection theme={rootTheme} onThemeChange={handleSetTheme} />
          </div>
        )}
      </OdCard>

      {/* 4. OPTIONS */}
      {handleToggleChildChips && (
        <OdCard title="Options" collapsible defaultExpanded>
          <OdField label="Semantic Chips" htmlFor="container-show-chips">
            <label className="od-switch">
              <input
                id="container-show-chips"
                type="checkbox"
                role="switch"
                aria-checked={showChildChips ?? false}
                checked={showChildChips ?? false}
                onChange={() => handleToggleChildChips(selectedShape.id)}
              />
              <span className="od-switch__track" aria-hidden="true">
                <span className="od-switch__thumb" />
              </span>
              <span>Show tags on child components</span>
            </label>
          </OdField>
        </OdCard>
      )}

      {/* 5. COMPONENT SEMANTICS (if role === component) */}
      {rootRole === ROOT_ROLES.component &&
        handleSetSemantic &&
        handlePropertyChange &&
        handleSetContent &&
        handleStyleChange &&
        handleStylePreview &&
        handleStyleCommit && (
          <OdCard title="Component Semantics" collapsible defaultExpanded>
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
          </OdCard>
        )}
    </div>
  );
}
