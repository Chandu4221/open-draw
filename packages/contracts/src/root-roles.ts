// Closed registry: root shape roles (R-005, R-012, R-014, R-026).
// A root shape on canvas is by default a full application screen/page,
// an isolated reusable component (Card, Dialog, Navbar, Widget, etc.),
// or a Project Space grouping multiple screens/pages.
export const ROOT_ROLES = {
  project: "project",
  screen: "screen",
  component: "component",
} as const;

export type RootRole = keyof typeof ROOT_ROLES;

export const ROOT_ROLE_BY_VALUE: Readonly<Record<string, RootRole>> = Object.fromEntries(
  (Object.keys(ROOT_ROLES) as RootRole[]).map((role) => [ROOT_ROLES[role], role]),
);

export function isRootRole(value: unknown): value is RootRole {
  return typeof value === "string" && value in ROOT_ROLES;
}
