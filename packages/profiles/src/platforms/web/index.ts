// Web Platform Profile (ADR-0004 D5, R-023).
import {
  type PlatformProfile,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const WEB_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  page: Object.freeze({
    id: parseSemanticId("page"),
    displayName: "Page",
  }),
  section: Object.freeze({
    id: parseSemanticId("section"),
    displayName: "Section",
  }),
  navbar: Object.freeze({
    id: parseSemanticId("navbar"),
    displayName: "Navigation Bar",
    properties: Object.freeze([
      Object.freeze({
        id: "sticky",
        control: "toggle",
        label: "Sticky",
        defaultValue: false,
      }),
    ]),
  }),
  footer: Object.freeze({
    id: parseSemanticId("footer"),
    displayName: "Footer",
  }),
  sidebar: Object.freeze({
    id: parseSemanticId("sidebar"),
    displayName: "Sidebar",
    properties: Object.freeze([
      Object.freeze({
        id: "collapsible",
        control: "toggle",
        label: "Collapsible",
        defaultValue: false,
      }),
    ]),
  }),
  card: Object.freeze({
    id: parseSemanticId("card"),
    displayName: "Card",
    properties: Object.freeze([
      Object.freeze({
        id: "elevation",
        control: "select",
        label: "Elevation",
        defaultValue: "none",
        options: Object.freeze([
          Object.freeze({ value: "none", label: "Flat" }),
          Object.freeze({ value: "low", label: "Low" }),
          Object.freeze({ value: "high", label: "High" }),
        ]),
      }),
    ]),
  }),
  button: Object.freeze({
    id: parseSemanticId("button"),
    displayName: "Button",
    properties: Object.freeze([
      Object.freeze({
        id: "variant",
        control: "select",
        label: "Variant",
        defaultValue: "primary",
        options: Object.freeze([
          Object.freeze({ value: "primary", label: "Primary" }),
          Object.freeze({ value: "secondary", label: "Secondary" }),
          Object.freeze({ value: "outline", label: "Outline" }),
          Object.freeze({ value: "ghost", label: "Ghost" }),
        ]),
      }),
      Object.freeze({
        id: "disabled",
        control: "toggle",
        label: "Disabled",
        defaultValue: false,
      }),
    ]),
  }),
  input: Object.freeze({
    id: parseSemanticId("input"),
    displayName: "Text Input",
    properties: Object.freeze([
      Object.freeze({
        id: "placeholder",
        control: "text",
        label: "Placeholder",
        defaultValue: "",
      }),
      Object.freeze({
        id: "required",
        control: "toggle",
        label: "Required",
        defaultValue: false,
      }),
    ]),
  }),
  heading: Object.freeze({
    id: parseSemanticId("heading"),
    displayName: "Heading",
    properties: Object.freeze([
      Object.freeze({
        id: "level",
        control: "select",
        label: "Level",
        defaultValue: "1",
        options: Object.freeze([
          Object.freeze({ value: "1", label: "H1" }),
          Object.freeze({ value: "2", label: "H2" }),
          Object.freeze({ value: "3", label: "H3" }),
        ]),
      }),
    ]),
  }),
  table: Object.freeze({
    id: parseSemanticId("table"),
    displayName: "Data Table",
    properties: Object.freeze([
      Object.freeze({
        id: "striped",
        control: "toggle",
        label: "Striped",
        defaultValue: false,
      }),
    ]),
  }),
});

export const WEB_PROFILE: PlatformProfile = Object.freeze({
  id: "web",
  label: "Web",
  rootSemantic: parseSemanticId("page"),
  deviceTypes: Object.freeze(["mobile", "tablet", "laptop", "desktop", "largeScreen"] as const),
  semantics: WEB_SEMANTICS,
});
