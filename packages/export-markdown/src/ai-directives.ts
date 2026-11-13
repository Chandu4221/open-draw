// AI Prompt Directives Compiler (Milestone 11, Idea 3, 4, 6, R-026, R-040).
// Pure Document → directives string projection, zero side effects (R-008, R-016).
// Strict boundary compliance: depends only on contracts, document, semantics (R-020).
import { isRootId, ROOT_ID } from "@open-draw/canvas";
import type { Document, Shape } from "@open-draw/canvas";
import { type CreativityLevel, CREATIVITY_LEVEL_DEFINITIONS } from "./export-contract";
import {
  type ThemePalette,
  PLATFORMS,
  THEME_PALETTE_SLOTS,
  resolveRootDarkMode,
  resolveRootPlatform,
  resolveRootTheme,
} from "@open-draw/semantics";
import { escapeCodeSpan, escapeMarkdownText } from "./escape-markdown";
import type { MarkdownExportOptions } from "./types";

function normalizeHex(hex: string): string {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    return clean
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase();
  }
  return clean.toUpperCase();
}

function formatTokensForWeb(theme: ThemePalette): string[] {
  const lines: string[] = ["```css", ":root {"];
  for (const slot of THEME_PALETTE_SLOTS) {
    const val = theme[slot];
    if (val !== undefined && val !== "") {
      lines.push(`  --color-${slot}: ${escapeCodeSpan(val)};`);
    }
  }
  lines.push("}", "```");
  return lines;
}

function formatTokensForAndroid(theme: ThemePalette): string[] {
  const lines: string[] = ["```kotlin", "val LightColorScheme = lightColorScheme("];
  for (const slot of THEME_PALETTE_SLOTS) {
    const val = theme[slot];
    if (val !== undefined && val !== "") {
      const hex = normalizeHex(val);
      lines.push(`    ${slot} = Color(0xFF${hex}),`);
    }
  }
  lines.push(")", "```");
  return lines;
}

function formatTokensForFlutter(theme: ThemePalette): string[] {
  const lines: string[] = ["```dart", "const colorScheme = ColorScheme.light("];
  for (const slot of THEME_PALETTE_SLOTS) {
    const val = theme[slot];
    if (val !== undefined && val !== "") {
      const hex = normalizeHex(val);
      lines.push(`  ${slot}: Color(0xFF${hex}),`);
    }
  }
  lines.push(");", "```");
  return lines;
}

function formatTokensForIos(theme: ThemePalette): string[] {
  const lines: string[] = ["```swift", "struct AppColors {"];
  for (const slot of THEME_PALETTE_SLOTS) {
    const val = theme[slot];
    if (val !== undefined && val !== "") {
      lines.push(`    static let ${slot} = Color(hex: "${escapeCodeSpan(val)}")`);
    }
  }
  lines.push("}", "```");
  return lines;
}

/**
 * Compiles AI prompt directives including WCAG contrast compliance,
 * dark mode switching, root theme tokens, and stack guidance.
 */
