# ADR-0009 — Cloudflare Pages Release Pipeline & Private Repository Support

- **Status:** Accepted
- **Date:** 2026-11-06
- **Supersedes:** amends ADR-0001 D4 and R-036 hosting target
- **Rules implemented:** R-034, R-036

## Context

OpenDraw's core architecture ships two products: the public visual canvas engine (`@open-draw/canvas`) and the proprietary web application (`apps/studio`). While `@open-draw/canvas` is publicly distributed on npm (ADR-0008), the monorepo source code containing proprietary semantics, platform profiles, export prompt compilers, and Studio UI must remain closed and private to protect core product differentiation.

Previously (ADR-0001 D4, R-036), production builds of Studio and Playground were published to GitHub Pages. On GitHub Free, however, GitHub Pages is disabled for private repositories. To make the GitHub repository private while maintaining zero-cost, high-performance static hosting for Studio, a dedicated edge-hosting architecture is required.

## Decision

### D1 — Cloudflare Pages hosting for production releases

- Production deployment of Studio migrates from GitHub Pages to **Cloudflare Pages**.
- Cloudflare Pages provides free-tier hosting from private GitHub repositories, automated global edge distribution, free managed SSL, and custom domain mapping.
- The project domain serves Studio at root (`https://open-draw.pages.dev/`). Playground is strictly an internal local/pre-prod development environment run via `pnpm dev` and is never deployed or exposed to end users.

### D2 — Release gate preserved (R-034, R-036)

- Deployments continue to be strictly tag-gated. Only git tags matching `v*.*.*` that point directly to verified commits on `main` trigger deployment (**R-034**, **R-036**).
- Development builds and unmerged feature branches are never automatically deployed to production.
- Deployment is executed via GitHub Actions using the official `cloudflare/pages-action@1` direct-upload action with repository secrets (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`), avoiding package manager dependencies on the runner.

### D3 — Vite root base path configuration

- Studio builds with `--base=/` instead of the previous GitHub Pages subpath `--base=/open-draw/`.
- `apps/studio/dist` is directly deployed as the Cloudflare Pages root directory. Playground is excluded from production builds.

## Consequences

- The GitHub repository can be converted to **Private** immediately without interrupting public access to OpenDraw Studio.
- Proprietary packages (`semantics`, `profiles`, `export-markdown`, `ui`) remain completely closed and private in GitHub.
- `@open-draw/canvas` remains independently accessible on public npm.
- Build runners and deployment steps are standardized on `ubuntu-24.04`.
