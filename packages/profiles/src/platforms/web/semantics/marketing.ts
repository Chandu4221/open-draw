import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const MARKETING_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  hero: Object.freeze({
    id: parseSemanticId("hero"),
    displayName: "Hero Section",
    category: SEMANTIC_CATEGORIES.marketing,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "standard",
        options: Object.freeze([
          Object.freeze({ value: "standard", label: "Standard" }),
          Object.freeze({ value: "banner", label: "Banner" }),
          Object.freeze({ value: "statement", label: "Statement" }),
          Object.freeze({ value: "split", label: "Split" }),
          Object.freeze({ value: "immersive", label: "Immersive" }),
        ]),
      }),
    ]),
  }),
  testimonials: Object.freeze({
    id: parseSemanticId("testimonials"),
    displayName: "Testimonials",
    category: SEMANTIC_CATEGORIES.marketing,
    scope: "section",
  }),
  features: Object.freeze({
    id: parseSemanticId("features"),
    displayName: "Features Section",
    category: SEMANTIC_CATEGORIES.marketing,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "layout",
        control: CONTROL_TYPES.select,
        label: "Layout",
        defaultValue: "grid",
        options: Object.freeze([
          Object.freeze({ value: "grid", label: "Grid" }),
          Object.freeze({ value: "list", label: "List" }),
          Object.freeze({ value: "benefits", label: "Benefits" }),
        ]),
      }),
    ]),
  }),
  cta: Object.freeze({
    id: parseSemanticId("cta"),
    displayName: "Call to Action",
    category: SEMANTIC_CATEGORIES.marketing,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "standard",
        options: Object.freeze([
          Object.freeze({ value: "standard", label: "Standard" }),
          Object.freeze({ value: "banner", label: "Banner" }),
        ]),
      }),
    ]),
  }),
  pricing: Object.freeze({
    id: parseSemanticId("pricing"),
    displayName: "Pricing Section",
    category: SEMANTIC_CATEGORIES.marketing,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "layout",
        control: CONTROL_TYPES.select,
        label: "Layout",
        defaultValue: "cards",
        options: Object.freeze([
          Object.freeze({ value: "cards", label: "Cards" }),
          Object.freeze({ value: "table", label: "Table" }),
        ]),
      }),
    ]),
  }),
  faq: Object.freeze({
    id: parseSemanticId("faq"),
    displayName: "FAQ Section",
    category: SEMANTIC_CATEGORIES.marketing,
    scope: "section",
  }),
  newsletter: Object.freeze({
    id: parseSemanticId("newsletter"),
    displayName: "Newsletter Signup",
    category: SEMANTIC_CATEGORIES.marketing,
    scope: "section",
  }),
});
