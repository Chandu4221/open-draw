import { describe, expect, it } from "vitest";
import { DEVICE_TYPES, parseShapeId, ROOT_ID } from "@open-draw/canvas";
import { DESIGN_STYLES, PLATFORMS, STYLE_PROFILES } from "@open-draw/profiles";
import {
  createDocument,
  createPage,
  createRect,
  createSection,
  type Shape,
} from "@open-draw/canvas";
import { ANDROID_NATIVE_PROFILE, FLUTTER_PROFILE, WEB_PROFILE } from "@open-draw/profiles";
import {
  computeSemanticConflict,
  getPlatformEquivalents,
  getShapeSemantic,
  isComponentScopedSemantic,
  isContainerSemantic,
  isLeafComponentSemantic,
  isSectionScopedSemantic,
  resolveRootDarkMode,
  resolveRootDesignStyle,
  resolveRootPage,
  resolveRootPlatform,
  resolveRootRole,
  resolveRootShape,
  resolveRootStyle,
  resolveRootTheme,
  resolveSemantic,
  resolveShapeDisplayName,
  suggestPlatformEquivalent,
  walkSemanticTree,
  PLUGIN_DARK_MODE,
  PLUGIN_DESIGN_STYLE,
  PLUGIN_ROOT_PLATFORM,
  PLUGIN_ROOT_ROLE,
  PLUGIN_SEMANTICS,
  PLUGIN_THEME,
  ROOT_ROLES,
  SEMANTICS_REGISTRY_VERSION,
} from "./index";

