import type { ShapeId } from "@open-draw/canvas";
import { ROOT_ID, SHAPE_KINDS } from "@open-draw/canvas";
import { PLATFORMS } from "@open-draw/profiles";
import {
  PLUGIN_DESIGN_STYLE,
  PLUGIN_ROOT_PLATFORM,
  PLUGIN_ROOT_ROLE,
  PLUGIN_SEMANTICS,
  ROOT_ROLES,
} from "@open-draw/semantics";
import { createDocument, type Document, type Shape } from "@open-draw/canvas";

export const DEFAULT_SAMPLE_AI_DIRECTIVES: readonly string[] = [
  "- **Creativity Level**: Level 3 — Balanced",
  "- **Directive**: Interpret the wireframe using standard UX best practices. Preserve all core components and structure while implementing essential missing states \\(e.g. hover states, loading skeletons, error indicators, empty states\\).",
  "- **Accessibility & Contrast (WCAG 2.1 AA)**:",
  "  - Maintain minimum 4.5:1 text-to-background contrast ratio (3:1 for large text). Validate palette pairings via tools like colorcontrast.cc.",
  "  - Interactive elements must maintain minimum 44×44px touch targets (48×48dp on mobile) and clearly visible focus rings for keyboard navigation.",
  "  - Provide semantic ARIA landmarks (header, nav, main, aside, footer) and descriptive labels on all interactive controls.",
  "- **Semantic Context & Slot Inference (Smart Semantics)**:",
  "  - Child elements inherit semantic roles from their tagged parent container. For example, text and icons nested within a navigation bar, tab row, or app bar represent navigation items; children inside a card, list item, or dialog represent header, media, body, and actions in document order.",
  "  - Do not render untagged child shapes as raw unstyled containers — map them directly into the parent component's idiomatic slots and sub-elements.",
  "- **Theme Architecture (Single Light Mode)**:",
  "  - Implement a clean single Light theme mode.",
  "- **Stack Guidance (Web)**: Implement as modular React components with TypeScript and Tailwind CSS. Ensure responsive layout behavior across device classes.",
];

/**
 * Default sample OpenDraw Studio Landing Page document pre-loaded on a fresh studio canvas.
 * Dogfoods OpenDraw Studio's own frontpage wireframe with 34 shapes and N-level nesting.
 */
