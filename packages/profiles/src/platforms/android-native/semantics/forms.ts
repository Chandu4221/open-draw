import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const ANDROID_FORMS_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  "text-field": Object.freeze({
    id: parseSemanticId("text-field"),
    displayName: "Outlined Text Field",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "outlined",
        options: Object.freeze([
          Object.freeze({ value: "outlined", label: "Outlined" }),
          Object.freeze({ value: "filled", label: "Filled" }),
        ]),
      }),
      Object.freeze({
        id: "label",
        control: CONTROL_TYPES.text,
        label: "Label",
        defaultValue: "Label",
      }),
      Object.freeze({
        id: "supportingText",
        control: CONTROL_TYPES.text,
        label: "Supporting Text",
        defaultValue: "",
      }),
    ]),
  }),
  checkbox: Object.freeze({
    id: parseSemanticId("checkbox"),
    displayName: "Material Checkbox",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "checked",
        control: CONTROL_TYPES.toggle,
        label: "Checked",
        defaultValue: false,
      }),
    ]),
  }),
  "radio-button": Object.freeze({
    id: parseSemanticId("radio-button"),
    displayName: "Radio Button",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "selected",
        control: CONTROL_TYPES.toggle,
        label: "Selected",
        defaultValue: false,
      }),
    ]),
  }),
  switch: Object.freeze({
    id: parseSemanticId("switch"),
    displayName: "Switch Toggle",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "checked",
        control: CONTROL_TYPES.toggle,
        label: "Checked",
        defaultValue: false,
      }),
    ]),
  }),
  slider: Object.freeze({
    id: parseSemanticId("slider"),
    displayName: "Slider",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "continuous",
        options: Object.freeze([
          Object.freeze({ value: "continuous", label: "Continuous" }),
          Object.freeze({ value: "discrete", label: "Discrete" }),
        ]),
      }),
    ]),
  }),
  chip: Object.freeze({
    id: parseSemanticId("chip"),
    displayName: "Assist / Filter Chip",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "assist",
        options: Object.freeze([
          Object.freeze({ value: "assist", label: "Assist" }),
          Object.freeze({ value: "filter", label: "Filter" }),
          Object.freeze({ value: "input", label: "Input" }),
          Object.freeze({ value: "suggestion", label: "Suggestion" }),
        ]),
      }),
      Object.freeze({
        id: "selected",
        control: CONTROL_TYPES.toggle,
        label: "Selected",
        defaultValue: false,
      }),
    ]),
  }),
  menu: Object.freeze({
    id: parseSemanticId("menu"),
    displayName: "Menu",
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
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "single",
        options: Object.freeze([
          Object.freeze({ value: "single", label: "Single Date" }),
          Object.freeze({ value: "range", label: "Date Range" }),
        ]),
      }),
    ]),
  }),
  "time-picker": Object.freeze({
    id: parseSemanticId("time-picker"),
    displayName: "Time Picker",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "dial",
        options: Object.freeze([
          Object.freeze({ value: "dial", label: "Dial" }),
          Object.freeze({ value: "input", label: "Input" }),
        ]),
      }),
    ]),
  }),
});
