/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Warn about circular dependencies",
      from: {
        pathNot: "^packages/document/src/commands/",
      },
      to: {
        circular: true,
      },
    },
    {
      name: "packages-cannot-import-apps",
      severity: "error",
      comment: "Packages in packages/ must never import from apps/",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "contracts-boundary",
      severity: "error",
      comment: "@open-draw/contracts must not depend on any other package",
      from: { path: "^packages/contracts/" },
      to: { path: "^packages/(?!contracts/)|^@open-draw/(?!contracts$)" },
    },
    {
      name: "document-boundary",
      severity: "error",
      comment: "@open-draw/document may only depend on @open-draw/contracts",
      from: { path: "^packages/document/" },
      to: { path: "^packages/(?!document/|contracts/)|^@open-draw/(?!contracts$)" },
    },
    {
      name: "shapes-boundary",
      severity: "error",
      comment: "@open-draw/shapes may only depend on @open-draw/contracts",
      from: { path: "^packages/shapes/" },
      to: { path: "^packages/(?!shapes/|contracts/)|^@open-draw/(?!contracts$)" },
    },
    {
      name: "profiles-boundary",
      severity: "error",
      comment: "@open-draw/profiles may only depend on @open-draw/contracts",
      from: { path: "^packages/profiles/" },
      to: { path: "^packages/(?!profiles/|contracts/)|^@open-draw/(?!contracts$)" },
    },
    {
      name: "input-boundary",
      severity: "error",
      comment: "@open-draw/input may only depend on @open-draw/contracts",
      from: { path: "^packages/input/" },
      to: { path: "^packages/(?!input/|contracts/)|^@open-draw/(?!contracts$)" },
    },
    {
      name: "semantics-boundary",
      severity: "error",
      comment: "@open-draw/semantics may only depend on contracts, document, profiles",
      from: { path: "^packages/semantics/" },
      to: {
        path: "^packages/(?!semantics/|contracts/|document/|profiles/)|^@open-draw/(?!contracts$|document$|profiles$)",
      },
    },
    {
      name: "renderer-svg-boundary",
      severity: "error",
      comment: "@open-draw/renderer-svg may only depend on contracts, document",
      from: { path: "^packages/renderer-svg/" },
      to: {
        path: "^packages/(?!renderer-svg/|contracts/|document/)|^@open-draw/(?!contracts$|document$)",
      },
    },
    {
      name: "export-markdown-boundary",
      severity: "error",
      comment: "@open-draw/export-markdown may only depend on contracts, document, semantics",
      from: { path: "^packages/export-markdown/" },
      to: {
        path: "^packages/(?!export-markdown/|contracts/|document/|semantics/)|^@open-draw/(?!contracts$|document$|semantics$)",
      },
    },
    {
      name: "canvas-boundary",
      severity: "error",
      comment:
        "@open-draw/canvas may only depend on contracts, document, input, shapes, renderer-svg (ADR-0008)",
      from: { path: "^packages/canvas/" },
      to: {
        path: "^packages/(?!canvas/|contracts/|document/|input/|shapes/|renderer-svg/)|^@open-draw/(?!contracts$|document$|input$|shapes$|renderer-svg$)",
      },
    },
    {
      name: "ui-boundary",
      severity: "error",
      comment: "@open-draw/ui must not depend on any other package",
      from: { path: "^packages/ui/" },
      to: { path: "^packages/(?!ui/)|^@open-draw/" },
    },
    {
      name: "only-apps-may-import-ui",
      severity: "error",
      comment: "Only apps/ may import from @open-draw/ui",
      from: { path: "^packages/(?!ui/)" },
      to: { path: "^packages/ui/|^@open-draw/ui" },
    },
    {
      name: "no-deep-cross-package-imports",
      severity: "error",
      comment: "Cross-package imports must use package entrypoint, not internal src/ paths",
      from: { path: "^packages/([^/]+)/" },
      to: {
        path: "^packages/(?!$1/)[^/]+/src/(?!index\\.(ts|js)$)",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.base.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