export function createDefaultSampleDocument(): Document {
  const shapes: readonly Shape[] = [
    {
      id: "s-7a07" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: ROOT_ID,
      boundingBox: {
        x: 273.61,
        y: 127.69,
        width: 719.12,
        height: 865.71,
      },
      label: "OpenDraw Studio Landing Page",
      meta: {
        order: {},
        isContainer: true,
        platform: PLATFORMS.web,
        role: ROOT_ROLES.screen,
        pluginData: {
          [PLUGIN_ROOT_PLATFORM]: "web",
          [PLUGIN_DESIGN_STYLE]: "glassmorphism",
          [PLUGIN_ROOT_ROLE]: "screen",
        },
      },
    },
    {
      id: "s-7a09" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a07" as ShapeId,
      boundingBox: {
        x: 11.56,
        y: 14.65,
        width: 692.34,
        height: 76.68,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "navbar", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "navbar", platform: "web" },
        },
      },
    },
    {
      id: "s-7a0a" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a09" as ShapeId,
      boundingBox: {
        x: 21.41,
        y: 22.34,
        width: 100,
        height: 32,
      },
      label: "Logo",
      content: "Open Draw",
      meta: {
        order: {},
        semantic: { id: "link", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "link", platform: "web" },
        },
      },
    },
    {
      id: "s-7a0b" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a09" as ShapeId,
      boundingBox: {
        x: 262.25,
        y: 14.84,
        width: 312.47,
        height: 39.5,
      },
      content: "Style Switcher Segmented Buttons",
      meta: {
        order: {},
        semantic: { id: "segmented-control", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "segmented-control", platform: "web" },
        },
      },
    },
    {
      id: "s-7a0c" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a09" as ShapeId,
      boundingBox: {
        x: 591.54,
        y: 11.67,
        width: 90.27,
        height: 42.68,
      },
      content: "Try OpenDraw",
      meta: {
        order: {},
        semantic: { id: "button", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "button", platform: "web" },
        },
      },
    },
    {
      id: "s-7a11" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a07" as ShapeId,
      boundingBox: {
        x: 11.56,
        y: 114.82,
        width: 692.34,
        height: 155.83,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "section", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "section", platform: "web" },
        },
      },
    },
    {
      id: "s-7a12" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a11" as ShapeId,
      boundingBox: {
        x: 86.8,
        y: 46.74,
        width: 522.39,
        height: 31.18,
      },
      content: "Open Draw turns canvas wireframes into semantic structure and frontend markup.",
      meta: {
        order: {},
        semantic: { id: "heading", platform: "web", properties: { level: "3" } },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "heading", platform: "web", properties: { level: "3" } },
        },
      },
    },
    {
      id: "s-7a13" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a11" as ShapeId,
      boundingBox: {
        x: 243.39,
        y: 94.37,
        width: 205.57,
        height: 43.7,
      },
      content: "Try OpenDraw",
      meta: {
        order: {},
        semantic: { id: "button", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "button", platform: "web" },
        },
      },
    },
    {
      id: "s-7a14" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a11" as ShapeId,
      boundingBox: {
        x: 155.91,
        y: 7.91,
        width: 380.51,
        height: 32,
      },
      content: "Design interfaces visually. Add meaning. Ship code",
      meta: {
        order: {},
        semantic: { id: "heading", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "heading", platform: "web" },
        },
      },
    },
    {
      id: "s-7a15" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a07" as ShapeId,
      boundingBox: {
        x: 11.56,
        y: 287.26,
        width: 692.34,
        height: 173.01,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "section", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "section", platform: "web" },
        },
      },
    },
    {
      id: "s-7a16" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a15" as ShapeId,
      boundingBox: {
        x: 191.69,
        y: 21.07,
        width: 314.03,
        height: 32,
      },
      content: "Same structure. Different design languages.",
      meta: {
        order: {},
        semantic: { id: "heading", platform: "web", properties: { level: "3" } },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "heading", platform: "web", properties: { level: "3" } },
        },
      },
    },
    {
      id: "s-7a17" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a15" as ShapeId,
      boundingBox: {
        x: 9.62,
        y: 86.5,
        width: 133.25,
        height: 66.61,
      },
      label: "Design Style Card",
      content: "Minimal",
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a18" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a15" as ShapeId,
      boundingBox: {
        x: 150.87,
        y: 86.5,
        width: 133.25,
        height: 66.61,
      },
      label: "Design Style Card",
      content: "Glass",
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a26" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a15" as ShapeId,
      boundingBox: {
        x: 294.5,
        y: 86.5,
        width: 133.25,
        height: 66.61,
      },
      label: "Design Style Card",
      content: "Editorial",
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a27" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a15" as ShapeId,
      boundingBox: {
        x: 436.43,
        y: 86.5,
        width: 133.25,
        height: 66.61,
      },
      label: "Design Style Card",
      content: "Brutalist",
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a28" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a15" as ShapeId,
      boundingBox: {
        x: 580.63,
        y: 86.5,
        width: 96.14,
        height: 66.61,
      },
      label: "Design Style Card",
      content: "Soft",
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a29" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a07" as ShapeId,
      boundingBox: {
        x: 12.66,
        y: 472.69,
        width: 691.24,
        height: 179.07,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "section", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "section", platform: "web" },
        },
      },
    },
    {
      id: "s-7a2a" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a29" as ShapeId,
      boundingBox: {
        x: 219.22,
        y: 22.02,
        width: 256.75,
        height: 32,
      },
      content: "More than shapes on a canvas.",
      meta: {
        order: {},
        semantic: { id: "heading", platform: "web", properties: { level: "3" } },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "heading", platform: "web", properties: { level: "3" } },
        },
      },
    },
    {
      id: "s-7a2b" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a29" as ShapeId,
      boundingBox: {
        x: 18.63,
        y: 90.11,
        width: 123.13,
        height: 77.36,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a2c" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a2b" as ShapeId,
      boundingBox: {
        x: 11.57,
        y: 12.03,
        width: 100,
        height: 32,
      },
      content: "Draw on a real canvas",
      meta: {
        order: {},
        semantic: { id: "header", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "header", platform: "web" },
        },
      },
    },
    {
      id: "s-7a2d" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a2b" as ShapeId,
      boundingBox: {
        x: 11.57,
        y: 44.03,
        width: 100,
        height: 32,
      },
      content: "Build layouts with shapes, hierarchy, and structure.",
      meta: {
        order: {},
      },
    },
    {
      id: "s-7a2e" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a29" as ShapeId,
      boundingBox: {
        x: 190.58,
        y: 88.77,
        width: 123.13,
        height: 77.36,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a2f" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a2e" as ShapeId,
      boundingBox: {
        x: 11.57,
        y: 12.03,
        width: 100,
        height: 32,
      },
      content: "Tag components with meaning",
      meta: {
        order: {},
        semantic: { id: "header", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "header", platform: "web" },
        },
      },
    },
    {
      id: "s-7a30" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a2e" as ShapeId,
      boundingBox: {
        x: 11.57,
        y: 44.03,
        width: 100,
        height: 32,
      },
      content: "Mark what each element is—button, nav, form, screen.",
      meta: {
        order: {},
      },
    },
    {
      id: "s-7a31" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a29" as ShapeId,
      boundingBox: {
        x: 365.08,
        y: 88.77,
        width: 123.13,
        height: 77.36,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a32" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a31" as ShapeId,
      boundingBox: {
        x: 11.57,
        y: 12.03,
        width: 100,
        height: 32,
      },
      content: "Export structured markup",
      meta: {
        order: {},
        semantic: { id: "header", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "header", platform: "web" },
        },
      },
    },
    {
      id: "s-7a33" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a31" as ShapeId,
      boundingBox: {
        x: 11.57,
        y: 44.03,
        width: 100,
        height: 32,
      },
      content: "Turn the document into specs and frontend-ready output.",
      meta: {
        order: {},
      },
    },
    {
      id: "s-7a34" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a29" as ShapeId,
      boundingBox: {
        x: 536.41,
        y: 89.53,
        width: 123.13,
        height: 77.36,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "card", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "card", platform: "web" },
        },
      },
    },
    {
      id: "s-7a35" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a34" as ShapeId,
      boundingBox: {
        x: 11.57,
        y: 12.03,
        width: 100,
        height: 32,
      },
      content: "Swap styles without redrawing",
      meta: {
        order: {},
        semantic: { id: "header", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "header", platform: "web" },
        },
      },
    },
    {
      id: "s-7a36" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a34" as ShapeId,
      boundingBox: {
        x: 11.57,
        y: 44.03,
        width: 100,
        height: 32,
      },
      content: "Explore visual languages on the same underlying structure.",
      meta: {
        order: {},
      },
    },
    {
      id: "s-7a37" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a07" as ShapeId,
      boundingBox: {
        x: 11.9,
        y: 667.84,
        width: 685.13,
        height: 176.76,
      },
      meta: {
        order: {},
        isContainer: true,
        semantic: { id: "section", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "section", platform: "web" },
        },
      },
    },
    {
      id: "s-7a38" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a37" as ShapeId,
      boundingBox: {
        x: 215.09,
        y: 23.82,
        width: 291.4,
        height: 32,
      },
      content: "Start drawing. Add meaning. Ship the interface.",
      meta: {
        order: {},
        semantic: { id: "heading", platform: "web", properties: { level: "3" } },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "heading", platform: "web", properties: { level: "3" } },
        },
      },
    },
    {
      id: "s-7a39" as ShapeId,
      kind: SHAPE_KINDS.text,
      parentId: "s-7a37" as ShapeId,
      boundingBox: {
        x: 139.61,
        y: 65.84,
        width: 452.47,
        height: 32,
      },
      content: "Open Draw is the canvas between visual design and working markup.",
      meta: {
        order: {},
      },
    },
    {
      id: "s-7a3a" as ShapeId,
      kind: SHAPE_KINDS.rect,
      parentId: "s-7a37" as ShapeId,
      boundingBox: {
        x: 243.05,
        y: 110.66,
        width: 205.57,
        height: 43.7,
      },
      content: "Try OpenDraw",
      meta: {
        order: {},
        semantic: { id: "button", platform: "web" },
        pluginData: {
          [PLUGIN_SEMANTICS]: { id: "button", platform: "web" },
        },
      },
    },
  ];

  return createDocument(shapes);
}
