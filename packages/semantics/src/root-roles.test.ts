import { describe, expect, it } from "vitest";
import { parseShapeId, PLATFORMS, ROOT_ID, ROOT_ROLES } from "@open-draw/contracts";
import {
  createDocument,
  createEllipse,
  createPage,
  createRect,
  createText,
} from "@open-draw/document";
import { ANDROID_NATIVE_PROFILE, FLUTTER_PROFILE, WEB_PROFILE } from "@open-draw/profiles";
import {
  computeSemanticConflict,
  resolveRootRole,
  resolveShapeDisplayName,
  resolveShapeSemanticType,
} from "./index";

describe("root roles (R-024, R-026, R-042)", () => {
  const rootId = parseShapeId("root-1");
  const childId = parseShapeId("child-1");

  it("resolves root role defaulting to screen baseline (R-024)", () => {
    const doc = createDocument([
      createPage(rootId, { x: 0, y: 0, width: 1000, height: 1000 }),
      createRect(childId, { x: 10, y: 10, width: 100, height: 50 }, { parent: rootId }),
    ]);

    expect(resolveRootRole(doc, rootId)).toBe(ROOT_ROLES.screen);
    expect(resolveRootRole(doc, childId)).toBe(ROOT_ROLES.screen);
  });

  it("resolves component role for root shapes and inherited by children", () => {
    const doc = createDocument([
      createRect(
        rootId,
        { x: 0, y: 0, width: 400, height: 300 },
        {
          parent: ROOT_ID,
          meta: { order: {}, role: ROOT_ROLES.component, platform: PLATFORMS.web },
        },
      ),
      createRect(childId, { x: 10, y: 10, width: 100, height: 50 }, { parent: rootId }),
    ]);

    expect(resolveRootRole(doc, rootId)).toBe(ROOT_ROLES.component);
    expect(resolveRootRole(doc, childId)).toBe(ROOT_ROLES.component);
  });

  it("resolves display name for root component shapes (semantic display name or Component)", () => {
    const untaggedComponent = createRect(
      rootId,
      { x: 0, y: 0, width: 400, height: 300 },
      {
        parent: ROOT_ID,
        meta: { order: {}, role: ROOT_ROLES.component, platform: PLATFORMS.web },
      },
    );
    expect(resolveShapeDisplayName(untaggedComponent, WEB_PROFILE)).toBe("Component");

    const taggedCard = createRect(
      rootId,
      { x: 0, y: 0, width: 400, height: 300 },
      {
        parent: ROOT_ID,
        meta: {
          order: {},
          role: ROOT_ROLES.component,
          platform: PLATFORMS.web,
          semantic: { id: "card", platform: PLATFORMS.web },
        },
      },
    );
    expect(resolveShapeDisplayName(taggedCard, WEB_PROFILE)).toBe("Card");

    const labeledCard = createRect(
      rootId,
      { x: 0, y: 0, width: 400, height: 300 },
      {
        parent: ROOT_ID,
        label: "User Profile Card",
        meta: {
          order: {},
          role: ROOT_ROLES.component,
          platform: PLATFORMS.web,
          semantic: { id: "card", platform: PLATFORMS.web },
        },
      },
    );
    expect(resolveShapeDisplayName(labeledCard, WEB_PROFILE)).toBe("User Profile Card");
  });

  it("validates semantic tags on root component shapes and rejects rootSemantic on components", () => {
    const doc = createDocument([
      createRect(
        rootId,
        { x: 0, y: 0, width: 400, height: 300 },
        {
          parent: ROOT_ID,
          meta: {
            order: {},
            role: ROOT_ROLES.component,
            platform: PLATFORMS.web,
            semantic: { id: "card", platform: PLATFORMS.web },
          },
        },
      ),
    ]);

    // Valid component semantic
    expect(computeSemanticConflict(doc, doc.shapes[rootId]!, WEB_PROFILE)).toBeUndefined();

    // Assigning rootSemantic ("page") to a component causes conflict
    const invalidDoc = createDocument([
      createRect(
        rootId,
        { x: 0, y: 0, width: 400, height: 300 },
        {
          parent: ROOT_ID,
          meta: {
            order: {},
            role: ROOT_ROLES.component,
            platform: PLATFORMS.web,
            semantic: { id: "page", platform: PLATFORMS.web },
          },
        },
      ),
    ]);
    const conflict = computeSemanticConflict(invalidDoc, invalidDoc.shapes[rootId]!, WEB_PROFILE);
    expect(conflict?.status).toBe("conflicted");
    expect(conflict?.reason).toContain('Root semantic "page" cannot be assigned to a component.');
  });

  describe("resolveShapeSemanticType (R-023, R-024, R-026, R-042)", () => {
    it("resolves Page / Component for Web platform roots", () => {
      // Default (role undefined) -> Page
      const defaultWebRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 800, height: 600 },
        { parent: ROOT_ID, meta: { order: {}, platform: PLATFORMS.web } },
      );
      expect(resolveShapeSemanticType(defaultWebRoot, WEB_PROFILE)).toBe("Page");

      // Explicit screen role -> Page
      const screenWebRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 800, height: 600 },
        { parent: ROOT_ID, meta: { order: {}, platform: PLATFORMS.web, role: ROOT_ROLES.screen } },
      );
      expect(resolveShapeSemanticType(screenWebRoot, WEB_PROFILE)).toBe("Page");

      // Explicit component role -> Component
      const componentWebRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 400, height: 300 },
        {
          parent: ROOT_ID,
          meta: { order: {}, platform: PLATFORMS.web, role: ROOT_ROLES.component },
        },
      );
      expect(resolveShapeSemanticType(componentWebRoot, WEB_PROFILE)).toBe("Component");
    });

    it("resolves Screen / Component for Android, Flutter, and iOS platform roots", () => {
      // Android Native: default -> Screen, component -> Component
      const androidRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 360, height: 800 },
        { parent: ROOT_ID, meta: { order: {}, platform: "androidNative" } },
      );
      expect(resolveShapeSemanticType(androidRoot, ANDROID_NATIVE_PROFILE)).toBe("Screen");

      const androidCompRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 360, height: 800 },
        {
          parent: ROOT_ID,
          meta: { order: {}, platform: "androidNative", role: ROOT_ROLES.component },
        },
      );
      expect(resolveShapeSemanticType(androidCompRoot, ANDROID_NATIVE_PROFILE)).toBe("Component");

      // Flutter: default -> Screen, component -> Component
      const flutterRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 360, height: 800 },
        { parent: ROOT_ID, meta: { order: {}, platform: PLATFORMS.flutter } },
      );
      expect(resolveShapeSemanticType(flutterRoot, FLUTTER_PROFILE)).toBe("Screen");

      const flutterCompRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 360, height: 800 },
        {
          parent: ROOT_ID,
          meta: { order: {}, platform: PLATFORMS.flutter, role: ROOT_ROLES.component },
        },
      );
      expect(resolveShapeSemanticType(flutterCompRoot, FLUTTER_PROFILE)).toBe("Component");

      // iOS: default -> Screen, component -> Component
      const iosRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 375, height: 812 },
        { parent: ROOT_ID, meta: { order: {}, platform: PLATFORMS.ios } },
      );
      expect(resolveShapeSemanticType(iosRoot)).toBe("Screen");

      const iosCompRoot = createRect(
        rootId,
        { x: 0, y: 0, width: 375, height: 812 },
        {
          parent: ROOT_ID,
          meta: { order: {}, platform: PLATFORMS.ios, role: ROOT_ROLES.component },
        },
      );
      expect(resolveShapeSemanticType(iosCompRoot)).toBe("Component");
    });

    it("resolves default shape kind semantic type for None / Platform-Agnostic roots", () => {
      const agnosticRect = createRect(
        rootId,
        { x: 0, y: 0, width: 400, height: 300 },
        { parent: ROOT_ID, meta: { order: {} } },
      );
      expect(resolveShapeSemanticType(agnosticRect)).toBe("Rectangle");

      const agnosticEllipse = createEllipse(
        rootId,
        { x: 0, y: 0, width: 200, height: 200 },
        { parent: ROOT_ID, meta: { order: {} } },
      );
      expect(resolveShapeSemanticType(agnosticEllipse)).toBe("Ellipse");

      const agnosticText = createText(
        rootId,
        { x: 0, y: 0, width: 100, height: 30 },
        {
          parent: ROOT_ID,
          content: "Hello",
          meta: { order: {} },
        },
      );
      expect(resolveShapeSemanticType(agnosticText)).toBe("Text");
    });

    it("resolves semantic displayName for tagged child shapes and undefined for untagged child shapes", () => {
      const taggedChild = createRect(
        childId,
        { x: 10, y: 10, width: 100, height: 40 },
        {
          parent: rootId,
          meta: { order: {}, semantic: { id: "button", platform: PLATFORMS.web } },
        },
      );
      expect(resolveShapeSemanticType(taggedChild, WEB_PROFILE)).toBe("Button");

      const untaggedChild = createRect(
        childId,
        { x: 10, y: 10, width: 100, height: 40 },
        { parent: rootId, meta: { order: {} } },
      );
      expect(resolveShapeSemanticType(untaggedChild, WEB_PROFILE)).toBeUndefined();
    });
  });
});
