import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

describe("KeyboardShortcutsModal", () => {
  it("returns null when isOpen is false", () => {
    const html = renderToString(<KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />);
    expect(html).toBe("");
  });

  it("renders two-column layout with updated shortcut groups including direct child selection", () => {
    const html = renderToString(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);

    // Modal dialog structure
    expect(html).toContain('role="dialog"');
    expect(html).toContain("Keyboard Shortcuts");
    expect(html).toContain("od-shortcuts-grid");

    // All 4 balanced categories
    expect(html).toContain("Drawing Tools");
    expect(html).toContain("Selection");
    expect(html).toContain("Edit &amp; Clipboard");
    expect(html).toContain("Canvas Navigation");

    // Canvas selection interactions
    expect(html).toContain("Direct Select Child");
    expect(html).toContain("Click");
    expect(html).toContain("Multi-Select");
    expect(html).toContain("Box Select");
    expect(html).toContain("Drill Down");

    // Drawing tools
    expect(html).toContain("Select Tool");
    expect(html).toContain("Rectangle");
    expect(html).toContain("Ellipse");
    expect(html).toContain("Line");
    expect(html).toContain("Pen / Freehand Path");
    expect(html).toContain("Text");

    // Edit actions
    expect(html).toContain("Undo");
    expect(html).toContain("Redo");
    expect(html).toContain("Duplicate");
    expect(html).toContain("Copy");
    expect(html).toContain("Paste");
    expect(html).toContain("Delete Selected");

    // Navigation
    expect(html).toContain("Pan Canvas");
    expect(html).toContain("Wheel Pan");
    expect(html).toContain("Zoom In / Out");
    expect(html).toContain("Disable Snapping");
    expect(html).toContain("Toggle Shortcuts");
  });
});
