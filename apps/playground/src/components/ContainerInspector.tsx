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
      <div style={{ marginBottom: "12px", color: "#64748b" }}>
        <strong>Shape ID:</strong> {selectedShape.id}
      </div>

      {handleSetRole && (
        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
            Container Role (R-026)
          </label>
          <select
            value={rootRole ?? ROOT_ROLES.screen}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
            }}
            onChange={(e) => handleSetRole((e.target.value as RootRole) || ROOT_ROLES.screen)}
          >
            <option value={ROOT_ROLES.screen}>Screen / Page</option>
            <option value={ROOT_ROLES.component}>Standalone Component</option>
          </select>
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
          Platform Profile (R-026)
        </label>
        <select
          value={rootPlatform ? (PLATFORMS[rootPlatform] ?? rootPlatform) : ""}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
          }}
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
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "4px" }}>
          Render Style (R-021)
        </label>
        <select
          value={rootStyle}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
          }}
          onChange={(e) => handleSetStyle(e.target.value as StyleId)}
        >
          <option value={STYLE_PROFILES.minimal}>Minimal Wireframe</option>
          <option value={STYLE_PROFILES.crayon}>Crayon / Hand-drawn</option>
        </select>
      </div>

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
