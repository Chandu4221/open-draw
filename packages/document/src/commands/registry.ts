// Closed registry of named commands (R-011/R-012, ADR-0002 D8). Members live
// in uniform folders next to this file; this file is the registry index.
export const COMMANDS = {
  createShape: "CreateShape",
  deleteShape: "DeleteShape",
  setShapeLabel: "SetShapeLabel",
  reparentShape: "ReparentShape",
} as const;

export type CommandId = (typeof COMMANDS)[keyof typeof COMMANDS];
