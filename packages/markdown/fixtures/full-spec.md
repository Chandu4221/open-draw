# OpenDraw Specification

<!-- open-draw-spec:v1 -->

## Screen Structure

- **[section]** f(k7w2) "Hero Section" (1200×600 at 0,0)
  - **[heading]** f(m8q4) "Hero Title" (400×60 at 100,50) text: "Welcome to OpenDraw"
  - **[button]** f(p2r9) "Primary CTA" (160×44 at 100,150) text: "Get Started"
- **[section]** f(v3x5) "Footer" (1200×120 at 0,650)

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
| `annotation` | `<aside />` | — | `note` | Accessible secondary note |
| `button` | `<button />` | — | `button` | Interactive action element |
| `card` | `<article />` | `column` | `article` | Surface with border and padding |
| `column` | `<div />` | `column` | `group` | Flex child with width fractions |
| `heading` | `<h2 />` | — | `heading` | Semantic heading element |
| `image` | `<img />` | — | `img` | Image with mandatory alt attribute |
| `nav` | `<nav />` | `row` | `navigation` | Accessible landmark header |
| `page` | `<main />` | `flex` | `region` | Top-level semantic container |
| `section` | `<section />` | `column` | `region` | Vertical layout landmark |
| `text` | `<p />` | — | `paragraph` | Standard typography paragraph |

## Element Legend

| ID | Type | Name | Parent | Bounds |
| :--- | :--- | :--- | :--- | :--- |
| f(k7w2) | `section` | `Hero Section` | — | 1200×600 at 0,0 |
| f(m8q4) | `heading` | `Hero Title` | f(k7w2) | 400×60 at 100,50 |
| f(p2r9) | `button` | `Primary CTA` | f(k7w2) | 160×44 at 100,150 |
| f(v3x5) | `section` | `Footer` | — | 1200×120 at 0,650 |