export function compileAiDirectives(doc: Document, options?: MarkdownExportOptions): string[] {
  const lines: string[] = [];

  // 1. Creativity Level
  if (options?.creativityLevel !== undefined) {
    const def = CREATIVITY_LEVEL_DEFINITIONS[options.creativityLevel as CreativityLevel];
    if (def) {
      lines.push(`- **Creativity Level**: Level ${def.level} — ${escapeMarkdownText(def.name)}`);
      lines.push(`- **Directive**: ${escapeMarkdownText(def.promptDirective)}`);
    }
  }

  // 2. A11y & Contrast Directives (Idea 3)
  lines.push("- **Accessibility & Contrast (WCAG 2.1 AA)**:");
  lines.push(
    "  - Maintain minimum 4.5:1 text-to-background contrast ratio (3:1 for large text). Validate palette pairings via tools like colorcontrast.cc.",
  );
  lines.push(
    "  - Interactive elements must maintain minimum 44×44px touch targets (48×48dp on mobile) and clearly visible focus rings for keyboard navigation.",
  );
  lines.push(
    "  - Provide semantic ARIA landmarks (header, nav, main, aside, footer) and descriptive labels on all interactive controls.",
  );

  // 3. Smart Semantics Context & Slot Inference
  lines.push("- **Semantic Context & Slot Inference (Smart Semantics)**:");
  lines.push(
    "  - Child elements inherit semantic roles from their tagged parent container. For example, text and icons nested within a navigation bar, tab row, or app bar represent navigation items; children inside a card, list item, or dialog represent header, media, body, and actions in document order.",
  );
  lines.push(
    "  - Do not render untagged child shapes as raw unstyled containers — map them directly into the parent component's idiomatic slots and sub-elements.",
  );

  // 3. Dark Mode & Switcher Directive (Idea 4)
  const rootShapes: Shape[] = Object.values(doc.shapes).filter((s) => isRootId(s.parentId));
  const scopedRoot =
    options?.rootId !== undefined && options.rootId !== ROOT_ID
      ? doc.shapes[options.rootId]
      : undefined;

  const hasDarkMode =
    scopedRoot !== undefined
      ? resolveRootDarkMode(doc, scopedRoot.id)
      : rootShapes.some((r) => resolveRootDarkMode(doc, r.id));

  if (hasDarkMode) {
    lines.push("- **Theme Architecture (Dual Light/Dark Modes)**:");
    lines.push("  - Implement full dual Light and Dark themes with semantic token parity.");
    lines.push(
      "  - Embed an interactive Theme Toggle Switch (sun/moon) component in the primary navigation bar / header.",
    );
  } else {
    lines.push("- **Theme Architecture (Single Light Mode)**:");
    lines.push("  - Implement a clean single Light theme mode.");
  }

  // 4. Root Container Theme Tokens (Idea 6)
  const activeRoots = scopedRoot !== undefined ? [scopedRoot] : rootShapes;
  for (const root of activeRoots) {
    const theme = resolveRootTheme(doc, root.id);
    if (theme !== undefined) {
      const platform = resolveRootPlatform(doc, root.id) ?? PLATFORMS.web;
      const rootLabel = root.label ?? "Root Container";
      lines.push(`- **Theme Palette Tokens (${escapeMarkdownText(rootLabel)})**:`);

      switch (platform) {
        case "androidNative":
          lines.push(...formatTokensForAndroid(theme).map((l) => `  ${l}`));
          break;
        case "flutter":
          lines.push(...formatTokensForFlutter(theme).map((l) => `  ${l}`));
          break;
        case "ios":
          lines.push(...formatTokensForIos(theme).map((l) => `  ${l}`));
          break;
        case "web":
        default:
          lines.push(...formatTokensForWeb(theme).map((l) => `  ${l}`));
          break;
      }
    }
  }

  // 5. Stack Detection & Codegen Style
  const platforms = new Set<string>();
  for (const root of activeRoots) {
    const p = resolveRootPlatform(doc, root.id);
    if (p !== undefined) {
      platforms.add(p);
    }
  }

  if (platforms.has("web") || platforms.has(PLATFORMS.web)) {
    lines.push(
      "- **Stack Guidance (Web)**: Implement as modular React components with TypeScript and Tailwind CSS. Ensure responsive layout behavior across device classes.",
    );
  }
  if (platforms.has("androidNative") || platforms.has(PLATFORMS.androidNative)) {
    lines.push(
      "- **Stack Guidance (Android)**: Implement using Android Jetpack Compose and Kotlin, adopting Material 3 design system conventions.",
    );
  }
  if (platforms.has("flutter") || platforms.has(PLATFORMS.flutter)) {
    lines.push(
      "- **Stack Guidance (Flutter)**: Implement using Flutter and Dart with declarative StatelessWidget / StatefulWidget hierarchies and ThemeData.",
    );
  }
  if (platforms.has("ios") || platforms.has(PLATFORMS.ios)) {
    lines.push(
      "- **Stack Guidance (iOS)**: Implement using SwiftUI and Swift with native View components and environment-driven dark mode.",
    );
  }

  return lines;
}
