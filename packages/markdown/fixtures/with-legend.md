# OpenDraw Specification

<!-- open-draw-spec:v1.1 -->

> **Consumption Directive: strict-fidelity**
> Build EXACTLY the elements specified. Do not add, remove, or restyle beyond the Design Direction. Do not invent unspecified content.

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

## Element Legend

| ID | Type | Name | Parent | Bounds |
| :--- | :--- | :--- | :--- | :--- |
| f(k7w2) | `section` | `Hero Section` | — | 1200×600 at 0,0 |
| f(m8q4) | `heading` | `Hero Title` | f(k7w2) | 400×60 at 100,50 |
| f(p2r9) | `button` | `Primary CTA` | f(k7w2) | 160×44 at 100,150 |
| f(v3x5) | `section` | `Footer` | — | 1200×120 at 0,650 |
