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

## Design Direction

- **Target Platform:** `web`
- **Visual Style:** `neubrutalism`

### Style Tokens

| Category | Token | Value |
| :--- | :--- | :--- |
| Palette | `background` | `#fffbeb` |
| Palette | `border` | `#000000` |
| Palette | `mutedText` | `#4b5563` |
| Palette | `primary` | `#fde047` |
| Palette | `surface` | `#ffffff` |
| Palette | `text` | `#000000` |
| Borders | `width` | `3px` |
| Borders | `radius` | `0px` |
| Borders | `style` | `solid` |
| Shadows | `offset` | `4px 4px` |
| Shadows | `blur` | `0px` |
| Shadows | `color` | `#000000` |
| Typography | `headingFont` | `'Space Grotesk', sans-serif` |
| Typography | `bodyFont` | `'Inter', sans-serif` |
| Typography | `baseSize` | `16px` |

### Platform Component Mappings

| Semantic Type | Platform Component | Container | Default Role | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `button` | `<button />` | — | `button` | Interactive action element |
| `heading` | `<h2 />` | — | `heading` | Semantic heading element (h1-h6 based on hierarchy level) |
| `section` | `<section />` | `column` | `region` | Vertical layout landmark |

## Element Legend

| ID | Type | Name | Parent | Bounds |
| :--- | :--- | :--- | :--- | :--- |
| f(k7w2) | `section` | `Hero Section` | — | 1200×600 at 0,0 |
| f(m8q4) | `heading` | `Hero Title` | f(k7w2) | 400×60 at 100,50 |
| f(p2r9) | `button` | `Primary CTA` | f(k7w2) | 160×44 at 100,150 |
| f(v3x5) | `section` | `Footer` | — | 1200×120 at 0,650 |