describe("root resolution (R-026)", () => {
  const pageId = parseShapeId("page-1");
  const sectionId = parseShapeId("section-1");
  const buttonId = parseShapeId("button-1");

  const doc = createDocument([
    createPage(
      pageId,
      { x: 0, y: 0, width: 1440, height: 900 },
      {
        meta: {
          order: {},
          platform: "androidNative",
          style: STYLE_PROFILES.minimal,
        },
      },
    ),
    createSection(sectionId, { x: 0, y: 0, width: 1400, height: 100 }, "row", {
      parent: pageId,
    }),
    createRect(buttonId, { x: 10, y: 10, width: 120, height: 40 }, { parent: sectionId }),
  ]);

  it("resolves root page ancestor from nested children", () => {
    expect(resolveRootPage(doc, buttonId)?.id).toBe(pageId);
    expect(resolveRootPage(doc, sectionId)?.id).toBe(pageId);
    expect(resolveRootPage(doc, pageId)?.id).toBe(pageId);
  });

  it("inherits root platform and style by tree position (R-026)", () => {
    expect(resolveRootPlatform(doc, buttonId)).toBe("androidNative");
    expect(resolveRootStyle(doc, buttonId)).toBe(STYLE_PROFILES.minimal);
  });

  it("returns undefined for root platform when root page has no platform (Ruling 10, Platform-Agnostic Mode)", () => {
    const agnosticPageId = parseShapeId("page-agnostic");
    const childRectId = parseShapeId("child-rect");
    const agnosticDoc = createDocument([
      createPage(agnosticPageId, { x: 0, y: 0, width: 1440, height: 900 }),
      createRect(childRectId, { x: 10, y: 10, width: 100, height: 50 }, { parent: agnosticPageId }),
    ]);

    expect(resolveRootPlatform(agnosticDoc, agnosticPageId)).toBeUndefined();
    expect(resolveRootPlatform(agnosticDoc, childRectId)).toBeUndefined();
  });

  it("resolves root shape and undefined platform when shape is freestanding on canvas", () => {
    const freestandingId = parseShapeId("free-rect");
    const docWithFree = createDocument([
      createRect(freestandingId, { x: 50, y: 50, width: 100, height: 100 }, { parent: ROOT_ID }),
    ]);

    expect(resolveRootShape(docWithFree, freestandingId)?.id).toBe(freestandingId);
    expect(resolveRootPlatform(docWithFree, freestandingId)).toBeUndefined();
    expect(resolveRootStyle(docWithFree, freestandingId)).toBe(STYLE_PROFILES.minimal);
  });

  it("children of a root rectangle inherit the root rectangle's platform", () => {
    const rootRectId = parseShapeId("root-rect-screen");
    const childButtonId = parseShapeId("child-btn");
    const docWithRootRect = createDocument([
      createRect(
        rootRectId,
        { x: 0, y: 0, width: 640, height: 480 },
        {
          parent: ROOT_ID,
          meta: { order: {}, platform: PLATFORMS.flutter, style: STYLE_PROFILES.minimal },
        },
      ),
      createRect(childButtonId, { x: 10, y: 10, width: 100, height: 40 }, { parent: rootRectId }),
    ]);

    expect(resolveRootPlatform(docWithRootRect, childButtonId)).toBe(PLATFORMS.flutter);
    expect(resolveRootShape(docWithRootRect, childButtonId)?.id).toBe(rootRectId);
  });

  it("inherits root design style when platform is set, but returns undefined in platform-agnostic mode (R-024, R-026)", () => {
    const styledPageId = parseShapeId("styled-page");
    const childId = parseShapeId("child-rect");
    const styledDoc = createDocument([
      createPage(
        styledPageId,
        { x: 0, y: 0, width: 1440, height: 900 },
        {
          meta: {
            order: {},
            platform: PLATFORMS.web,
            designStyle: DESIGN_STYLES.neoBrutalism,
          },
        },
      ),
      createRect(childId, { x: 10, y: 10, width: 100, height: 50 }, { parent: styledPageId }),
    ]);

    expect(resolveRootDesignStyle(styledDoc, styledPageId)).toBe(DESIGN_STYLES.neoBrutalism);
    expect(resolveRootDesignStyle(styledDoc, childId)).toBe(DESIGN_STYLES.neoBrutalism);

    // Platform-agnostic root shape (no platform set) must yield undefined designStyle (R-024)
    const agnosticPageId = parseShapeId("agnostic-page");
    const agnosticChildId = parseShapeId("agnostic-child");
    const agnosticDoc = createDocument([
      createPage(
        agnosticPageId,
        { x: 0, y: 0, width: 1440, height: 900 },
        {
          meta: {
            order: {},
            designStyle: DESIGN_STYLES.neoBrutalism,
          },
        },
      ),
      createRect(
        agnosticChildId,
        { x: 10, y: 10, width: 100, height: 50 },
        { parent: agnosticPageId },
      ),
    ]);

    expect(resolveRootDesignStyle(agnosticDoc, agnosticPageId)).toBeUndefined();
    expect(resolveRootDesignStyle(agnosticDoc, agnosticChildId)).toBeUndefined();
  });
});

