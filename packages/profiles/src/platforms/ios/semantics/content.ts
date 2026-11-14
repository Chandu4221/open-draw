import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const IOS_CONTENT_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  heading: Object.freeze({
    id: parseSemanticId("heading"),
    displayName: "Heading",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "level",
        control: CONTROL_TYPES.select,
        label: "Level",
        defaultValue: "1",
        options: Object.freeze([
          Object.freeze({ value: "1", label: "H1 / Large Title" }),
          Object.freeze({ value: "2", label: "H2 / Title 1" }),
          Object.freeze({ value: "3", label: "H3 / Title 2" }),
          Object.freeze({ value: "4", label: "H4 / Title 3" }),
          Object.freeze({ value: "5", label: "H5 / Headline" }),
          Object.freeze({ value: "6", label: "H6 / Subheadline" }),
        ]),
      }),
    ]),
  }),
  text: Object.freeze({
    id: parseSemanticId("text"),
    displayName: "Text",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "body",
        options: Object.freeze([
          Object.freeze({ value: "body", label: "Body" }),
          Object.freeze({ value: "callout", label: "Callout" }),
          Object.freeze({ value: "caption", label: "Caption" }),
          Object.freeze({ value: "footnote", label: "Footnote" }),
        ]),
      }),
    ]),
  }),
  image: Object.freeze({
    id: parseSemanticId("image"),
    displayName: "Image",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "accessibilityLabel",
        control: CONTROL_TYPES.text,
        label: "Accessibility Label",
        defaultValue: "",
      }),
    ]),
  }),
  icon: Object.freeze({
    id: parseSemanticId("icon"),
    displayName: "Icon",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "name",
        control: CONTROL_TYPES.text,
        label: "SF Symbol Name",
        defaultValue: "",
      }),
    ]),
  }),
  badge: Object.freeze({
    id: parseSemanticId("badge"),
    displayName: "Badge",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "value",
        control: CONTROL_TYPES.text,
        label: "Badge Value",
        defaultValue: "",
      }),
    ]),
  }),
});
