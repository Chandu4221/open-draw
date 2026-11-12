import {
  SEMANTIC_CATEGORIES,
  type SemanticDefinition,
  parseSemanticId,
} from "@open-draw/contracts";

export const AUTH_SEMANTICS: Readonly<Record<string, SemanticDefinition>> = Object.freeze({
  "login-form": Object.freeze({
    id: parseSemanticId("login-form"),
    displayName: "Login Form",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
  "signup-form": Object.freeze({
    id: parseSemanticId("signup-form"),
    displayName: "Sign Up Form",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
  "user-menu": Object.freeze({
    id: parseSemanticId("user-menu"),
    displayName: "User Account Menu",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
  "otp-input": Object.freeze({
    id: parseSemanticId("otp-input"),
    displayName: "OTP Input",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
});
