import type { SemanticDefinition } from "../../../semantic-contract";
import { IOS_FEEDBACK_SEMANTICS } from "./feedback.js";
import { IOS_FORMS_SEMANTICS } from "./forms.js";
import { IOS_INTERACTIVE_SEMANTICS } from "./interactive.js";
import { IOS_LAYOUT_SEMANTICS } from "./layout.js";
import { IOS_NAVIGATION_SEMANTICS } from "./navigation.js";

export {
  IOS_FEEDBACK_SEMANTICS,
  IOS_FORMS_SEMANTICS,
  IOS_INTERACTIVE_SEMANTICS,
  IOS_LAYOUT_SEMANTICS,
  IOS_NAVIGATION_SEMANTICS,
};

export const IOS_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  ...IOS_LAYOUT_SEMANTICS,
  ...IOS_NAVIGATION_SEMANTICS,
  ...IOS_INTERACTIVE_SEMANTICS,
  ...IOS_FORMS_SEMANTICS,
  ...IOS_FEEDBACK_SEMANTICS,
});
