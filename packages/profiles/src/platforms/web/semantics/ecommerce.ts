import {
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

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
  "product-detail": Object.freeze({
    id: parseSemanticId("product-detail"),
    displayName: "Product Detail",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "section",
  }),
  cart: Object.freeze({
    id: parseSemanticId("cart"),
    displayName: "Shopping Cart",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "section",
  }),
  "cart-drawer": Object.freeze({
    id: parseSemanticId("cart-drawer"),
    displayName: "Cart Drawer",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "component",
  }),
  "mini-cart": Object.freeze({
    id: parseSemanticId("mini-cart"),
    displayName: "Mini Cart",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "component",
  }),
  checkout: Object.freeze({
    id: parseSemanticId("checkout"),
    displayName: "Checkout",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "section",
  }),
  "order-summary": Object.freeze({
    id: parseSemanticId("order-summary"),
    displayName: "Order Summary",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "component",
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
  "color-swatch-picker": Object.freeze({
    id: parseSemanticId("color-swatch-picker"),
    displayName: "Color Swatch Picker",
    category: SEMANTIC_CATEGORIES.ecommerce,
    scope: "component",
  }),
});
