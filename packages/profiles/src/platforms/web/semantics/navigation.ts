import {
  CONTROL_TYPES,
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const NAVIGATION_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  navbar: Object.freeze({
    id: parseSemanticId("navbar"),
    displayName: "Navigation Bar",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "section",
    properties: Object.freeze([
      Object.freeze({
        id: "position",
        control: CONTROL_TYPES.select,
        label: "Position",
        defaultValue: "static",
        options: Object.freeze([
          Object.freeze({ value: "static", label: "Static" }),
          Object.freeze({ value: "fixed", label: "Fixed" }),
          Object.freeze({ value: "docked", label: "Docked" }),
        ]),
      }),
      Object.freeze({
        id: "sticky",
        control: CONTROL_TYPES.toggle,
        label: "Sticky",
        defaultValue: false,
      }),
    ]),
  }),
  "nav-menu": Object.freeze({
    id: parseSemanticId("nav-menu"),
    displayName: "Navigation Menu",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  "sidebar-nav": Object.freeze({
    id: parseSemanticId("sidebar-nav"),
    displayName: "Sidebar Navigation",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  "mobile-nav": Object.freeze({
    id: parseSemanticId("mobile-nav"),
    displayName: "Mobile Navigation",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  "hamburger-menu": Object.freeze({
    id: parseSemanticId("hamburger-menu"),
    displayName: "Hamburger Menu",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  tabs: Object.freeze({
    id: parseSemanticId("tabs"),
    displayName: "Tabs",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  breadcrumbs: Object.freeze({
    id: parseSemanticId("breadcrumbs"),
    displayName: "Breadcrumbs",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  pagination: Object.freeze({
    id: parseSemanticId("pagination"),
    displayName: "Pagination",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  stepper: Object.freeze({
    id: parseSemanticId("stepper"),
    displayName: "Stepper",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  "footer-nav": Object.freeze({
    id: parseSemanticId("footer-nav"),
    displayName: "Footer Navigation",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  "skip-link": Object.freeze({
    id: parseSemanticId("skip-link"),
    displayName: "Skip Link",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  "back-button": Object.freeze({
    id: parseSemanticId("back-button"),
    displayName: "Back Button",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
  "table-of-contents": Object.freeze({
    id: parseSemanticId("table-of-contents"),
    displayName: "Table of Contents",
    category: SEMANTIC_CATEGORIES.navigation,
    scope: "component",
  }),
});
