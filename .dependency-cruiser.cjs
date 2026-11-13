/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "Warn about circular dependencies",
      from: {},
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
      name: "profiles-boundary",
      severity: "error",
      comment: "@open-draw/profiles may only depend on @open-draw/canvas (external)",
      from: { path: "^packages/profiles/" },
      to: { path: "^packages/(?!profiles/)|^@open-draw/(?!canvas$)" },
    },
    {
      name: "semantics-boundary",
      severity: "error",
      comment: "@open-draw/semantics may only depend on @open-draw/canvas, profiles",
      from: { path: "^packages/semantics/" },
      to: {
        path: "^packages/(?!semantics/|profiles/)|^@open-draw/(?!canvas$|profiles$)",
      },
    },
    {
      name: "export-markdown-boundary",
      severity: "error",
      comment: "@open-draw/export-markdown may only depend on @open-draw/canvas, semantics",
      from: { path: "^packages/export-markdown/" },
      to: {
        path: "^packages/(?!export-markdown/|semantics/)|^@open-draw/(?!canvas$|semantics$)",
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
