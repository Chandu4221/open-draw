import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "../../../semantic-contract";

export const ECOMMERCE_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  "product-card": Object.freeze({
    id: parseSemanticId("product-card"),
    displayName: "Product Card",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "component",
  }),
  "product-grid": Object.freeze({
    id: parseSemanticId("product-grid"),
    displayName: "Product Grid",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "section",
  }),
  cart: Object.freeze({
    id: parseSemanticId("cart"),
    displayName: "Shopping Cart",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "presentation",
        control: CONTROL_TYPES.select,
        label: "Presentation",
        defaultValue: "page",
        options: Object.freeze([
          Object.freeze({ value: "page", label: "Page" }),
          Object.freeze({ value: "drawer", label: "Drawer" }),
          Object.freeze({ value: "modal", label: "Modal" }),
        ]),
      }),
    ]),
  }),
  checkout: Object.freeze({
    id: parseSemanticId("checkout"),
    displayName: "Checkout",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "section",
  }),
  "price-tag": Object.freeze({
    id: parseSemanticId("price-tag"),
    displayName: "Price Tag",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "component",
  }),
  rating: Object.freeze({
    id: parseSemanticId("rating"),
    displayName: "Rating Stars",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "component",
  }),
});
