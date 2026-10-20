# Technical Decisions (ADRs)

## ADR-001: Monorepo Architecture with NPM Workspaces
- **Status**: Accepted
- **Context**: Need a unified codebase for multiple related libraries and an application shell without heavy third-party tooling.
- **Decision**: Use native npm workspaces with patterns `["packages/*", "apps/*"]`.
- **Consequences**: Standard npm tooling, zero external monorepo dependencies (no turbo/lerna required for basic scaffolding).

## ADR-002: Strict Zero-Dependency Rule for Core Packages
- **Status**: Accepted
- **Context**: Core libraries must remain ultra-lightweight and embeddable anywhere.
- **Decision**: Keep runtime `dependencies: {}` empty across `@open-draw/canvas`, `@open-draw/semantics`, and `@open-draw/markdown`.

## ADR-003: Modern GitHub Actions (v7) & Automated NPM Publishing
- **Status**: Accepted
- **Context**: Actions v4 runtime (Node 20) is deprecated on GitHub Actions runners.
- **Decision**: Use `actions/checkout@v7` and `actions/setup-node@v7` on Node 22+ with NPM Granular/Automation token secret (`NPM_TOKEN`).
