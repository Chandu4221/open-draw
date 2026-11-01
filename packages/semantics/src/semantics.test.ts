import { describe, expect, it } from "vitest";
import { DEVICE_TYPES, parseShapeId, PLATFORMS, STYLE_PROFILES } from "@open-draw/contracts";
import { createDocument, createPage, createRect, createSection } from "@open-draw/document";
import { ANDROID_NATIVE_PROFILE, FLUTTER_PROFILE, WEB_PROFILE } from "@open-draw/profiles";
import {
  computeSemanticConflict,
  resolveRootPage,
  resolveRootPlatform,
  resolveRootStyle,
  resolveSemantic,
  resolveShapeDisplayName,
  walkSemanticTree,
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
});
