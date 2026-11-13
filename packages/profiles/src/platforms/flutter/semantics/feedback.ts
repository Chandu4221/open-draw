import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const FLUTTER_FEEDBACK_SEMANTICS: Readonly<Record<string, SemanticDefinition>> =
  Object.freeze({
    dialog: Object.freeze({
      id: parseSemanticId("dialog"),
      displayName: "AlertDialog",
      category: SEMANTIC_CATEGORIES.feedback,
      scope: "section",
    }),
    "snack-bar": Object.freeze({
      id: parseSemanticId("snack-bar"),
      displayName: "SnackBar",
      category: SEMANTIC_CATEGORIES.feedback,
      scope: "component",
    }),
    badge: Object.freeze({
      id: parseSemanticId("badge"),
      displayName: "Badge",
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
      displayName: "ProgressIndicator",
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
      ]),
    }),
    tooltip: Object.freeze({
      id: parseSemanticId("tooltip"),
      displayName: "Tooltip",
      category: SEMANTIC_CATEGORIES.feedback,
      scope: "component",
      properties: Object.freeze([
        Object.freeze({
          id: "message",
          control: CONTROL_TYPES.text,
          label: "Message",
          defaultValue: "",
        }),
      ]),
    }),
  });
