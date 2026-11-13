import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const ANDROID_FEEDBACK_SEMANTICS: Readonly<Record<string, SemanticDefinition>> =
  Object.freeze({
    dialog: Object.freeze({
      id: parseSemanticId("dialog"),
      displayName: "Material Dialog",
      category: SEMANTIC_CATEGORIES.feedback,
      scope: "section",
    }),
    snackbar: Object.freeze({
      id: parseSemanticId("snackbar"),
      displayName: "Snackbar",
      category: SEMANTIC_CATEGORIES.feedback,
      scope: "component",
    }),
    badge: Object.freeze({
      id: parseSemanticId("badge"),
      displayName: "Badge Indicator",
      category: SEMANTIC_CATEGORIES.feedback,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "label",
          control: CONTROL_TYPES.text,
          label: "Label",
          defaultValue: "",
        }),
      ]),
    }),
    "progress-indicator": Object.freeze({
      id: parseSemanticId("progress-indicator"),
      displayName: "Progress Indicator",
      category: SEMANTIC_CATEGORIES.feedback,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "circular",
          options: Object.freeze([
            Object.freeze({ value: "circular", label: "Circular" }),
            Object.freeze({ value: "linear", label: "Linear" }),
          ]),
        }),
        Object.freeze({
          id: "indeterminate",
          control: CONTROL_TYPES.toggle,
          label: "Indeterminate",
          defaultValue: true,
        }),
      ]),
    }),
    tooltip: Object.freeze({
      id: parseSemanticId("tooltip"),
      displayName: "Tooltip",
      category: SEMANTIC_CATEGORIES.feedback,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "variant",
          control: CONTROL_TYPES.select,
          label: "Variant",
          defaultValue: "plain",
          options: Object.freeze([
            Object.freeze({ value: "plain", label: "Plain" }),
            Object.freeze({ value: "rich", label: "Rich" }),
          ]),
        }),
      ]),
    }),
  });
