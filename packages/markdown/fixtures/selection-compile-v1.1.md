# Selection Compile Spec

<!-- open-draw-spec:v1.1 -->

> **Consumption Directive: strict-fidelity**
> Build EXACTLY the elements specified. Do not add, remove, or restyle beyond the Design Direction. Do not invent unspecified content.

> **Scope: component** — This spec describes a standalone component, not a page.
> Deliver only the component itself. No page chrome, no header/navigation,
> no document-level styling beyond this component's tokens.

> **Bounds semantics:** Bounds are content-size in scene coordinate space. Absolute positions are spatial suggestions, not layout mandates; consuming agents adapt to target platform layout systems.

## Screen Structure

- **[section]** f(frame-a)
  - **[button]** f(child-a1) text: "Login"

## Responsive Behavior

### Breakpoint: Mobile (< 768px) (580px)

*Natural layout flow preserved — no element reflows required.*

## Element Legend

| ID | Type | Name | Parent | Bounds |
| :--- | :--- | :--- | :--- | :--- |
| f(child-a1) | `button` | `Login Button` | f(frame-a) | 100×40 at 10,10 |
| f(frame-a) | `section` | `Header Section` | — | 400×400 at 0,0 |
