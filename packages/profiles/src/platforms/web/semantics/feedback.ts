import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const FEEDBACK_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  alert: Object.freeze({
    id: parseSemanticId("alert"),
    displayName: "Alert Banner",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
  }),
  toast: Object.freeze({
    id: parseSemanticId("toast"),
    displayName: "Toast Notification",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
  }),
  "progress-bar": Object.freeze({
    id: parseSemanticId("progress-bar"),
    displayName: "Progress Bar",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
  }),
  spinner: Object.freeze({
    id: parseSemanticId("spinner"),
    displayName: "Loading Spinner",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
  }),
  skeleton: Object.freeze({
    id: parseSemanticId("skeleton"),
    displayName: "Skeleton Loader",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
  }),
  "empty-state": Object.freeze({
    id: parseSemanticId("empty-state"),
    displayName: "Empty State",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
  }),
  modal: Object.freeze({
    id: parseSemanticId("modal"),
    displayName: "Modal Window",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "backdrop",
        control: CONTROL_TYPES.toggle,
        label: "Backdrop Overlay",
        defaultValue: true,
      }),
      Object.freeze({
        id: "dismissible",
        control: CONTROL_TYPES.toggle,
        label: "Dismissible",
        defaultValue: true,
      }),
    ]),
  }),
  drawer: Object.freeze({
    id: parseSemanticId("drawer"),
    displayName: "Side Drawer",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "placement",
        control: CONTROL_TYPES.select,
        label: "Placement",
        defaultValue: "right",
        options: Object.freeze([
          Object.freeze({ value: "right", label: "Right" }),
          Object.freeze({ value: "left", label: "Left" }),
          Object.freeze({ value: "bottom", label: "Bottom" }),
          Object.freeze({ value: "top", label: "Top" }),
        ]),
      }),
    ]),
  }),
  popover: Object.freeze({
    id: parseSemanticId("popover"),
    displayName: "Popover",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
  }),
  tooltip: Object.freeze({
    id: parseSemanticId("tooltip"),
    displayName: "Tooltip",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
  }),
});
