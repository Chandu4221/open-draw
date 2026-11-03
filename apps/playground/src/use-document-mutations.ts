import type { DeviceType, PlatformId, StyleId } from "@open-draw/contracts";
import { isRootId, PLATFORMS } from "@open-draw/contracts";
import type { CanvasController } from "@open-draw/canvas";
import { COMMANDS, type Command, type Shape } from "@open-draw/document";
import { PLATFORM_PROFILES } from "@open-draw/profiles";

export interface DocumentMutationsProps {
  readonly selectedShape: Shape | undefined;
  readonly rootShape: Shape | undefined;
  readonly activeProfile: import("@open-draw/contracts").PlatformProfile | undefined;
  readonly activeDeviceType: DeviceType | undefined;
  readonly canvasRef: React.MutableRefObject<CanvasController>;
  readonly setActiveDeviceType: (dt: DeviceType | undefined) => void;
  readonly commit: (commands: readonly Command[]) => void;
  readonly render: () => void;
}

export interface DocumentMutations {
  readonly handleSetPlatform: (platform: PlatformId | "") => void;
  readonly handleSetStyle: (style: StyleId) => void;
  readonly handleSetLabel: (labelStr: string) => void;
  readonly handleSetSemantic: (semanticIdStr: string) => void;
  readonly handlePropertyChange: (propId: string, val: string | number | boolean) => void;
  readonly handleToggleHiddenOn: (dt: DeviceType) => void;
  readonly handleOrderChange: (dt: DeviceType, valStr: string) => void;
}

export function useDocumentMutations(props: DocumentMutationsProps): DocumentMutations {
  const {
    selectedShape,
    rootShape,
    activeProfile,
    activeDeviceType,
    canvasRef,
    setActiveDeviceType,
    commit,
    render,
  } = props;

  function handleSetPlatform(platform: PlatformId | ""): void {
    const targetRoot = selectedShape && isRootId(selectedShape.parent) ? selectedShape : rootShape;
    if (!targetRoot) return;
    const targetPlatform = platform ? platform : null;
    commit([{ type: COMMANDS.setRootPlatform, id: targetRoot.id, platform: targetPlatform }]);
    const nextProfile = targetPlatform !== null ? PLATFORM_PROFILES[targetPlatform] : undefined;
    if (
      activeDeviceType !== undefined &&
      (nextProfile?.deviceTypes === undefined ||
        !nextProfile.deviceTypes.includes(activeDeviceType))
    ) {
      setActiveDeviceType(undefined);
      canvasRef.current.setActiveDeviceType(undefined);
    }
    render();
  }

  function handleSetStyle(style: StyleId): void {
    const targetRoot = selectedShape && isRootId(selectedShape.parent) ? selectedShape : rootShape;
    if (!targetRoot) return;
    commit([{ type: COMMANDS.setRootStyle, id: targetRoot.id, style }]);
    render();
  }

  function handleSetLabel(labelStr: string): void {
    if (!selectedShape) return;
    const label = labelStr.trim().length === 0 ? null : labelStr;
    commit([{ type: COMMANDS.setShapeLabel, id: selectedShape.id, label }]);
    render();
  }

  function handleSetSemantic(semanticIdStr: string): void {
    if (!selectedShape) return;
    if (semanticIdStr.length === 0) {
      commit([{ type: COMMANDS.setShapeSemantic, id: selectedShape.id, semantic: null }]);
    } else {
      let platform = activeProfile?.id ?? PLATFORMS.web;
      if (activeProfile && !activeProfile.semantics[semanticIdStr]) {
        for (const [pid, prof] of Object.entries(PLATFORM_PROFILES)) {
          if (prof.semantics[semanticIdStr]) {
            platform = pid as PlatformId;
            break;
          }
        }
      }
      commit([
        {
          type: COMMANDS.setShapeSemantic,
          id: selectedShape.id,
          semantic: { id: semanticIdStr, platform },
        },
      ]);
    }
    render();
  }

  function handlePropertyChange(propId: string, val: string | number | boolean): void {
    if (!selectedShape || !selectedShape.meta.semantic) return;
    const nextProps = { ...selectedShape.meta.semantic.properties, [propId]: val };
    commit([
      {
        type: COMMANDS.setShapeSemantic,
        id: selectedShape.id,
        semantic: { ...selectedShape.meta.semantic, properties: nextProps },
      },
    ]);
    render();
  }

  function handleToggleHiddenOn(dt: DeviceType): void {
    if (!selectedShape) return;
    const current = selectedShape.meta.hiddenOn ?? [];
    const next = current.includes(dt) ? current.filter((d) => d !== dt) : [...current, dt];
    commit([
      {
        type: COMMANDS.setShapeHiddenOn,
        id: selectedShape.id,
        hiddenOn: next.length > 0 ? next : null,
      },
    ]);
    render();
  }

  function handleOrderChange(dt: DeviceType, valStr: string): void {
    if (!selectedShape) return;
    const order = valStr.trim().length === 0 ? null : Number(valStr);
    commit([
      {
        type: COMMANDS.setShapeOrder,
        id: selectedShape.id,
        deviceType: dt,
        order,
      },
    ]);
    render();
  }

  return {
    handleSetPlatform,
    handleSetStyle,
    handleSetLabel,
    handleSetSemantic,
    handlePropertyChange,
    handleToggleHiddenOn,
    handleOrderChange,
  };
}