describe("semantic resolution and display name (Ruling 9, R-042)", () => {
  const pageId = parseShapeId("page-1");
  const rectId = parseShapeId("rect-1");

  it("resolves semantic tag against profile", () => {
    const semantic = resolveSemantic(WEB_PROFILE, {
      id: "button",
      platform: "web",
      properties: { variant: "primary" },
    });
    expect(semantic?.displayName).toBe("Button");
    expect(semantic?.properties?.variant).toBe("primary");
  });

  it("resolves dynamic display name for root containers (Screen for Android, Scaffold for Flutter, Page for Web, Canvas Board for agnostic)", () => {
    const pageShape = createPage(pageId, { x: 0, y: 0, width: 1000, height: 1000 });

    // Web profile -> Page
    expect(resolveShapeDisplayName(pageShape, WEB_PROFILE)).toBe("Page");
    // Android Native profile -> Screen
    expect(resolveShapeDisplayName(pageShape, ANDROID_NATIVE_PROFILE)).toBe("Screen");
    // Flutter profile -> Scaffold
    expect(resolveShapeDisplayName(pageShape, FLUTTER_PROFILE)).toBe("Scaffold");
    // Platform-agnostic (profile is undefined) -> Canvas Board
    expect(resolveShapeDisplayName(pageShape, undefined)).toBe("Canvas Board");

    // Explicit label overrides root semantic
    const labeledPage = createPage(
      pageId,
      { x: 0, y: 0, width: 1000, height: 1000 },
      {
        label: "Custom Dashboard",
      },
    );
    expect(resolveShapeDisplayName(labeledPage, ANDROID_NATIVE_PROFILE)).toBe("Custom Dashboard");
  });

  it("resolves dynamic display name for root rectangles promoted to platform screens", () => {
    const rootRect = createRect(
      parseShapeId("rect-screen"),
      { x: 0, y: 0, width: 640, height: 480 },
      { parent: ROOT_ID },
    );

    // Web profile -> Page
    expect(resolveShapeDisplayName(rootRect, WEB_PROFILE)).toBe("Page");
    // Android Native profile -> Screen
    expect(resolveShapeDisplayName(rootRect, ANDROID_NATIVE_PROFILE)).toBe("Screen");
    // Flutter profile -> Scaffold
    expect(resolveShapeDisplayName(rootRect, FLUTTER_PROFILE)).toBe("Scaffold");
    // Platform-agnostic (profile is undefined) -> Rectangle
    expect(resolveShapeDisplayName(rootRect, undefined)).toBe("Rectangle");
  });

  it("resolves display name using complete chain: label -> semantic -> kind", () => {
    // 1. Explicit label wins
    const withLabel = createRect(
      rectId,
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: pageId,
        label: "Custom Header",
        meta: { order: {}, semantic: { id: "heading", platform: "web" } },
      },
    );
    expect(resolveShapeDisplayName(withLabel, WEB_PROFILE)).toBe("Custom Header");

    // 2. Semantic display name wins if label is absent
    const withSemantic = createRect(
      rectId,
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: pageId,
        meta: { order: {}, semantic: { id: "heading", platform: "web" } },
      },
    );
    expect(resolveShapeDisplayName(withSemantic, WEB_PROFILE)).toBe("Heading");

    // 3. Fallback to shape kind label
    const untagged = createRect(
      rectId,
      { x: 0, y: 0, width: 10, height: 10 },
      {
        parent: pageId,
      },
    );
    expect(resolveShapeDisplayName(untagged, WEB_PROFILE)).toBe("Rectangle");
    // Pure geometry in platform-agnostic mode
    expect(resolveShapeDisplayName(untagged, undefined)).toBe("Rectangle");
  });
});

