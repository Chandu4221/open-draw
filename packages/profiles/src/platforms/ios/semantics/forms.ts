import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const IOS_FORMS_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  "text-field": Object.freeze({
    id: parseSemanticId("text-field"),
    displayName: "Text Field",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "placeholder",
        control: CONTROL_TYPES.text,
        label: "Placeholder",
        defaultValue: "",
      }),
      Object.freeze({
        id: "borderStyle",
        control: CONTROL_TYPES.select,
        label: "Border Style",
        defaultValue: "roundedRect",
        options: Object.freeze([
          Object.freeze({ value: "roundedRect", label: "Rounded Rect" }),
          Object.freeze({ value: "line", label: "Line" }),
          Object.freeze({ value: "none", label: "None" }),
        ]),
      }),
    ]),
  }),
  switch: Object.freeze({
    id: parseSemanticId("switch"),
    displayName: "Toggle Switch",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "on",
        control: CONTROL_TYPES.toggle,
        label: "On",
        defaultValue: false,
      }),
    ]),
  }),
  slider: Object.freeze({
    id: parseSemanticId("slider"),
    displayName: "Slider",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  stepper: Object.freeze({
    id: parseSemanticId("stepper"),
    displayName: "Stepper",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "date-picker": Object.freeze({
    id: parseSemanticId("date-picker"),
    displayName: "Date Picker",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "style",
        control: CONTROL_TYPES.select,
        label: "Style",
        defaultValue: "compact",
        options: Object.freeze([
          Object.freeze({ value: "compact", label: "Compact" }),
          Object.freeze({ value: "inline", label: "Inline" }),
          Object.freeze({ value: "wheels", label: "Wheels" }),
        ]),
      }),
    ]),
  }),
});
