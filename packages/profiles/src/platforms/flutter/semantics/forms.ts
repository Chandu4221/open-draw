import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const FLUTTER_FORMS_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  "text-field": Object.freeze({
    id: parseSemanticId("text-field"),
    displayName: "TextField",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "obscureText",
        control: CONTROL_TYPES.toggle,
        label: "Obscure Text",
        defaultValue: false,
      }),
      Object.freeze({
        id: "decoration",
        control: CONTROL_TYPES.select,
        label: "Decoration",
        defaultValue: "outline",
        options: Object.freeze([
          Object.freeze({ value: "outline", label: "Outline" }),
          Object.freeze({ value: "underline", label: "Underline" }),
        ]),
      }),
    ]),
  }),
  checkbox: Object.freeze({
    id: parseSemanticId("checkbox"),
    displayName: "Checkbox",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "value",
        control: CONTROL_TYPES.toggle,
        label: "Checked",
        defaultValue: false,
      }),
    ]),
  }),
  switch: Object.freeze({
    id: parseSemanticId("switch"),
    displayName: "Switch",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "value",
        control: CONTROL_TYPES.toggle,
        label: "Value",
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
  radio: Object.freeze({
    id: parseSemanticId("radio"),
    displayName: "Radio",
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
  chip: Object.freeze({
    id: parseSemanticId("chip"),
    displayName: "Chip",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
  "dropdown-button": Object.freeze({
    id: parseSemanticId("dropdown-button"),
    displayName: "DropdownButton",
    category: SEMANTIC_CATEGORIES.forms,
    scope: "component",
  }),
});
