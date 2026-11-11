import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const FORMS_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  form: Object.freeze({
    id: parseSemanticId("form"),
    displayName: "Form Container",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "method",
        control: CONTROL_TYPES.select,
        label: "Method",
        defaultValue: "post",
        options: Object.freeze([
          Object.freeze({ value: "post", label: "POST" }),
          Object.freeze({ value: "get", label: "GET" }),
        ]),
      }),
    ]),
  }),
  input: Object.freeze({
    id: parseSemanticId("input"),
    displayName: "Text Input",
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
        id: "type",
        control: CONTROL_TYPES.select,
        label: "Input Type",
        defaultValue: "text",
        options: Object.freeze([
          Object.freeze({ value: "text", label: "Text" }),
          Object.freeze({ value: "email", label: "Email" }),
          Object.freeze({ value: "password", label: "Password" }),
          Object.freeze({ value: "number", label: "Number" }),
          Object.freeze({ value: "search", label: "Search" }),
        ]),
      }),
      Object.freeze({
        id: "required",
        control: CONTROL_TYPES.toggle,
        label: "Required",
        defaultValue: false,
      }),
    ]),
  }),
  "input-field": Object.freeze({
    id: parseSemanticId("input-field"),
    displayName: "Input Field with Label",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  textarea: Object.freeze({
    id: parseSemanticId("textarea"),
    displayName: "Textarea",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  select: Object.freeze({
    id: parseSemanticId("select"),
    displayName: "Select Picker",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  checkbox: Object.freeze({
    id: parseSemanticId("checkbox"),
    displayName: "Checkbox",
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
  "radio-group": Object.freeze({
    id: parseSemanticId("radio-group"),
    displayName: "Radio Group",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "toggle-switch": Object.freeze({
    id: parseSemanticId("toggle-switch"),
    displayName: "Toggle Switch",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  slider: Object.freeze({
    id: parseSemanticId("slider"),
    displayName: "Slider",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "range-slider": Object.freeze({
    id: parseSemanticId("range-slider"),
    displayName: "Range Slider",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "date-picker": Object.freeze({
    id: parseSemanticId("date-picker"),
    displayName: "Date Picker",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "file-upload": Object.freeze({
    id: parseSemanticId("file-upload"),
    displayName: "File Upload",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "search-bar": Object.freeze({
    id: parseSemanticId("search-bar"),
    displayName: "Search Bar",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  combobox: Object.freeze({
    id: parseSemanticId("combobox"),
    displayName: "Combobox",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "tag-input": Object.freeze({
    id: parseSemanticId("tag-input"),
    displayName: "Tag Input",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "color-picker": Object.freeze({
    id: parseSemanticId("color-picker"),
    displayName: "Color Picker",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
});
