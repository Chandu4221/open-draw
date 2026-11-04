import { describe, expect, it } from "vitest";
import { parseShapeId, PLATFORMS, ROOT_ID, ROOT_ROLES } from "@open-draw/contracts";
import { createDocument, createPage, createRect } from "@open-draw/document";
import { WEB_PROFILE } from "@open-draw/profiles";
import { computeSemanticConflict, resolveRootRole, resolveShapeDisplayName } from "./index";

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
});
