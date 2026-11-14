import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const FLUTTER_CONTENT_SEMANTICS: Readonly<Record<string, SemanticDefinition>> =
  Object.freeze({
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
            Object.freeze({ value: "1", label: "H1 / Display" }),
            Object.freeze({ value: "2", label: "H2 / Headline Large" }),
            Object.freeze({ value: "3", label: "H3 / Headline Medium" }),
            Object.freeze({ value: "4", label: "H4 / Title Large" }),
            Object.freeze({ value: "5", label: "H5 / Title Medium" }),
            Object.freeze({ value: "6", label: "H6 / Title Small" }),
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
            Object.freeze({ value: "label", label: "Label" }),
            Object.freeze({ value: "caption", label: "Caption" }),
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
          id: "alt",
          control: CONTROL_TYPES.text,
          label: "Alt Text",
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
          label: "Icon Name",
          defaultValue: "",
        }),
      ]),
    }),
    avatar: Object.freeze({
      id: parseSemanticId("avatar"),
      displayName: "CircleAvatar",
      category: SEMANTIC_CATEGORIES.content,
      scope: "component",
    }),
  });