describe("conflict computation (R-025)", () => {
  const pageId = parseShapeId("page-1");
  const shapeId = parseShapeId("shape-1");

  it("flags foreign tag as conflicted when root page platform differs (R-025)", () => {
    // Page is Android Native, but shape is tagged with Web navbar
    const doc = createDocument([
      createPage(
        pageId,
        { x: 0, y: 0, width: 1000, height: 1000 },
        { meta: { order: {}, platform: "androidNative" } },
      ),
      createRect(
        shapeId,
        { x: 10, y: 10, width: 200, height: 50 },
        { parent: pageId, meta: { order: {}, semantic: { id: "navbar", platform: "web" } } },
      ),
    ]);

    const conflict = computeSemanticConflict(doc, doc.shapes[shapeId]!, ANDROID_NATIVE_PROFILE);
    expect(conflict?.status).toBe("conflicted");
    expect(conflict?.expectedPlatform).toBe("androidNative");
    expect(conflict?.actualPlatform).toBe(PLATFORMS.web);
  });

  it("flags tagged shape on platform-agnostic root page as conflicted (Ruling 10)", () => {
    const agnosticDoc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createRect(
        shapeId,
        { x: 10, y: 10, width: 200, height: 50 },
        { parent: pageId, meta: { order: {}, semantic: { id: "navbar", platform: "web" } } },
      ),
    ]);

    const conflict = computeSemanticConflict(agnosticDoc, agnosticDoc.shapes[shapeId]!);
    expect(conflict?.status).toBe("conflicted");
    expect(conflict?.expectedPlatform).toBeUndefined();
    expect(conflict?.actualPlatform).toBe("web");
  });

  it("rejects root semantic assigned to child shapes", () => {
    // Child rect assigned "screen" on Android Native
    const doc = createDocument([
      createPage(
        pageId,
        { x: 0, y: 0, width: 1000, height: 1000 },
        { meta: { order: {}, platform: "androidNative" } },
      ),
      createRect(
        shapeId,
        { x: 10, y: 10, width: 200, height: 50 },
        {
          parent: pageId,
          meta: { order: {}, semantic: { id: "screen", platform: "androidNative" } },
        },
      ),
    ]);

    const conflict = computeSemanticConflict(doc, doc.shapes[shapeId]!, ANDROID_NATIVE_PROFILE);
    expect(conflict?.status).toBe("conflicted");
    expect(conflict?.reason).toContain(
      'Root semantic "screen" cannot be assigned to child shapes.',
    );
  });

  it("returns undefined for matching platform tag or untagged shape", () => {
    const doc = createDocument([
      createPage(
        pageId,
        { x: 0, y: 0, width: 1000, height: 1000 },
        { meta: { order: {}, platform: PLATFORMS.web } },
      ),
      createRect(
        shapeId,
        { x: 10, y: 10, width: 200, height: 50 },
        { parent: pageId, meta: { order: {}, semantic: { id: "navbar", platform: "web" } } },
      ),
    ]);

    expect(computeSemanticConflict(doc, doc.shapes[shapeId]!, WEB_PROFILE)).toBeUndefined();

    // Untagged shape = NONE baseline
    const untaggedDoc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createRect(shapeId, { x: 10, y: 10, width: 200, height: 50 }, { parent: pageId }),
    ]);
    expect(
      computeSemanticConflict(untaggedDoc, untaggedDoc.shapes[shapeId]!, WEB_PROFILE),
    ).toBeUndefined();
    expect(
      computeSemanticConflict(untaggedDoc, untaggedDoc.shapes[shapeId]!, undefined),
    ).toBeUndefined();
  });
});

