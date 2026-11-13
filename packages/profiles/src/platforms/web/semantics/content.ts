import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const CONTENT_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
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
          Object.freeze({ value: "1", label: "H1" }),
          Object.freeze({ value: "2", label: "H2" }),
          Object.freeze({ value: "3", label: "H3" }),
          Object.freeze({ value: "4", label: "H4" }),
          Object.freeze({ value: "5", label: "H5" }),
          Object.freeze({ value: "6", label: "H6" }),
        ]),
      }),
    ]),
  }),
  card: Object.freeze({
    id: parseSemanticId("card"),
    displayName: "Card",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "elevation",
        control: CONTROL_TYPES.select,
        label: "Elevation",
        defaultValue: "none",
        options: Object.freeze([
          Object.freeze({ value: "none", label: "Flat" }),
          Object.freeze({ value: "low", label: "Low" }),
          Object.freeze({ value: "high", label: "High" }),
        ]),
      }),
      Object.freeze({
        id: "bordered",
        control: CONTROL_TYPES.toggle,
        label: "Bordered",
        defaultValue: true,
      }),
    ]),
  }),
  list: Object.freeze({
    id: parseSemanticId("list"),
    displayName: "List",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
  }),
  "list-item": Object.freeze({
    id: parseSemanticId("list-item"),
    displayName: "List Item",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
  }),
  avatar: Object.freeze({
    id: parseSemanticId("avatar"),
    displayName: "Avatar",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
  }),
  badge: Object.freeze({
    id: parseSemanticId("badge"),
    displayName: "Badge",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "default",
        options: Object.freeze([
          Object.freeze({ value: "default", label: "Default" }),
          Object.freeze({ value: "success", label: "Success" }),
          Object.freeze({ value: "warning", label: "Warning" }),
          Object.freeze({ value: "error", label: "Error" }),
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
  video: Object.freeze({
    id: parseSemanticId("video"),
    displayName: "Video Player",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
  }),
  accordion: Object.freeze({
    id: parseSemanticId("accordion"),
    displayName: "Accordion",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
  }),
  carousel: Object.freeze({
    id: parseSemanticId("carousel"),
    displayName: "Carousel / Slider",
    category: SEMANTIC_CATEGORIES.content,
    scope: "component",
  }),
  article: Object.freeze({
    id: parseSemanticId("article"),
    displayName: "Article Content",
    category: SEMANTIC_CATEGORIES.content,
    scope: "section",
  }),
});
