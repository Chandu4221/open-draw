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
        id: "variant",
        control: CONTROL_TYPES.select,
        label: "Variant",
        defaultValue: "standard",
        options: Object.freeze([
          Object.freeze({ value: "standard", label: "Standard" }),
          Object.freeze({ value: "menu", label: "Menu" }),
          Object.freeze({ value: "hamburger", label: "Hamburger" }),
          Object.freeze({ value: "mobile", label: "Mobile" }),
          Object.freeze({ value: "footer", label: "Footer" }),
        ]),
      }),
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
  "sidebar-nav": Object.freeze({
    id: parseSemanticId("sidebar-nav"),
    displayName: "Sidebar Navigation",
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
});