describe("hierarchical tree walk", () => {
  it("traverses document in visual preorder with depth and responsive sorting", () => {
    const pageId = parseShapeId("page-1");
    const secId = parseShapeId("sec-1");
    const childA = parseShapeId("child-a");
    const childB = parseShapeId("child-b");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createSection(secId, { x: 0, y: 0, width: 1000, height: 200 }, "row", { parent: pageId }),
      // childA created before childB, but has order: 2 on mobile
      createRect(
        childA,
        { x: 10, y: 10, width: 50, height: 50 },
        {
          parent: secId,
          meta: { order: { mobile: 2 } },
        },
      ),
      // childB has order: 1 on mobile
      createRect(
        childB,
        { x: 70, y: 10, width: 50, height: 50 },
        {
          parent: secId,
          meta: { order: { mobile: 1 } },
        },
      ),
    ]);

    const walkMobile = walkSemanticTree(doc, pageId, WEB_PROFILE, DEVICE_TYPES.mobile);
    expect(walkMobile).toHaveLength(4);
    expect(walkMobile[0]?.shape.id).toBe(pageId);
    expect(walkMobile[0]?.depth).toBe(0);
    expect(walkMobile[1]?.shape.id).toBe(secId);
    expect(walkMobile[1]?.depth).toBe(1);
    // On mobile, childB (order 1) comes before childA (order 2)
    expect(walkMobile[2]?.shape.id).toBe(childB);
    expect(walkMobile[2]?.depth).toBe(2);
    expect(walkMobile[3]?.shape.id).toBe(childA);
    expect(walkMobile[3]?.depth).toBe(2);
  });

  it("traverses whole document from ROOT_ID including boards and freestanding shapes", () => {
    const pageId = parseShapeId("page-1");
    const childId = parseShapeId("child-1");
    const freeId = parseShapeId("free-1");

    const doc = createDocument([
      createPage(pageId, { x: 0, y: 0, width: 800, height: 600 }),
      createRect(childId, { x: 10, y: 10, width: 50, height: 50 }, { parent: pageId }),
      createRect(freeId, { x: 900, y: 10, width: 100, height: 100 }, { parent: ROOT_ID }),
    ]);

    const walk = walkSemanticTree(doc, ROOT_ID, undefined);
    expect(walk).toHaveLength(3);
    // Page at depth 0
    expect(walk[0]?.shape.id).toBe(pageId);
    expect(walk[0]?.depth).toBe(0);
    // Child inside page at depth 1
    expect(walk[1]?.shape.id).toBe(childId);
    expect(walk[1]?.depth).toBe(1);
    // Freestanding rect on canvas at depth 0
    expect(walk[2]?.shape.id).toBe(freeId);
    expect(walk[2]?.depth).toBe(0);
  });

  it("resolves each root shape and its subtree using that root's own platform profile (R-026)", () => {
    const webRootId = parseShapeId("web-root");
    const webButtonId = parseShapeId("web-btn");
    const freeRectId = parseShapeId("free-rect");

    const doc = createDocument([
      createRect(
        webRootId,
        { x: 0, y: 0, width: 800, height: 600 },
        {
          parent: ROOT_ID,
          meta: { order: {}, platform: PLATFORMS.web, style: STYLE_PROFILES.minimal },
        },
      ),
      createRect(
        webButtonId,
        { x: 10, y: 10, width: 100, height: 40 },
        {
          parent: webRootId,
          meta: { order: {}, semantic: { id: "button", platform: PLATFORMS.web } },
        },
      ),
      createRect(freeRectId, { x: 900, y: 10, width: 100, height: 100 }, { parent: ROOT_ID }),
    ]);

    // Walking with profile = undefined (as when a freestanding shape is selected)
    const walk = walkSemanticTree(doc, ROOT_ID, undefined);
    expect(walk).toHaveLength(3);
    // The web root rectangle still resolves as "Page"
    expect(walk[0]?.shape.id).toBe(webRootId);
    expect(walk[0]?.displayName).toBe("Page");
    // The child inside the web root still resolves as "Button"
    expect(walk[1]?.shape.id).toBe(webButtonId);
    expect(walk[1]?.displayName).toBe("Button");
    // The freestanding shape resolves as "Rectangle"
    expect(walk[2]?.shape.id).toBe(freeRectId);
    expect(walk[2]?.displayName).toBe("Rectangle");
  });

  it("supports scoped root deviceType during semantic tree walk", () => {
    const root1 = parseShapeId("root-1");
    const child1A = parseShapeId("child-1a");
    const child1B = parseShapeId("child-1b");

    const doc = createDocument([
      createRect(root1, { x: 0, y: 0, width: 800, height: 600 }, { parent: ROOT_ID }),
      createRect(
        child1A,
        { x: 10, y: 10, width: 100, height: 50 },
        {
          parent: root1,
          meta: { order: { [DEVICE_TYPES.mobile]: 2, [DEVICE_TYPES.desktop]: 1 } },
        },
      ),
      createRect(
        child1B,
        { x: 10, y: 70, width: 100, height: 50 },
        {
          parent: root1,
          meta: { order: { [DEVICE_TYPES.mobile]: 1, [DEVICE_TYPES.desktop]: 2 } },
        },
      ),
    ]);

    // Walk with scoped deviceType for root1 = mobile (child1B order 1, child1A order 2)
    const mobileWalk = walkSemanticTree(doc, root1, undefined, { [root1]: DEVICE_TYPES.mobile });
    expect(mobileWalk[1]?.shape.id).toBe(child1B);
    expect(mobileWalk[2]?.shape.id).toBe(child1A);

    // Walk with scoped deviceType for root1 = desktop (child1A order 1, child1B order 2)
    const desktopWalk = walkSemanticTree(doc, root1, undefined, { [root1]: DEVICE_TYPES.desktop });
    expect(desktopWalk[1]?.shape.id).toBe(child1A);
    expect(desktopWalk[2]?.shape.id).toBe(child1B);
  });

  it("walks large document hierarchies in linear time without quadratic slowdown", () => {
    const pageId = parseShapeId("perf-page");
    const shapes: Shape[] = [createPage(pageId, { x: 0, y: 0, width: 2000, height: 2000 })];
    for (let i = 0; i < 2000; i++) {
      shapes.push(
        createRect(
          parseShapeId(`s-${i}`),
          { x: (i % 20) * 50, y: Math.floor(i / 20) * 50, width: 40, height: 40 },
          { parent: pageId },
        ),
      );
    }
    const doc = createDocument(shapes);
    const start = Date.now();
    const nodes = walkSemanticTree(doc, pageId);
    const duration = Date.now() - start;
    expect(nodes).toHaveLength(2001);
    expect(duration).toBeLessThan(100);
  });
});

