# Kitchen Sink Specification

<!-- open-draw-spec:v1.1 -->

> **Consumption Directive: strict-fidelity**
> Build EXACTLY the elements specified. Do not add, remove, or restyle beyond the Design Direction. Do not invent unspecified content.

> **Scope: page** — this scene contains a `page`-typed root; build a complete page.

> **Bounds semantics:** Bounds are content-size in scene coordinate space. Absolute positions are spatial suggestions, not layout mandates; consuming agents adapt to target platform layout systems.

## Screen Structure

- **[page]** f(pg1)
  - **[section]** f(sec1)
    - **[card]** f(card1)
      - **[input]** f(inp1) text: "Search users..."
      - **[badge]** f(badge1) text: "Active"
      - **[divider]** f(div1)
    - **[list]** f(list1)
    - **[table]** f(tbl1)
  - **[footer]** f(foot1)

## Responsive Behavior

### Breakpoint: Mobile (< 768px) (580px)

- **[page]** f(pg1) reflows (580×900 at 0,0)

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
| `badge` | `<span />` | — | `status` | Inline status tag or pill badge |
| `card` | `<article />` | `column` | `article` | Surface with border and padding |
| `divider` | `<hr />` | — | `separator` | Thematic break horizontal rule or divider |
| `footer` | `<footer />` | `row` | `contentinfo` | Semantic footer landmark |
| `input` | `<input />` | — | `textbox` | Text/number input field with label and placeholder |
| `list` | `<ul />` | `column` | `list` | Unordered list element with li children |
| `page` | `<main />` | `flex` | `region` | Top-level semantic container |
| `section` | `<section />` | `column` | `region` | Vertical layout landmark |
| `table` | `<table />` | `column` | `table` | Semantic table element with thead and tbody |

## Element Legend

| ID | Type | Name | Parent | Bounds |
| :--- | :--- | :--- | :--- | :--- |
| f(badge1) | `badge` | `Status Badge` | f(card1) | 80×24 at 60,120 |
| f(card1) | `card` | `User Profile` | f(sec1) | 400×300 at 40,40 |
| f(div1) | `divider` | `Separator` | f(card1) | 360×2 at 60,160 |
| f(foot1) | `footer` | `App Footer` | f(pg1) | 1400×80 at 20,800 |
| f(inp1) | `input` | `Search Field` | f(card1) | 300×40 at 60,60 |
| f(list1) | `list` | `Activity Feed` | f(sec1) | 400×300 at 460,40 |
| f(pg1) | `page` | `Dashboard` | — | 1440×900 at 0,0 |
| f(sec1) | `section` | `Content Area` | f(pg1) | 1400×750 at 20,20 |
| f(tbl1) | `table` | `Analytics Table` | f(sec1) | 500×300 at 880,40 |
