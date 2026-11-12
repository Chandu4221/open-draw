import type { SemanticDefinition } from "@open-draw/contracts";
import { AUTH_SEMANTICS } from "./auth.js";
import { CONTENT_SEMANTICS } from "./content.js";
import { DATA_SEMANTICS } from "./data.js";
import { ECOMMERCE_SEMANTICS } from "./ecommerce.js";
import { FEEDBACK_SEMANTICS } from "./feedback.js";
import { FORMS_SEMANTICS } from "./forms.js";
import { INTERACTIVE_SEMANTICS } from "./interactive.js";
import { LAYOUT_SEMANTICS } from "./layout.js";
import { MARKETING_SEMANTICS } from "./marketing.js";
import { NAVIGATION_SEMANTICS } from "./navigation.js";

export {
  AUTH_SEMANTICS,
  CONTENT_SEMANTICS,
  DATA_SEMANTICS,
  ECOMMERCE_SEMANTICS,
  FEEDBACK_SEMANTICS,
  FORMS_SEMANTICS,
  INTERACTIVE_SEMANTICS,
  LAYOUT_SEMANTICS,
  MARKETING_SEMANTICS,
  NAVIGATION_SEMANTICS,
};

export const WEB_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  ...LAYOUT_SEMANTICS,
  ...NAVIGATION_SEMANTICS,
  ...MARKETING_SEMANTICS,
  ...ECOMMERCE_SEMANTICS,
  ...AUTH_SEMANTICS,
  ...INTERACTIVE_SEMANTICS,
  ...FORMS_SEMANTICS,
  ...DATA_SEMANTICS,
  ...CONTENT_SEMANTICS,
  ...FEEDBACK_SEMANTICS,
});