describe("theme & dark mode resolution (Idea 4, 6, R-026)", () => {
  const rootId = parseShapeId("themed-root");
  const childId = parseShapeId("themed-child");

  it("resolves root theme palette and dark mode from nested children", () => {
    const doc = createDocument([
      createRect(
        rootId,
        { x: 0, y: 0, width: 800, height: 600 },
        {
          parent: ROOT_ID,
          meta: {
            order: {},
            theme: { primary: "#3b82f6", surface: "#1e293b" },
            darkMode: true,
          },
        },
      ),
      createRect(childId, { x: 10, y: 10, width: 100, height: 40 }, { parent: rootId }),
    ]);

    expect(resolveRootTheme(doc, childId)).toEqual({ primary: "#3b82f6", surface: "#1e293b" });
    expect(resolveRootDarkMode(doc, childId)).toBe(true);
  });

  it("defaults dark mode to false and theme to undefined when omitted on root", () => {
    const doc = createDocument([
      createRect(rootId, { x: 0, y: 0, width: 800, height: 600 }, { parent: ROOT_ID }),
      createRect(childId, { x: 10, y: 10, width: 100, height: 40 }, { parent: rootId }),
    ]);

    expect(resolveRootTheme(doc, childId)).toBeUndefined();
    expect(resolveRootDarkMode(doc, childId)).toBe(false);
  });
});

describe("cross-platform concept harmonization (Idea 2, Issues D1, D2, D3)", () => {
  it("suggests equivalent semantic IDs between platforms", () => {
    // Web navbar -> Android top-app-bar -> Flutter app-bar -> iOS navigation-bar
    expect(suggestPlatformEquivalent(PLATFORMS.web, PLATFORMS.androidNative, "navbar")).toBe(
      "top-app-bar",
    );
    expect(
      suggestPlatformEquivalent(PLATFORMS.androidNative, PLATFORMS.flutter, "top-app-bar"),
    ).toBe("app-bar");
    expect(suggestPlatformEquivalent(PLATFORMS.flutter, PLATFORMS.ios, "app-bar")).toBe(
      "navigation-bar",
    );
    expect(suggestPlatformEquivalent(PLATFORMS.ios, PLATFORMS.web, "navigation-bar")).toBe(
      "navbar",
    );

    // Button equivalents
    expect(suggestPlatformEquivalent(PLATFORMS.web, PLATFORMS.flutter, "button")).toBe("button");
    expect(
      suggestPlatformEquivalent(PLATFORMS.flutter, PLATFORMS.androidNative, "elevated-button"),
    ).toBe("button");

    // Switch equivalents (Web toggle-switch <-> Android switch)
    expect(suggestPlatformEquivalent(PLATFORMS.web, PLATFORMS.androidNative, "toggle-switch")).toBe(
      "switch",
    );
    expect(suggestPlatformEquivalent(PLATFORMS.androidNative, PLATFORMS.web, "switch")).toBe(
      "toggle-switch",
    );

    // Search equivalents
    expect(suggestPlatformEquivalent(PLATFORMS.web, PLATFORMS.ios, "search-bar")).toBe(
      "search-bar",
    );
    expect(suggestPlatformEquivalent(PLATFORMS.flutter, PLATFORMS.web, "search-bar")).toBe(
      "search-bar",
    );

    // Identity when platforms match
    expect(suggestPlatformEquivalent(PLATFORMS.web, PLATFORMS.web, "navbar")).toBe("navbar");

    // Undefined for unknown concept
    expect(suggestPlatformEquivalent(PLATFORMS.web, PLATFORMS.ios, "unknown-tag")).toBeUndefined();
  });

  it("returns all known platform equivalents for a concept", () => {
    const equivalents = getPlatformEquivalents("text-field", PLATFORMS.androidNative);
    expect(equivalents.web).toBe("input");
    expect(equivalents.androidNative).toBe("text-field");
    expect(equivalents.flutter).toBe("text-field");
    expect(equivalents.ios).toBe("text-field");

    const switchEquivalents = getPlatformEquivalents("switch", PLATFORMS.androidNative);
    expect(switchEquivalents.web).toBe("toggle-switch");
    expect(switchEquivalents.androidNative).toBe("switch");
    expect(switchEquivalents.flutter).toBe("switch");
    expect(switchEquivalents.ios).toBe("switch");
  });
});

