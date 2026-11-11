import type { SemanticDefinition } from "@open-draw/contracts";
import { ANDROID_FEEDBACK_SEMANTICS } from "./feedback.js";
import { ANDROID_FORMS_SEMANTICS } from "./forms.js";
import { ANDROID_INTERACTIVE_SEMANTICS } from "./interactive.js";
import { ANDROID_LAYOUT_SEMANTICS } from "./layout.js";
import { ANDROID_NAVIGATION_SEMANTICS } from "./navigation.js";

export {
  ANDROID_FEEDBACK_SEMANTICS,
  ANDROID_FORMS_SEMANTICS,
  ANDROID_INTERACTIVE_SEMANTICS,
  ANDROID_LAYOUT_SEMANTICS,
  ANDROID_NAVIGATION_SEMANTICS,
};

export const ANDROID_NATIVE_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze(
  {
    ...ANDROID_LAYOUT_SEMANTICS,
    ...ANDROID_NAVIGATION_SEMANTICS,
    ...ANDROID_INTERACTIVE_SEMANTICS,
    ...ANDROID_FORMS_SEMANTICS,
    ...ANDROID_FEEDBACK_SEMANTICS,
  },
);
