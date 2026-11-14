import type { SemanticDefinition } from "../../../semantic-contract";
import { FLUTTER_CONTENT_SEMANTICS } from "./content.js";
import { FLUTTER_FEEDBACK_SEMANTICS } from "./feedback.js";
import { FLUTTER_FORMS_SEMANTICS } from "./forms.js";
import { FLUTTER_INTERACTIVE_SEMANTICS } from "./interactive.js";
import { FLUTTER_LAYOUT_SEMANTICS } from "./layout.js";
import { FLUTTER_NAVIGATION_SEMANTICS } from "./navigation.js";

export {
  FLUTTER_CONTENT_SEMANTICS,
  FLUTTER_FEEDBACK_SEMANTICS,
  FLUTTER_FORMS_SEMANTICS,
  FLUTTER_INTERACTIVE_SEMANTICS,
  FLUTTER_LAYOUT_SEMANTICS,
  FLUTTER_NAVIGATION_SEMANTICS,
};

export const FLUTTER_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  ...FLUTTER_CONTENT_SEMANTICS,
  ...FLUTTER_LAYOUT_SEMANTICS,
  ...FLUTTER_NAVIGATION_SEMANTICS,
  ...FLUTTER_INTERACTIVE_SEMANTICS,
  ...FLUTTER_FORMS_SEMANTICS,
  ...FLUTTER_FEEDBACK_SEMANTICS,
});
