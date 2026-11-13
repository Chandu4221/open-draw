import type { ShapeId } from "@open-draw/canvas";
import { ROOT_ID, SHAPE_KINDS } from "@open-draw/canvas";
import { PLATFORMS } from "@open-draw/profiles";
import { ROOT_ROLES } from "@open-draw/semantics";
import { createDocument, type Document, type Shape } from "@open-draw/canvas";

/**
 * Default sample Profile Card component document pre-loaded on a fresh studio canvas.
 */
export function createDefaultSampleDocument(): Document {
  const shapes: readonly Shape[] = [
    {
      id: "s-7a01" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: ROOT_ID,
      boundingBox: {
        x: 496.03,
        y: 175.37,
        width: 490.53,
        height: 264.81,
      },
      label: "Profile Card",
      meta: {
        platform: PLATFORMS.web,
        role: ROOT_ROLES.component,
        order: {},
        semantic: {
          id: "card",
          platform: PLATFORMS.web,
        },
      },
    },
    {
      id: "s-7a02" as ShapeId,
      kind: SHAPE_KINDS.ellipse,
      parentId: "s-7a01" as ShapeId,
      boundingBox: {
        x: 19.32,
        y: 22.66,
        width: 106.01,
        height: 104.06,
      },
      label: "User Image",
      meta: {
        order: {},
        semantic: {
          id: "image",
          platform: PLATFORMS.web,
        },
      },
    },
    {
      id: "s-7a03" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a01" as ShapeId,
      boundingBox: {
        x: 145.27,
        y: 29.02,
        width: 100,
        height: 32,
      },
      label: "Username",
      content: "John Doe",
      meta: {
        order: {},
        semantic: {
          id: "heading",
          platform: PLATFORMS.web,
          properties: {
            level: "3",
          },
        },
      },
    },
    {
      id: "s-7a04" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a01" as ShapeId,
      boundingBox: {
        x: 149.45,
        y: 71.78,
        width: 100,
        height: 32,
      },
      label: "Prodession",
      content: "Developer",
      meta: {
        order: {},
        semantic: {
          id: "heading",
          platform: PLATFORMS.web,
          properties: {
            level: "4",
          },
        },
      },
    },
    {
      id: "s-7a05" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a01" as ShapeId,
      boundingBox: {
        x: 40.35,
        y: 169.79,
        width: 169.96,
        height: 46.4,
      },
      content: "Hire Me",
      meta: {
        order: {},
        semantic: {
          id: "button",
          platform: PLATFORMS.web,
        },
      },
    },
    {
      id: "s-7a06" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a01" as ShapeId,
      boundingBox: {
        x: 279.67,
        y: 169.79,
        width: 169.96,
        height: 46.4,
      },
      content: "Visit Profile",
      meta: {
        order: {},
        semantic: {
          id: "button",
          platform: PLATFORMS.web,
          properties: {
            variant: "outline",
          },
        },
      },
    },
  ];

  return createDocument(shapes);
}
