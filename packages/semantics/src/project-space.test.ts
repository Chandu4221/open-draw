import { describe, expect, it } from "vitest";
import {
  DESIGN_STYLES,
  parseShapeId,
  ROOT_ID,
  ROOT_ROLES,
  STYLE_PROFILES,
  type ThemePalette,
} from "@open-draw/contracts";
import { createDocument, createRect, createSection } from "@open-draw/document";
import { ANDROID_NATIVE_PROFILE } from "@open-draw/profiles";
import {
  resolveRootDarkMode,
  resolveRootDesignStyle,
  resolveRootPlatform,
  resolveRootRole,
  resolveRootStyle,
  resolveRootTheme,
  resolveShapeDisplayName,
  resolveShapeSemanticType,
  walkSemanticTree,
} from "./index";

describe("Project Space semantics and multi-screen inheritance (R-024, R-026, R-042)", () => {
  const projectId = parseShapeId("project-1");
  const screen1Id = parseShapeId("screen-1");
  const screen2Id = parseShapeId("screen-2");
  const buttonId = parseShapeId("btn-1");

  const sampleTheme: ThemePalette = {
    primary: "#6750A4",
    secondary: "#625B71",
  };

  function createProjectDoc() {
    return createDocument([
      createSection(projectId, { x: 0, y: 0, width: 1200, height: 900 }, "row", {
        parent: ROOT_ID,
        label: "E-Commerce App",
        meta: {
          order: {},
          role: ROOT_ROLES.project,
          platform: "androidNative",
          designStyle: DESIGN_STYLES.minimalism,
          style: STYLE_PROFILES.minimal,
          theme: sampleTheme,
          darkMode: true,
        },
      }),
      createRect(
        screen1Id,
        { x: 50, y: 50, width: 360, height: 720 },
        {
          parent: projectId,
          label: "Login Screen",
          meta: { order: {} },
        },
      ),
      createRect(
        screen2Id,
        { x: 450, y: 50, width: 360, height: 720 },
        {
          parent: projectId,
          label: "Home Screen",
          meta: { order: {} },
        },
      ),
      createRect(
        buttonId,
        { x: 20, y: 200, width: 120, height: 48 },
        {
          parent: screen1Id,
          meta: {
            order: {},
            semantic: { id: "button", platform: "androidNative" },
          },
        },
      ),
    ]);
  }

  it("resolves Project Space display name and semantic type", () => {
    const doc = createProjectDoc();
    const projectShape = doc.shapes[projectId]!;

    expect(resolveShapeDisplayName(projectShape, ANDROID_NATIVE_PROFILE)).toBe("E-Commerce App");
    expect(resolveShapeSemanticType(projectShape, ANDROID_NATIVE_PROFILE)).toBe("Project Space");

    const unlabeledProject = createSection(
      projectId,
      { x: 0, y: 0, width: 1000, height: 800 },
      "row",
      {
        parent: ROOT_ID,
        meta: { order: {}, role: ROOT_ROLES.project },
      },
    );
    expect(resolveShapeDisplayName(unlabeledProject)).toBe("Project Space");
    expect(resolveShapeSemanticType(unlabeledProject)).toBe("Project Space");
  });

  it("propagates unified platform, designStyle, theme, and darkMode across all member screens", () => {
    const doc = createProjectDoc();

    // Project Space holds properties
    expect(resolveRootRole(doc, projectId)).toBe(ROOT_ROLES.project);
    expect(resolveRootPlatform(doc, projectId)).toBe("androidNative");
    expect(resolveRootDesignStyle(doc, projectId)).toBe(DESIGN_STYLES.minimalism);
    expect(resolveRootStyle(doc, projectId)).toBe(STYLE_PROFILES.minimal);
    expect(resolveRootTheme(doc, projectId)).toEqual(sampleTheme);
    expect(resolveRootDarkMode(doc, projectId)).toBe(true);

    // Screen 1 inherits from Project Space
    expect(resolveRootPlatform(doc, screen1Id)).toBe("androidNative");
    expect(resolveRootDesignStyle(doc, screen1Id)).toBe(DESIGN_STYLES.minimalism);
    expect(resolveRootTheme(doc, screen1Id)).toEqual(sampleTheme);
    expect(resolveRootDarkMode(doc, screen1Id)).toBe(true);

    // Screen 2 inherits from Project Space
    expect(resolveRootPlatform(doc, screen2Id)).toBe("androidNative");
    expect(resolveRootDesignStyle(doc, screen2Id)).toBe(DESIGN_STYLES.minimalism);
    expect(resolveRootTheme(doc, screen2Id)).toEqual(sampleTheme);
    expect(resolveRootDarkMode(doc, screen2Id)).toBe(true);

    // Button inside Screen 1 inherits from Project Space
    expect(resolveRootPlatform(doc, buttonId)).toBe("androidNative");
    expect(resolveRootDesignStyle(doc, buttonId)).toBe(DESIGN_STYLES.minimalism);
    expect(resolveRootTheme(doc, buttonId)).toEqual(sampleTheme);
    expect(resolveRootDarkMode(doc, buttonId)).toBe(true);
  });

  it("walks semantic tree preserving Project Space hierarchy and member screens", () => {
    const doc = createProjectDoc();
    const nodes = walkSemanticTree(doc, projectId);

    expect(nodes.length).toBe(4);
    expect(nodes[0]?.shape.id).toBe(projectId);
    expect(nodes[0]?.depth).toBe(0);
    expect(nodes[0]?.displayName).toBe("E-Commerce App");
    expect(nodes[0]?.semanticType).toBe("Project Space");

    expect(nodes[1]?.shape.id).toBe(screen1Id);
    expect(nodes[1]?.depth).toBe(1);
    expect(nodes[1]?.displayName).toBe("Login Screen");

    expect(nodes[2]?.shape.id).toBe(buttonId);
    expect(nodes[2]?.depth).toBe(2);
    expect(nodes[2]?.displayName).toBe("Filled Button");

    expect(nodes[3]?.shape.id).toBe(screen2Id);
    expect(nodes[3]?.depth).toBe(1);
    expect(nodes[3]?.displayName).toBe("Home Screen");
  });
});
