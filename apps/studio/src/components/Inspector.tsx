import {
  isRootId,
  type BoundingBox,
  type DesignStyleId,
  type DeviceType,
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
import { ContainerInspector } from "./ContainerInspector";
import { ShapeInspector } from "./ShapeInspector";
import { MultiSelectInspector } from "./MultiSelectInspector";

export interface InspectorProps {
  readonly selectedShape: Shape | undefined;
  readonly rootShape: Shape | undefined;
  readonly rootPlatform: PlatformId | undefined;
  readonly rootStyle: StyleId;
  readonly rootDesignStyle?: DesignStyleId | undefined;
  readonly rootRole?: RootRole;
  readonly rootTheme?: ThemePalette | undefined;
  readonly rootDarkMode?: boolean | undefined;
  readonly handleSetTheme?: ((theme: ThemePalette | undefined) => void) | undefined;
  readonly handleSetDarkMode?: ((darkMode: boolean) => void) | undefined;
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
  readonly handleSetBoundingBox?: ((box: BoundingBox) => void) | undefined;
  readonly showChildChips?: boolean | undefined;
  readonly handleToggleChildChips?: ((rootId: ShapeId) => void) | undefined;
  readonly selectedShapes?: readonly Shape[] | undefined;
  readonly handleBatchAlign?:
    ((alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => void) | undefined;
  readonly handleBatchDistribute?: ((axis: "horizontal" | "vertical") => void) | undefined;
  readonly handleBatchStyleChange?:
    | ((fill?: string | null, stroke?: string | null, strokeWidth?: number | null) => void)
    | undefined;
  readonly handleBatchDelete?: (() => void) | undefined;
  readonly handleClearSelection?: (() => void) | undefined;
}

export function Inspector(props: InspectorProps): React.JSX.Element {
  const {
    selectedShape,
    rootShape,
    rootPlatform,
    rootStyle,
    rootDesignStyle,
    rootRole,
    rootTheme,
    rootDarkMode,
    handleSetTheme,
    handleSetDarkMode,
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
    handleSetBoundingBox,
    showChildChips,
    handleToggleChildChips,
    selectedShapes,
    handleBatchAlign,
    handleBatchDistribute,
    handleBatchStyleChange,
    handleBatchDelete,
    handleClearSelection,
  } = props;

  const isMultiSelect = (selectedShapes?.length ?? 0) > 1;

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
          {isMultiSelect
            ? "Multi-Select Inspector"
            : !selectedShape
              ? "Inspector"
              : isRootId(selectedShape.parentId)
                ? "Container Inspector"
                : "Shape Inspector"}
        </h2>
      </div>
      {isMultiSelect &&
      selectedShapes &&
      handleBatchAlign &&
      handleBatchDistribute &&
      handleBatchStyleChange &&
      handleBatchDelete &&
      handleClearSelection ? (
        <MultiSelectInspector
          selectedShapes={selectedShapes}
          onAlign={handleBatchAlign}
          onDistribute={handleBatchDistribute}
          onBatchStyleChange={handleBatchStyleChange}
          onBatchDelete={handleBatchDelete}
          onClearSelection={handleClearSelection}
        />
      ) : !selectedShape ? (
        <div className="od-empty">
          <span>Select a shape to inspect</span>
        </div>
      ) : isRootId(selectedShape.parentId) ? (
        <ContainerInspector
          selectedShape={selectedShape}
          rootPlatform={rootPlatform}
          rootStyle={rootStyle}
          rootDesignStyle={rootDesignStyle}
          rootRole={rootRole}
          rootTheme={rootTheme}
          rootDarkMode={rootDarkMode}
          handleSetTheme={handleSetTheme}
          handleSetDarkMode={handleSetDarkMode}
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
          handleSetBoundingBox={handleSetBoundingBox}
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
          handleSetBoundingBox={handleSetBoundingBox}
        />
      )}
    </div>
  );
}
