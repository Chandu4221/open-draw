# @open-draw/markdown

Pure annotated-scene → markdown specification compiler (Format v1.1).

## Format v1.1 Specification

OpenDraw specifications (`<!-- open-draw-spec:v1.1 -->`) are deterministically compiled from canvas scenes:

1. **Spec Integrity Rule (Regenerate, Never Hand-Edit):**
   The compiled markdown specification is a pure generated artifact. Never hand-edit tokens, bounds, or styles in the compiled spec. If changes are needed, update the canvas scene in OpenDraw Studio and recompile.

2. **Consumption Directives:**
   - `strict-fidelity` (default): Mandates exact implementation of specified elements without additive invention.
   - `creative-allowed`: Permits additive styling and layout extension within design direction tokens while strictly preserving element identities `f(id)`.

3. **Bounds Semantics:**
   Bounds in the Element Legend represent content sizes in scene coordinate space. Positions are spatial suggestions, not rigid layout mandates. Consuming code generators adapt them to target platform layout systems (flexbox, Compose, Flutter).

4. **Single Canonical Home per Attribute:**
   - **Screen Structure:** Pure hierarchy tree and text copy. No duplicate geometry or names.
   - **Element Legend:** Single canonical source of truth for exact pixel bounds, names, parents, and roles.

5. **Filtered Platform Mappings:**
   Component mapping tables emit only semantic types actually present in the canvas scene to prevent LLM component hallucination and token bloat.

6. **Responsive Behavior Projection:**
   Projects deterministic layout derivations from `@open-draw/semantics`'s `derive()` engine for target breakpoint profiles.

## License
MIT (inherits repo license)
