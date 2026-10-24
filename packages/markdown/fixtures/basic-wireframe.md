# OpenDraw Specification

<!-- open-draw-spec:v1.1 -->

> **Consumption Directive: strict-fidelity**
> Build EXACTLY the elements specified. Do not add, remove, or restyle beyond the Design Direction. Do not invent unspecified content.

> **Scope: component** — This spec describes a standalone component, not a page.
> Deliver only the component itself. No page chrome, no header/navigation,
> no document-level styling beyond this component's tokens.

> **Bounds semantics:** Bounds are content-size in scene coordinate space. Absolute positions are spatial suggestions, not layout mandates; consuming agents adapt to target platform layout systems.

## Screen Structure

- **[section]** f(k7w2)
  - **[heading]** f(m8q4) text: "Welcome to OpenDraw"
  - **[button]** f(p2r9) text: "Get Started"
- **[section]** f(v3x5)

## Responsive Behavior

### Breakpoint: Mobile (< 768px) (580px)

- **[section]** f(k7w2) reflows (580×600 at 0,0)
- **[section]** f(v3x5) reflows (580×120 at 0,650)
