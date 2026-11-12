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
  "lead-capture": Object.freeze({
    id: parseSemanticId("lead-capture"),
    displayName: "Lead Capture Form",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
  "auth-modal": Object.freeze({
    id: parseSemanticId("auth-modal"),
    displayName: "Auth Modal",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
  "auth-card": Object.freeze({
    id: parseSemanticId("auth-card"),
    displayName: "Auth Card",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
  "social-login": Object.freeze({
    id: parseSemanticId("social-login"),
    displayName: "Social Login Buttons",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
  "user-menu": Object.freeze({
    id: parseSemanticId("user-menu"),
    displayName: "User Account Menu",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
  "account-settings": Object.freeze({
    id: parseSemanticId("account-settings"),
    displayName: "Account Settings",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "section",
  }),
  "otp-input": Object.freeze({
    id: parseSemanticId("otp-input"),
    displayName: "OTP Input",
    category: SEMANTIC_CATEGORIES.auth,
    scope: "component",
  }),
});
