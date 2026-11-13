import { describe, expect, it, vi } from "vitest";
import {
  DEVICE_TYPES,
  ROOT_ID,
  SHAPE_KINDS,
  type ShapeId,
  COMMANDS,
  type Shape,
} from "@open-draw/canvas";
import { DESIGN_STYLES, PLATFORMS, STYLE_PROFILES } from "@open-draw/profiles";
import {
  PLUGIN_DESIGN_STYLE,
  PLUGIN_ROOT_PLATFORM,
  PLUGIN_ROOT_ROLE,
  PLUGIN_SEMANTICS,
  ROOT_ROLES,
} from "@open-draw/semantics";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { useDocumentMutations, type DocumentMutationsProps } from "./use-document-mutations";

function createMockShape(
  id: string,
  parentId = ROOT_ID,
  meta: Shape["meta"] = { order: {} },
): Shape {
  return {
    id: id as ShapeId,
    parentId,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 100, height: 100 },
    meta,
  };
}

function useTestMutations(overrides: Partial<DocumentMutationsProps> = {}) {
  const commit = vi.fn();
  const render = vi.fn();
  const setActiveDeviceType = vi.fn();
  const mutations = useDocumentMutations({
    selectedShape: undefined,
    rootShape: undefined,
    activeProfile: undefined,
    activeDeviceType: undefined,
    setActiveDeviceType,
    commit,
    render,
    ...overrides,
  });
  return { mutations, commit, render, setActiveDeviceType };
}

