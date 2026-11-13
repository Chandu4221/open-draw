// Canonical registry of root container roles (R-005, R-007, R-024, R-026).
export const ROOT_ROLES = {
  screen: "screen",
  component: "component",
} as const;

export type RootRole = keyof typeof ROOT_ROLES;

export const ROOT_ROLE_BY_VALUE = {
  screen: ROOT_ROLES.screen,
  component: ROOT_ROLES.component,
} as const;

export function isRootRole(value: unknown): value is RootRole {
  return typeof value === "string" && value in ROOT_ROLES;
}
