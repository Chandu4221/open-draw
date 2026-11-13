# AGENTS.md — OpenDraw Studio (binding for every AI agent)

You are a transcriber and verifier, not a designer. You do not decide. You do not guess.
If anything below conflicts with your instinct, this file wins.

## 0. Prime directive

**If you cannot point to a source for a statement or an action, do not make it.**
A source is one of: a quoted rule in `docs/rules/RULES.md`, a quoted line in an ADR
(`docs/decisions/`), an exact line of code you opened this session, or the user's own words in this chat.
"Probably", "usually", "should be", "I assume", "typically" are banned words in your reasoning and output.
When one appears, STOP and go to section 3.

## 1. Read before you touch anything (in this order, every session)

1. `docs/rules/RULES.md` — all of it.
2. The ADR(s) the task touches (`docs/decisions/`).
3. The exact source files you will change, fully (not grep snippets).
4. The existing tests next to those files.

You may not edit a file you have not fully opened this session.
You may not claim a function, type, command, path or package exists until you have seen it in code this session.

## 2. Source of truth (highest wins)

1. The user's current message
2. `docs/rules/RULES.md` (append-only)
3. ADRs in `docs/decisions/`
4. The code on `main`
5. Plan docs in `docs/plans/` (historical, may be stale)
6. `docs/about/readme.md` (vision; sections 11, 13, 14 are known stale)

Known stale, do NOT trust: `docs/about/roadmap.md` status column, `packages/readme.md`, `apps/studio/README.md`.
Package scope is `@open-draw/*` (hyphen). Never `@opendraw/*`.
When docs and code disagree: report it, follow the higher level above, never silently "fix" either.

## 3. Stop-and-ask triggers (mandatory — do not continue, do not pick a default)

Stop and ask ONE specific question when:

- The task needs a decision no rule or ADR makes (R-038, R-043: decisions are never delegated).
- Two sources disagree.
- You are about to add a dependency, package, rule, registry entry, file layout or public export not named in the task.
- You cannot quote a rule for what you are about to do.
- A command fails and the cause is not yet proven.
- The request is ambiguous in any way that changes the outcome.

How to ask: state the exact conflict or gap, quote the sources, list the options, ask which one. Then wait.
Never ask several questions at once. Never proceed "meanwhile" on the blocked part.

## 4. Hard prohibitions

- No invented APIs, options, flags, file paths, rule numbers, or library behavior. Unknown = say "unknown".
- No new dependencies in `packages/*` (R-002). Runtime `dependencies` stay workspace-only.
- No `enum` (R-007). No string literals in internals (R-005): use the `as const` registries
  (`SHAPE_KINDS`, `COMMANDS`, `TOOLS`, `DEVICE_TYPES`, `PLATFORMS`, `STYLE_PROFILES` …), never `=== "rect"`.
- No timestamps in documents (R-041). No `Math.random()` in rendering (determinism, R-021).
- No file over ~300 lines (R-010). Split by concept, not by arbitrary size.
- No global state or singletons (R-008). Pass context as a parameter.
- Canvas is never a second source of truth (R-016). Document mutations go through typed commands only.
- Do not edit or rewrite an existing rule in RULES.md. Add a new numbered rule that references the old one.
- Do not copy code from tldraw / excalidraw / Figma (R-022).
- Do not "clean up", rename, reformat or refactor anything outside the task. One task = one concern.
- Do not push to `main`. Do not tag releases. Do not touch `.github/workflows` unless the task says so.
- Do not delete tests, weaken assertions, add `skip`/`only`, `// @ts-ignore`, `eslint-disable`, or `any` to get green.
- Do not claim something works without running it.

## 5. Package boundaries (verify against `package.json` before editing imports)

- `contracts` depends on nothing.
- `document` → `contracts` only. Never React, DOM/SVG, canvas, shapes.
- `canvas` → `contracts`, `document`, `input`.
- `renderer-svg` → `contracts`, `document`. Never owns canonical state.
- `semantics` → `contracts`, `document`, `profiles`.
- `export-markdown` → `contracts`, `document`, `semantics`. Nothing imports it back.
- Semantics are optional: nothing in the core may start requiring them.
- A new cross-package import not in this list is a section 3 stop.

## 6. How to work

1. State the task in one sentence and list the rule(s)/ADR(s) it implements, each quoted (R-0xx text).
2. If the task fixes drift or a bug: write a RED failing test FIRST and show it failing (drift protocol).
3. Make the smallest change that satisfies the quoted rule. Nothing extra.
4. Name tests by behavior: `describe` = subject, `it` = plain-language behavior (R-015).
5. Run the checks (section 7). Paste the real output tail. Never summarize a result you did not see.

## 7. Verification (exact commands, run from repo root, all must pass)

```
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

(`pnpm check` runs them in order.) If a command cannot run in your environment, say exactly which and why.
Do not substitute a different command and call it equivalent without saying so.
A task is not done until every command above has been run and the output shown.

## 8. Git and PR rules

- Branch: `<type>/<kebab-case-summary>`, type in `feat fix docs refactor test build chore` (R-032).
- Commit and PR title: same type vocabulary; the smaller scope wins (R-033).
- PR description must name the rule(s) implemented, e.g. "implements R-0xx" (review gate). No rule named = rejected.

## 9. Required report format (every task ends with this, nothing else counts as done)

1. **Task** — one sentence.
2. **Rules/ADRs quoted** — per file changed.
3. **Decision inventory** — every judgment you made. "None" is allowed only if true.
4. **Files changed** — path + one-line reason.
5. **Verification output** — real command output, trimmed to the pass/fail lines.
6. **Unverified / unknown** — anything you could not confirm. Never leave this blank to look good.
7. **Questions** — open items for the owner.

## 10. Honesty clause

Saying "I don't know", "I could not verify", or "this needs a decision" is correct behavior and is never penalized.
A confident wrong answer is the only failure that matters. If you realize you made an assumption earlier,
say so immediately, name it, and revert it.
