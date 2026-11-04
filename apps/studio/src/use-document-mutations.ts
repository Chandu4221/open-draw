import type {
  DesignStyleId,
  DeviceType,
  PlatformId,
  RootRole,
  StyleId,
} from "@open-draw/contracts";
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
  readonly commit: (
    commands: readonly Command[],
    options?: { record?: boolean; customInverse?: readonly Command[] },
  ) => void;
  readonly render: () => void;
}

export interface DocumentMutations {
  readonly handleSetPlatform: (platform: PlatformId | "") => void;
  readonly handleSetStyle: (style: StyleId) => void;
  readonly handleSetDesignStyle: (designStyle: DesignStyleId | "") => void;
  readonly handleSetRole: (role: RootRole | "") => void;
  readonly handleSetLabel: (labelStr: string) => void;
  readonly handleSetContent: (contentStr: string) => void;
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
    if (targetPlatform === null && targetRoot.meta.designStyle !== undefined) {
      commit([
        { type: COMMANDS.setRootPlatform, id: targetRoot.id, platform: null },
        { type: COMMANDS.setRootDesignStyle, id: targetRoot.id, designStyle: null },
      ]);
    } else {
      commit([{ type: COMMANDS.setRootPlatform, id: targetRoot.id, platform: targetPlatform }]);
    }
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

  function handleSetDesignStyle(designStyle: DesignStyleId | ""): void {
    const targetRoot = selectedShape && isRootId(selectedShape.parent) ? selectedShape : rootShape;
    if (!targetRoot) return;
    const nextDesignStyle = designStyle ? designStyle : null;
    commit([
      { type: COMMANDS.setRootDesignStyle, id: targetRoot.id, designStyle: nextDesignStyle },
    ]);
    render();
  }

  function handleSetRole(role: RootRole | ""): void {
    const targetRoot = selectedShape && isRootId(selectedShape.parent) ? selectedShape : rootShape;
    if (!targetRoot) return;
    const nextRole = role ? (role as RootRole) : null;
    commit([{ type: COMMANDS.setRootRole, id: targetRoot.id, role: nextRole }]);
    render();
  }

  function handleSetLabel(labelStr: string): void {
    if (!selectedShape) return;
    const label = labelStr.trim().length === 0 ? null : labelStr;
    commit([{ type: COMMANDS.setShapeLabel, id: selectedShape.id, label }]);
    render();
  }

  function handleSetContent(contentStr: string): void {
    if (!selectedShape) return;
    const content = contentStr.trim().length === 0 ? null : contentStr;
    commit([{ type: COMMANDS.setShapeContent, id: selectedShape.id, content }]);
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

  function handleStyleChange(
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ): void {
    if (!selectedShape) return;
    commit([
      {
        type: COMMANDS.setShapeStyle,
        id: selectedShape.id,
        fill,
        stroke,
        strokeWidth,
      },
    ]);
    render();
  }

  function handleStylePreview(
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ): void {
    if (!selectedShape) return;
    commit(
      [
        {
          type: COMMANDS.setShapeStyle,
          id: selectedShape.id,
          fill,
          stroke,
          strokeWidth,
        },
      ],
      { record: false },
    );
    render();
  }

  function handleStyleCommit(
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
    startStyle?: {
      fill?: string | null;
      stroke?: string | null;
      strokeWidth?: number | null;
    },
  ): void {
    if (!selectedShape) return;
    const customInverse: readonly Command[] = [
      {
        type: COMMANDS.setShapeStyle,
        id: selectedShape.id,
        fill: fill !== undefined ? (startStyle?.fill ?? null) : undefined,
        stroke: stroke !== undefined ? (startStyle?.stroke ?? null) : undefined,
        strokeWidth: strokeWidth !== undefined ? (startStyle?.strokeWidth ?? null) : undefined,
      },
    ];
    commit(
      [
        {
          type: COMMANDS.setShapeStyle,
          id: selectedShape.id,
          fill,
          stroke,
          strokeWidth,
        },
      ],
      { record: true, customInverse },
    );
    render();
  }

  return {
    handleSetPlatform,
    handleSetStyle,
    handleSetDesignStyle,
    handleSetRole,
    handleSetLabel,
    handleSetContent,
    handleSetSemantic,
    handlePropertyChange,
    handleToggleHiddenOn,
    handleOrderChange,
    handleStyleChange,
    handleStylePreview,
    handleStyleCommit,
  };
}
