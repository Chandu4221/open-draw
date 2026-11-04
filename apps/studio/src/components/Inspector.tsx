import {
  isRootId,
  type DesignStyleId,
  type DeviceType,
  type PlatformId,
  type PlatformProfile,
  type RootRole,
  type SemanticConflict,
  type SemanticDefinition,
  type ShapeId,
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
  readonly rootDesignStyle?: DesignStyleId | undefined;
  readonly rootRole?: RootRole;
  readonly activeProfile: PlatformProfile | undefined;
  readonly conflict: SemanticConflict | undefined;
  readonly semanticDef: SemanticDefinition | undefined;
  readonly semanticProps: Record<string, string | number | boolean>;
  readonly handleSetLabel: (labelStr: string) => void;
  readonly handleSetContent: (contentStr: string) => void;
  readonly handleSetPlatform: (platform: PlatformId | "") => void;
  readonly handleSetStyle: (style: StyleId) => void;
  readonly handleSetDesignStyle?: ((designStyle: DesignStyleId | "") => void) | undefined;
  readonly handleSetRole?: ((role: RootRole | "") => void) | undefined;
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
  readonly showChildChips?: boolean | undefined;
  readonly handleToggleChildChips?: ((rootId: ShapeId) => void) | undefined;
}

export function Inspector(props: InspectorProps): React.JSX.Element {
  const {
    selectedShape,
    rootShape,
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
    handleToggleHiddenOn,
    handleOrderChange,
    handleStyleChange,
    handleStylePreview,
    handleStyleCommit,
    showChildChips,
    handleToggleChildChips,
  } = props;

  return (
    <div
      style={{
        marginBottom: "var(--od-16)",
        borderBottom: "var(--od-border-width) solid var(--od-border)",
        paddingBottom: "var(--od-16)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--od-12)",
        }}
      >
        <h2 className="od-panel-title">
          {!selectedShape
            ? "Inspector"
            : isRootId(selectedShape.parent)
              ? "Container Inspector"
              : "Shape Inspector"}
        </h2>
      </div>
      {!selectedShape ? (
        <div className="od-empty">
          <span>Select a shape to inspect</span>
        </div>
      ) : isRootId(selectedShape.parent) ? (
        <ContainerInspector
          selectedShape={selectedShape}
          rootPlatform={rootPlatform}
          rootStyle={rootStyle}
          rootDesignStyle={rootDesignStyle}
          rootRole={rootRole}
          activeProfile={activeProfile}
          conflict={conflict}
          semanticDef={semanticDef}
          semanticProps={semanticProps}
          handleSetLabel={handleSetLabel}
          handleSetContent={handleSetContent}
          handleSetPlatform={handleSetPlatform}
          handleSetStyle={handleSetStyle}
          handleSetDesignStyle={handleSetDesignStyle}
          handleSetRole={handleSetRole}
          handleSetSemantic={handleSetSemantic}
          handlePropertyChange={handlePropertyChange}
          handleStyleChange={handleStyleChange}
          handleStylePreview={handleStylePreview}
          handleStyleCommit={handleStyleCommit}
          showChildChips={showChildChips}
          handleToggleChildChips={handleToggleChildChips}
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
