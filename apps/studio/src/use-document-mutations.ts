import type { DeviceType, Command, Shape } from "@open-draw/canvas";
import { COMMANDS, isRootId } from "@open-draw/canvas";
import type { DesignStyleId, PlatformId, PlatformProfile, StyleId } from "@open-draw/profiles";
import { PLATFORMS, PLATFORM_PROFILES } from "@open-draw/profiles";
import type { RootRole } from "@open-draw/semantics";

export interface DocumentMutationsProps {
  readonly selectedShape: Shape | undefined;
  readonly rootShape: Shape | undefined;
  readonly activeProfile: PlatformProfile | undefined;
  readonly activeDeviceType: DeviceType | undefined;
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
    setActiveDeviceType,
    commit,
    render,
  } = props;

  function handleSetPlatform(platform: PlatformId | ""): void {
    const targetRoot =
      selectedShape && isRootId(selectedShape.parentId) ? selectedShape : rootShape;
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
    }
    render();
  }

  function handleSetStyle(style: StyleId): void {
    const targetRoot =
      selectedShape && isRootId(selectedShape.parentId) ? selectedShape : rootShape;
    if (!targetRoot) return;
    commit([{ type: COMMANDS.setRootStyle, id: targetRoot.id, style }]);
    render();
  }

  function handleSetDesignStyle(designStyle: DesignStyleId | ""): void {
    const targetRoot =
      selectedShape && isRootId(selectedShape.parentId) ? selectedShape : rootShape;
    if (!targetRoot) return;
    const nextDesignStyle = designStyle ? designStyle : null;
    commit([
      { type: COMMANDS.setRootDesignStyle, id: targetRoot.id, designStyle: nextDesignStyle },
    ]);
    render();
  }

  function handleSetRole(role: RootRole | ""): void {
    const targetRoot =
      selectedShape && isRootId(selectedShape.parentId) ? selectedShape : rootShape;
    if (!targetRoot) return;
    const nextRole = role ? (role as RootRole) : null;
    commit([{ type: COMMANDS.setRootRole, id: targetRoot.id, role: nextRole }]);
    render();
  }

  function handleSetLabel(
    labelStr: string,
    options?: { record?: boolean; startVal?: string | null },
  ): void {
    if (!selectedShape) return;
    const label = labelStr.trim().length === 0 ? null : labelStr;
    const commitOpts: { record?: boolean; customInverse?: readonly Command[] } = {};
    if (options?.record !== undefined) commitOpts.record = options.record;
    if (options?.startVal !== undefined) {
      commitOpts.customInverse = [
        { type: COMMANDS.setShapeLabel, id: selectedShape.id, label: options.startVal },
      ];
    }
    commit([{ type: COMMANDS.setShapeLabel, id: selectedShape.id, label }], commitOpts);
    render();
  }

  function handleSetContent(
    contentStr: string,
    options?: { record?: boolean; startVal?: string | null },
  ): void {
    if (!selectedShape) return;
    const content = contentStr.trim().length === 0 ? null : contentStr;
    const commitOpts: { record?: boolean; customInverse?: readonly Command[] } = {};
    if (options?.record !== undefined) commitOpts.record = options.record;
    if (options?.startVal !== undefined) {
      commitOpts.customInverse = [
        { type: COMMANDS.setShapeContent, id: selectedShape.id, content: options.startVal },
      ];
    }
    commit([{ type: COMMANDS.setShapeContent, id: selectedShape.id, content }], commitOpts);
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
    const trimmed = valStr.trim();
    if (trimmed.length === 0) {
      commit([{ type: COMMANDS.setShapeOrder, id: selectedShape.id, deviceType: dt, order: null }]);
      render();
      return;
    }
    const order = Number(trimmed);
    if (!Number.isFinite(order)) return;
    commit([{ type: COMMANDS.setShapeOrder, id: selectedShape.id, deviceType: dt, order }]);
    render();
  }

  function handleStyleChange(
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ): void {
    if (!selectedShape) return;
    commit([{ type: COMMANDS.setShapeStyle, id: selectedShape.id, fill, stroke, strokeWidth }]);
    render();
  }

  function handleStylePreview(
    fill?: string | null,
    stroke?: string | null,
    strokeWidth?: number | null,
  ): void {
    if (!selectedShape) return;
    commit([{ type: COMMANDS.setShapeStyle, id: selectedShape.id, fill, stroke, strokeWidth }], {
      record: false,
    });
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
    commit([{ type: COMMANDS.setShapeStyle, id: selectedShape.id, fill, stroke, strokeWidth }], {
      record: true,
      customInverse,
    });
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