describe("useDocumentMutations", () => {
  it("commits setShapePluginData for root platform on root shape and triggers render", () => {
    const rootShape = createMockShape("root-1", ROOT_ID, { order: {}, platform: PLATFORMS.web });
    const { mutations, commit, render } = useTestMutations({
      rootShape,
      activeProfile: PLATFORM_PROFILES[PLATFORMS.web],
    });

    mutations.handleSetPlatform(PLATFORMS.flutter);

    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapePluginData,
        id: "root-1",
        pluginId: PLUGIN_ROOT_PLATFORM,
        data: PLATFORMS.flutter,
      },
    ]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("clears design style when platform is cleared from root with designStyle", () => {
    const rootShape = createMockShape("root-1", ROOT_ID, {
      order: {},
      platform: PLATFORMS.web,
      designStyle: DESIGN_STYLES.minimalism,
    });
    const { mutations, commit, render } = useTestMutations({
      rootShape,
      activeProfile: PLATFORM_PROFILES[PLATFORMS.web],
    });

    mutations.handleSetPlatform("");

    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapePluginData,
        id: "root-1",
        pluginId: PLUGIN_ROOT_PLATFORM,
        data: null,
      },
      {
        type: COMMANDS.setShapePluginData,
        id: "root-1",
        pluginId: PLUGIN_DESIGN_STYLE,
        data: null,
      },
    ]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("resets active device type when next platform profile does not support it", () => {
    const rootShape = createMockShape("root-1", ROOT_ID, { order: {}, platform: PLATFORMS.web });
    const { mutations, setActiveDeviceType } = useTestMutations({
      rootShape,
      activeProfile: PLATFORM_PROFILES[PLATFORMS.web],
      activeDeviceType: "largeScreen",
    });

    mutations.handleSetPlatform(PLATFORMS.ios);

    expect(setActiveDeviceType).toHaveBeenCalledWith(undefined);
  });

  it("commits setRootStyle and triggers render", () => {
    const rootShape = createMockShape("root-1", ROOT_ID);
    const { mutations, commit, render } = useTestMutations({ rootShape });

    mutations.handleSetStyle(STYLE_PROFILES.crayon);

    expect(commit).toHaveBeenCalledWith([
      { type: COMMANDS.setRootStyle, id: "root-1", style: STYLE_PROFILES.crayon },
    ]);
    expect(render).toHaveBeenCalledTimes(1);
  });

  it("commits setShapePluginData for root role with specified role or null", () => {
    const rootShape = createMockShape("root-1", ROOT_ID);
    const { mutations, commit } = useTestMutations({ rootShape });

    mutations.handleSetRole(ROOT_ROLES.component);
    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapePluginData,
        id: "root-1",
        pluginId: PLUGIN_ROOT_ROLE,
        data: ROOT_ROLES.component,
      },
    ]);

    mutations.handleSetRole("");
    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapePluginData,
        id: "root-1",
        pluginId: PLUGIN_ROOT_ROLE,
        data: null,
      },
    ]);
  });

  it("updates label and supports startVal custom inverse for undo", () => {
    const selected = createMockShape("s-1");
    const { mutations, commit, render } = useTestMutations({
      selectedShape: selected,
      rootShape: selected,
    });

    mutations.handleSetLabel("Card Header", { record: true, startVal: "Old" });

    expect(commit).toHaveBeenCalledWith(
      [{ type: COMMANDS.setShapeLabel, id: "s-1", label: "Card Header" }],
      {
        record: true,
        customInverse: [{ type: COMMANDS.setShapeLabel, id: "s-1", label: "Old" }],
      },
    );
    expect(render).toHaveBeenCalledTimes(1);

    mutations.handleSetLabel("   ");
    expect(commit).toHaveBeenCalledWith(
      [{ type: COMMANDS.setShapeLabel, id: "s-1", label: null }],
      {},
    );
  });

  it("sets semantic tag matching active profile and clears on empty string", () => {
    const selected = createMockShape("s-1");
    const { mutations, commit } = useTestMutations({
      selectedShape: selected,
      rootShape: selected,
      activeProfile: PLATFORM_PROFILES[PLATFORMS.web],
    });

    mutations.handleSetSemantic("button");
    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapePluginData,
        id: "s-1",
        pluginId: PLUGIN_SEMANTICS,
        data: { id: "button", platform: PLATFORMS.web },
      },
    ]);

    mutations.handleSetSemantic("");
    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapePluginData,
        id: "s-1",
        pluginId: PLUGIN_SEMANTICS,
        data: null,
      },
    ]);
  });

  it("toggles hiddenOn device types and normalizes empty list to null", () => {
    const selected = createMockShape("s-1", ROOT_ID, {
      order: {},
      hiddenOn: [DEVICE_TYPES.mobile],
    });
    const { mutations, commit } = useTestMutations({
      selectedShape: selected,
      rootShape: selected,
    });

    mutations.handleToggleHiddenOn(DEVICE_TYPES.mobile);
    expect(commit).toHaveBeenCalledWith([
      { type: COMMANDS.setShapeHiddenOn, id: "s-1", hiddenOn: null },
    ]);

    mutations.handleToggleHiddenOn(DEVICE_TYPES.tablet);
    expect(commit).toHaveBeenCalledWith([
      {
        type: COMMANDS.setShapeHiddenOn,
        id: "s-1",
        hiddenOn: [DEVICE_TYPES.mobile, DEVICE_TYPES.tablet],
      },
    ]);
  });

  it("updates and clears responsive order for specified device type", () => {
    const selected = createMockShape("s-1");
    const { mutations, commit } = useTestMutations({
      selectedShape: selected,
      rootShape: selected,
    });

    mutations.handleOrderChange(DEVICE_TYPES.mobile, "2");
    expect(commit).toHaveBeenCalledWith([
      { type: COMMANDS.setShapeOrder, id: "s-1", deviceType: DEVICE_TYPES.mobile, order: 2 },
    ]);

    mutations.handleOrderChange(DEVICE_TYPES.mobile, "  ");
    expect(commit).toHaveBeenCalledWith([
      { type: COMMANDS.setShapeOrder, id: "s-1", deviceType: DEVICE_TYPES.mobile, order: null },
    ]);
  });

  it("handles preview and commit for shape styling", () => {
    const selected = createMockShape("s-1");
    const { mutations, commit } = useTestMutations({
      selectedShape: selected,
      rootShape: selected,
    });

    mutations.handleStylePreview("#ffffff", "#000000", 2);
    expect(commit).toHaveBeenCalledWith(
      [
        {
          type: COMMANDS.setShapeStyle,
          id: "s-1",
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
        },
      ],
      { record: false },
    );

    mutations.handleStyleCommit("#111111", "#222222", 1, {
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 3,
    });
    expect(commit).toHaveBeenCalledWith(
      [
        {
          type: COMMANDS.setShapeStyle,
          id: "s-1",
          fill: "#111111",
          stroke: "#222222",
          strokeWidth: 1,
        },
      ],
      {
        record: true,
        customInverse: [
          {
            type: COMMANDS.setShapeStyle,
            id: "s-1",
            fill: "#000000",
            stroke: "#ffffff",
            strokeWidth: 3,
          },
        ],
      },
    );
  });
});