describe("semantics-version", () => {
  it("exposes integer SEMANTICS_REGISTRY_VERSION >= 1 for export parity fingerprinting (Milestone 11A)", () => {
    expect(Number.isInteger(SEMANTICS_REGISTRY_VERSION)).toBe(true);
    expect(SEMANTICS_REGISTRY_VERSION).toBeGreaterThanOrEqual(1);
  });
});

describe("pluginData metadata resolution (canvas 0.9.2 plugin architecture)", () => {
  it("resolves root properties from meta.pluginData when present", () => {
    const rootId = parseShapeId("plugin-root");
    const childId = parseShapeId("plugin-child");
    const doc = createDocument([
      createRect(
        rootId,
        { x: 0, y: 0, width: 800, height: 600 },
        {
          parent: ROOT_ID,
          meta: {
            order: {},
            pluginData: {
              [PLUGIN_ROOT_PLATFORM]: PLATFORMS.flutter,
              [PLUGIN_ROOT_ROLE]: ROOT_ROLES.component,
              [PLUGIN_DESIGN_STYLE]: DESIGN_STYLES.minimalism,
              [PLUGIN_THEME]: "ocean",
              [PLUGIN_DARK_MODE]: true,
            },
          },
        },
      ),
      createRect(
        childId,
        { x: 10, y: 10, width: 100, height: 40 },
        {
          parent: rootId,
          meta: {
            order: {},
            pluginData: {
              [PLUGIN_SEMANTICS]: { platform: "flutter", id: "button" },
            },
          },
        },
      ),
    ]);

    expect(resolveRootPlatform(doc, childId)).toBe(PLATFORMS.flutter);
    expect(resolveRootRole(doc, childId)).toBe(ROOT_ROLES.component);
    expect(resolveRootDesignStyle(doc, childId)).toBe(DESIGN_STYLES.minimalism);
    expect(resolveRootTheme(doc, childId)).toBe("ocean");
    expect(resolveRootDarkMode(doc, childId)).toBe(true);

    const childShape = doc.shapes[childId]!;
    expect(getShapeSemantic(childShape)).toEqual({ platform: "flutter", id: "button" });
  });

  describe("isSectionScopedSemantic and isComponentScopedSemantic", () => {
    it("correctly identifies section vs component scope for Web semantics", () => {
      expect(isSectionScopedSemantic({ platform: "web", id: "hero" })).toBe(true);
      expect(isSectionScopedSemantic({ platform: "web", id: "navbar" })).toBe(true);
      expect(isSectionScopedSemantic({ platform: "web", id: "button" })).toBe(false);
      expect(isComponentScopedSemantic({ platform: "web", id: "button" })).toBe(true);
      expect(isComponentScopedSemantic({ platform: "web", id: "hero" })).toBe(false);
    });

    it("correctly identifies section vs component scope for iOS semantics", () => {
      expect(isSectionScopedSemantic({ platform: "ios", id: "navigation-bar" })).toBe(true);
      expect(isSectionScopedSemantic({ platform: "ios", id: "sheet" })).toBe(true);
      expect(isSectionScopedSemantic({ platform: "ios", id: "button" })).toBe(false);
      expect(isComponentScopedSemantic({ platform: "ios", id: "button" })).toBe(true);
    });

    it("correctly identifies section vs component scope for Android semantics", () => {
      expect(isSectionScopedSemantic({ platform: "androidNative", id: "top-app-bar" })).toBe(true);
      expect(isSectionScopedSemantic({ platform: "androidNative", id: "bottom-sheet" })).toBe(true);
      expect(isSectionScopedSemantic({ platform: "androidNative", id: "button" })).toBe(false);
      expect(isComponentScopedSemantic({ platform: "androidNative", id: "button" })).toBe(true);
    });

    it("correctly identifies section vs component scope for Flutter semantics", () => {
      expect(isSectionScopedSemantic({ platform: "flutter", id: "app-bar" })).toBe(true);
      expect(isSectionScopedSemantic({ platform: "flutter", id: "drawer" })).toBe(true);
      expect(isSectionScopedSemantic({ platform: "flutter", id: "button" })).toBe(false);
      expect(isComponentScopedSemantic({ platform: "flutter", id: "button" })).toBe(true);
    });

    it("handles undefined or unknown semantics safely", () => {
      expect(isSectionScopedSemantic(undefined)).toBe(false);
      expect(isComponentScopedSemantic(undefined)).toBe(false);
      expect(isSectionScopedSemantic({ platform: "web", id: "unknown-thing" })).toBe(false);
      expect(isComponentScopedSemantic({ platform: "web", id: "unknown-thing" })).toBe(false);
    });

    it("correctly identifies containers (including card and layout categories) vs leaf components across platforms", () => {
      // Web
      expect(isContainerSemantic({ platform: "web", id: "hero" })).toBe(true);
      expect(isContainerSemantic({ platform: "web", id: "navbar" })).toBe(true);
      expect(isContainerSemantic({ platform: "web", id: "card" })).toBe(true);
      expect(isContainerSemantic({ platform: "web", id: "container" })).toBe(true);
      expect(isContainerSemantic({ platform: "web", id: "form" })).toBe(true);
      expect(isContainerSemantic({ platform: "web", id: "table" })).toBe(true);
      expect(isContainerSemantic({ platform: "web", id: "button" })).toBe(false);
      expect(isLeafComponentSemantic({ platform: "web", id: "button" })).toBe(true);
      expect(isLeafComponentSemantic({ platform: "web", id: "card" })).toBe(false);

      // iOS
      expect(isContainerSemantic({ platform: "ios", id: "navigation-bar" })).toBe(true);
      expect(isContainerSemantic({ platform: "ios", id: "card" })).toBe(true);
      expect(isContainerSemantic({ platform: "ios", id: "sheet" })).toBe(true);
      expect(isContainerSemantic({ platform: "ios", id: "button" })).toBe(false);
      expect(isLeafComponentSemantic({ platform: "ios", id: "button" })).toBe(true);

      // Android
      expect(isContainerSemantic({ platform: "androidNative", id: "top-app-bar" })).toBe(true);
      expect(isContainerSemantic({ platform: "androidNative", id: "card" })).toBe(true);
      expect(isContainerSemantic({ platform: "androidNative", id: "bottom-sheet" })).toBe(true);
      expect(isContainerSemantic({ platform: "androidNative", id: "button" })).toBe(false);
      expect(isLeafComponentSemantic({ platform: "androidNative", id: "button" })).toBe(true);

      // Flutter
      expect(isContainerSemantic({ platform: "flutter", id: "app-bar" })).toBe(true);
      expect(isContainerSemantic({ platform: "flutter", id: "card" })).toBe(true);
      expect(isContainerSemantic({ platform: "flutter", id: "drawer" })).toBe(true);
      expect(isContainerSemantic({ platform: "flutter", id: "button" })).toBe(false);
      expect(isLeafComponentSemantic({ platform: "flutter", id: "button" })).toBe(true);
    });
  });
});
