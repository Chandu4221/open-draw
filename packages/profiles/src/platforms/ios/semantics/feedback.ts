import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const IOS_FEEDBACK_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  alert: Object.freeze({
    id: parseSemanticId("alert"),
    displayName: "Alert Dialog",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "section",
  }),
  "action-sheet": Object.freeze({
    id: parseSemanticId("action-sheet"),
    displayName: "Action Sheet",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "section",
  }),
  "progress-indicator": Object.freeze({
    id: parseSemanticId("progress-indicator"),
    displayName: "Activity Indicator",
    category: SEMANTIC_CATEGORIES.feedback,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "style",
        control: CONTROL_TYPES.select,
        label: "Style",
        defaultValue: "medium",
        options: Object.freeze([
          Object.freeze({ value: "medium", label: "Medium" }),
          Object.freeze({ value: "large", label: "Large" }),
        ]),
      }),
    ]),
  }),
});
