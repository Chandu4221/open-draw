import { CONTROL_TYPES, type SemanticDefinition, parseSemanticId } from "@open-draw/contracts";

export const WEB_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  section: Object.freeze({
    id: parseSemanticId("section"),
    displayName: "Section",
  }),
  navbar: Object.freeze({
    id: parseSemanticId("navbar"),
    displayName: "Navigation Bar",
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
        control: CONTROL_TYPES.toggle,
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
  button: Object.freeze({
    id: parseSemanticId("button"),
    displayName: "Button",
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
  input: Object.freeze({
    id: parseSemanticId("input"),
    displayName: "Text Input",
    properties: Object.freeze([
      Object.freeze({
        id: "placeholder",
        control: CONTROL_TYPES.text,
        label: "Placeholder",
        defaultValue: "",
      }),
      Object.freeze({
        id: "type",
        control: CONTROL_TYPES.select,
        label: "Input Type",
        defaultValue: "text",
        options: Object.freeze([
          Object.freeze({ value: "text", label: "Text" }),
          Object.freeze({ value: "email", label: "Email" }),
          Object.freeze({ value: "password", label: "Password" }),
          Object.freeze({ value: "number", label: "Number" }),
          Object.freeze({ value: "search", label: "Search" }),
        ]),
      }),
      Object.freeze({
        id: "required",
        control: CONTROL_TYPES.toggle,
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
  form: Object.freeze({
    id: parseSemanticId("form"),
    displayName: "Form Container",
    properties: Object.freeze([
      Object.freeze({
        id: "method",
        control: CONTROL_TYPES.select,
        label: "Method",
        defaultValue: "post",
        options: Object.freeze([
          Object.freeze({ value: "post", label: "POST" }),
          Object.freeze({ value: "get", label: "GET" }),
        ]),
      }),
    ]),
  }),
  modal: Object.freeze({
    id: parseSemanticId("modal"),
    displayName: "Modal Window",
    properties: Object.freeze([
      Object.freeze({
        id: "backdrop",
        control: CONTROL_TYPES.toggle,
        label: "Backdrop Overlay",
        defaultValue: true,
      }),
      Object.freeze({
        id: "dismissible",
        control: CONTROL_TYPES.toggle,
        label: "Dismissible",
        defaultValue: true,
      }),
    ]),
  }),
  table: Object.freeze({
    id: parseSemanticId("table"),
    displayName: "Data Table",
    properties: Object.freeze([
      Object.freeze({
        id: "striped",
        control: CONTROL_TYPES.toggle,
        label: "Striped",
        defaultValue: false,
      }),
      Object.freeze({
        id: "bordered",
        control: CONTROL_TYPES.toggle,
        label: "Bordered",
        defaultValue: true,
      }),
    ]),
  }),
  image: Object.freeze({
    id: parseSemanticId("image"),
    displayName: "Image",
    properties: Object.freeze([
      Object.freeze({
        id: "alt",
        control: CONTROL_TYPES.text,
        label: "Alt Text",
        defaultValue: "",
      }),
    ]),
  }),
  dialog: Object.freeze({
    id: parseSemanticId("dialog"),
    displayName: "Modal Dialog",
    properties: Object.freeze([
      Object.freeze({
        id: "dismissible",
        control: CONTROL_TYPES.toggle,
        label: "Dismissible",
        defaultValue: true,
      }),
    ]),
  }),
  dropdown: Object.freeze({
    id: parseSemanticId("dropdown"),
    displayName: "Dropdown Menu",
  }),
  checkbox: Object.freeze({
    id: parseSemanticId("checkbox"),
    displayName: "Checkbox",
    properties: Object.freeze([
      Object.freeze({
        id: "checked",
        control: CONTROL_TYPES.toggle,
        label: "Checked",
        defaultValue: false,
      }),
    ]),
  }),
  badge: Object.freeze({
    id: parseSemanticId("badge"),
    displayName: "Badge",
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
  tabs: Object.freeze({
    id: parseSemanticId("tabs"),
    displayName: "Tabs",
  }),
  avatar: Object.freeze({
    id: parseSemanticId("avatar"),
    displayName: "Avatar",
  }),
  link: Object.freeze({
    id: parseSemanticId("link"),
    displayName: "Link",
    properties: Object.freeze([
      Object.freeze({
        id: "href",
        control: CONTROL_TYPES.text,
        label: "Href",
        defaultValue: "#",
      }),
    ]),
  }),
});
