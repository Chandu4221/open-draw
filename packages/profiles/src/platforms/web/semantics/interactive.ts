import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const INTERACTIVE_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  button: Object.freeze({
    id: parseSemanticId("button"),
    displayName: "Button",
    category: SEMANTIC_CATEGORIES.interactive,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "primary",
        options: Object.freeze([
          Object.freeze({ value: "primary", label: "Primary" }),
          Object.freeze({ value: "secondary", label: "Secondary" }),
          Object.freeze({ value: "outline", label: "Outline" }),
          Object.freeze({ value: "ghost", label: "Ghost" }),
          Object.freeze({ value: "split", label: "Split" }),
        ]),
      }),
      Object.freeze({
        id: "disabled",
        control: CONTROL_TYPES.toggle,
        label: "Disabled",
        defaultValue: false,
      }),
    ]),
  }),
  "icon-button": Object.freeze({
    id: parseSemanticId("icon-button"),
    displayName: "Icon Button",
    category: SEMANTIC_CATEGORIES.interactive,
    scope: "component",
  }),
  fab: Object.freeze({
    id: parseSemanticId("fab"),
    displayName: "Floating Action Button",
    category: SEMANTIC_CATEGORIES.interactive,
    scope: "component",
  }),
  link: Object.freeze({
    id: parseSemanticId("link"),
    displayName: "Link",
    category: SEMANTIC_CATEGORIES.interactive,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "href",
        control: CONTROL_TYPES.text,
        label: "Href",
        defaultValue: "#",
      }),
    ]),
  }),
  dropdown: Object.freeze({
    id: parseSemanticId("dropdown"),
    displayName: "Dropdown Menu",
    category: SEMANTIC_CATEGORIES.interactive,
    scope: "component",
  }),
  "segmented-control": Object.freeze({
    id: parseSemanticId("segmented-control"),
    displayName: "Segmented Control",
    category: SEMANTIC_CATEGORIES.interactive,
    scope: "component",
  }),
});
