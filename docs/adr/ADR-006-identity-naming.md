# ADR-006: Identity & Naming — Short Collision-Resistant IDs, Labels, and Chips

## Status
Accepted

## Context
In wireframing, diagramming, and spec generation pipelines, every visual shape needs an identifier so that users, inspectors, markdown documents, and AI agents can unambiguously refer to elements.

Common approaches have serious drawbacks:
- **UUIDs (`v4`):** Long, unreadable in UI chips, visually overwhelming in prompts and diffs, and waste token context.
- **Sequential integers (`shape-1`, `shape-2`):** Leak creation order, collide when merging independent scenes or pasting between documents, and cause confusion if elements are deleted.
- **Type-prefixed IDs (`btn-3`, `rect-1`):** Fragile when types change; retagging a button to a link or section invalidates the ID or makes it misleading.
- **User-editable IDs:** Invite duplicates, broken links in markdown/code, and fragile reference graphs.

## Decision
We decide that:

1. **Shape IDs:**
   - **Alphabet:** Lowercase letters `a–z` and digits `2–9`, excluding `0`, `1`, and all English vowels (`a`, `e`, `i`, `o`, `u`). This leaves a 29-character alphabet (`23456789bcdfghjklmnpqrstvwxyz`).
   - **Rationale for exclusions:** Excluding `0` and `1` prevents visual confusion with `o` and `l`. Excluding vowels completely prevents random generation of offensive or vulgar words.
   - **Length & Space:** 4 characters default ($29^4 = 707,281$ unique IDs).
   - **Generation:** Generated randomly at shape creation (deterministic seeded PRNG in unit tests). If a collision occurs within the active document, regenerate immediately.
   - **Density Expansion:** When active document shape count exceeds the density threshold ($> 10,000$ shapes), generator grows default length to 5 characters ($29^5 \approx 20.5\text{M}$ space).
   - **Immutability:** IDs are NEVER sequential, NEVER type-prefixed, and NEVER user-editable.
   - **Rejected Alternatives:** Type prefixes (`btn-3`), user-editable IDs, UUIDs, sequential integers.

2. **Shape Names:**
   - Names are optional, NON-unique human labels (e.g., `"Primary CTA"`, `"Hero Section"`).
   - Capped at 64 characters, trimmed of leading/trailing whitespace, no control characters.
   - Empty/whitespace-only string resolves to unnamed.
   - Display fallback: If unnamed, UI displays the shape type or semantic tag.
   - Renaming never touches or modifies the immutable shape ID.
   - Duplicate/Copy/Paste generates a new ID while preserving the name.

3. **Visual Chips:**
   - Display modes: `always | hover (DEFAULT) | off`.
   - Chips are strictly ephemeral view state (never persisted in scene snapshots or exported JSON).
   - Selection rule: Selecting any shape always reveals the chips of the selected shape and its immediate parent.
   - Label format: `#x7q <name|type>` (e.g., `#x7q Primary CTA` or `#x7q button`).
   - Visual truncation: Truncated to ~12 characters visually, revealing full text on hover.
   - Export chips: Decoupled from editor mode; independent option in `exportPNG`.

4. **Legend:**
   - Markdown compile-time option ONLY (Phase 4).
   - Auto-generated read-only projection of scene state at compile time (never hand-authored or directly edited).
   - No floating canvas legend panel—chips serve in place.
   - Legend + annotated screenshot together form the Export-for-AI specification story.

5. **ID Lifecycle & UI:**
   - IDs are surfaced read-only everywhere in user-facing UI (inspector, chips).
   - Read-only copyable affordance, never an editable text input.

6. **Implementation Location:**
   - The pure ID generator and validator live in `@open-draw/schema` as a zero-dependency utility so `@open-draw/canvas` can use it at creation time without violating package boundary fences.
   - Name validation is registered with the canvas store's metadata validator.

## Consequences
### Positive
- **Human & LLM Ergonomics:** Compact 4-character tokens like `#k7w2` fit cleanly into UI chips and LLM prompt context windows without wasting tokens.
- **Robustness:** Eliminates ID fragility across retags and eliminates collision risks during multi-document copy/paste.
- **Clean Separation:** Decouples persistent identity (ID) from descriptive semantics (name) and view presentation (chips).

### Negative / Trade-offs
- Random 4-character strings carry no semantic meaning on their own; semantic context is provided by names and semantic tags rather than encoded into the ID itself.
