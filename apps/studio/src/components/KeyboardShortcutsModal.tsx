import React, { useEffect } from "react";
import { OdButton, OdIconButton } from "@open-draw/ui";

export interface KeyboardShortcutsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

interface ShortcutGroup {
  readonly category: string;
  readonly items: readonly {
    readonly label: string;
    readonly keys: readonly string[];
  }[];
}

const SHORTCUT_GROUPS: readonly ShortcutGroup[] = [
  {
    category: "Drawing Tools",
    items: [
      { label: "Select Tool", keys: ["V", "1"] },
      { label: "Rectangle", keys: ["R"] },
      { label: "Ellipse", keys: ["O"] },
      { label: "Line", keys: ["L"] },
      { label: "Pen / Freehand Path", keys: ["P", "D"] },
      { label: "Text", keys: ["T"] },
    ],
  },
  {
    category: "Edit & History",
    items: [
      { label: "Undo", keys: ["Ctrl+Z"] },
      { label: "Redo", keys: ["Ctrl+Shift+Z", "Ctrl+Y"] },
      { label: "Duplicate", keys: ["Ctrl+D"] },
      { label: "Copy", keys: ["Ctrl+C"] },
      { label: "Paste", keys: ["Ctrl+V"] },
      { label: "Delete Selected", keys: ["Delete", "Backspace"] },
      { label: "Deselect / Cancel", keys: ["Esc"] },
    ],
  },
  {
    category: "Canvas Navigation",
    items: [
      { label: "Pan Canvas", keys: ["Space+Drag", "Middle Click"] },
      { label: "Wheel Pan", keys: ["Wheel"] },
      { label: "Zoom In / Out", keys: ["Ctrl+Wheel"] },
      { label: "Toggle Shortcuts", keys: ["?"] },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps): React.JSX.Element | null {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="od-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="od-shortcuts-modal-title"
    >
      <div className="od-modal" style={{ maxWidth: "620px" }}>
        <div className="od-modal__header">
          <h2 id="od-shortcuts-modal-title" className="od-panel-title">
            Keyboard Shortcuts
          </h2>
          <OdIconButton
            name="close"
            aria-label="Close keyboard shortcuts modal"
            ghost
            onClick={onClose}
          />
        </div>

        <div className="od-modal__body" style={{ gap: "var(--od-20)" }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div
              key={group.category}
              style={{ display: "flex", flexDirection: "column", gap: "var(--od-8)" }}
            >
              <span className="od-section-header">{group.category}</span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "var(--od-4)",
                  backgroundColor: "var(--od-bg)",
                  border: "var(--od-border-width) solid var(--od-border)",
                  borderRadius: "var(--od-radius-sm)",
                  padding: "var(--od-8)",
                }}
              >
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--od-4) var(--od-8)",
                    }}
                  >
                    <span style={{ fontSize: "var(--od-text-sm)", color: "var(--od-text)" }}>
                      {item.label}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--od-6)" }}>
                      {item.keys.map((k, idx) => (
                        <React.Fragment key={k}>
                          {idx > 0 && (
                            <span
                              style={{
                                fontSize: "var(--od-text-xs)",
                                color: "var(--od-text-tertiary)",
                              }}
                            >
                              or
                            </span>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                            {k.split("+").map((keyPart) => (
                              <kbd key={keyPart} className="od-kbd">
                                {keyPart}
                              </kbd>
                            ))}
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="od-modal__footer">
          <span className="od-meta">Press Esc or click outside to dismiss</span>
          <OdButton variant="primary" onClick={onClose}>
            Done
          </OdButton>
        </div>
      </div>
    </div>
  );
}
