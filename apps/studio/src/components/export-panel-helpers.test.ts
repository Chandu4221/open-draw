import { describe, expect, it } from "vitest";
import { parseShapeId, ROOT_ID, SHAPE_KINDS } from "@open-draw/canvas";
import { createDocument, type Shape } from "@open-draw/canvas";
import { buildExportZipFiles } from "./export-panel-helpers";

describe("export-panel-helpers buildExportZipFiles", () => {
  const root1: Shape = {
    id: parseShapeId("screen-login"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 0, y: 0, width: 360, height: 720 },
    label: "Login Screen",
    meta: { order: {}, platform: "androidNative" },
  };

  const root2: Shape = {
    id: parseShapeId("screen-home"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 400, y: 0, width: 360, height: 720 },
    label: "Home Screen",
    meta: { order: {}, platform: "androidNative" },
  };

  const root3: Shape = {
    id: parseShapeId("screen-settings"),
    parentId: ROOT_ID,
    kind: SHAPE_KINDS.rect,
    boundingBox: { x: 800, y: 0, width: 360, height: 720 },
    label: "Settings Screen",
    meta: { order: {}, platform: "androidNative" },
  };

  const doc = createDocument([root1, root2, root3]);

  it("generates separate scoped files for each selected root container without unselected containers", () => {
    const files = buildExportZipFiles({
      doc,
      isMultiContainerSelected: true,
      selectedRootContainers: [root1, root2],
      targetRootShape: root1,
      selectedFormats: { markdown: true, json: false, svg: false, png: false },
      baseSlug: "selected-screens",
    });

    expect(files).toHaveLength(2);
    expect(files[0]!.name).toBe("login-screen.md");
    expect(files[1]!.name).toBe("home-screen.md");

    // Scoped payload verification (no leak of unselected screens or other screens)
    expect(files[0]!.data).toContain("Login Screen");
    expect(files[0]!.data).not.toContain("Home Screen");
    expect(files[0]!.data).not.toContain("Settings Screen");

    expect(files[1]!.data).toContain("Home Screen");
    expect(files[1]!.data).not.toContain("Login Screen");
    expect(files[1]!.data).not.toContain("Settings Screen");
  });

  it("disambiguates filenames when multiple selected containers have identical names", () => {
    const dupe1: Shape = { ...root1, label: "Card" };
    const dupe2: Shape = { ...root2, label: "Card" };
    const dupeDoc = createDocument([dupe1, dupe2]);

    const files = buildExportZipFiles({
      doc: dupeDoc,
      isMultiContainerSelected: true,
      selectedRootContainers: [dupe1, dupe2],
      selectedFormats: { markdown: true, json: false, svg: false, png: false },
      baseSlug: "selected-components",
    });

    expect(files).toHaveLength(2);
    expect(files[0]!.name).toBe("card.md");
    expect(files[1]!.name).toBe("card-2.md");
  });

  it("exports single root container or entire canvas with baseSlug when not multi-selected", () => {
    const files = buildExportZipFiles({
      doc,
      isMultiContainerSelected: false,
      selectedRootContainers: [],
      targetRootShape: root1,
      selectedFormats: { markdown: true, json: true, svg: false, png: false },
      baseSlug: "login-screen",
    });

    expect(files).toHaveLength(2);
    expect(files[0]!.name).toBe("login-screen.md");
    expect(files[1]!.name).toBe("login-screen.json");
    expect(files[0]!.data).toContain("Login Screen");
    expect(files[0]!.data).not.toContain("Home Screen");
  });
});
