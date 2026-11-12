import React, { useEffect, useMemo } from "react";
import { OdButton, OdIconButton } from "@open-draw/ui";

export interface KeyboardShortcutsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

interface ShortcutItem {
  readonly label: string;
  readonly keys: readonly string[];
}

interface ShortcutGroup {
  readonly category: string;
  readonly items: readonly ShortcutItem[];
}

const LEFT_GROUPS: readonly ShortcutGroup[] = [
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
    category: "Selection",
    items: [
      { label: "Direct Select Child", keys: ["Ctrl+Click"] },
      { label: "Multi-Select", keys: ["Shift+Click"] },
      { label: "Box Select", keys: ["Drag"] },
      { label: "Drill Down", keys: ["Double Click"] },
      { label: "Deselect / Cancel", keys: ["Esc"] },
    ],
  },
];

const RIGHT_GROUPS: readonly ShortcutGroup[] = [
  {
    category: "Edit & Clipboard",
    items: [
      { label: "Undo", keys: ["Ctrl+Z"] },
      { label: "Redo", keys: ["Ctrl+Shift+Z", "Ctrl+Y"] },
      { label: "Duplicate", keys: ["Ctrl+D"] },
      { label: "Copy", keys: ["Ctrl+C"] },
      { label: "Paste", keys: ["Ctrl+V"] },
      { label: "Delete Selected", keys: ["Delete", "Backspace"] },
    ],
  },
  {
    category: "Canvas Navigation",
    items: [
      { label: "Pan Canvas", keys: ["Space+Drag", "Middle Click"] },
      { label: "Wheel Pan", keys: ["Wheel"] },
      { label: "Zoom In / Out", keys: ["Ctrl+Wheel"] },
      { label: "Disable Snapping", keys: ["Alt+Drag"] },
      { label: "Toggle Shortcuts", keys: ["?"] },
    ],
  },
];

function resolvePlatformModifier(): string {
  if (typeof navigator !== "undefined") {
    const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.platform || navigator.userAgent || "");
    if (isMac) return "Cmd";
  }
  return "Ctrl";
}

function ShortcutGroupCard({
  group,
  modifier,
}: {
  readonly group: ShortcutGroup;
  readonly modifier: string;
}): React.JSX.Element {
  return (
    <div className="od-shortcuts-group">
      <span className="od-section-header">{group.category}</span>
      <div className="od-shortcuts-card">
        {group.items.map((item) => (
          <div key={item.label} className="od-shortcuts-row">
            <span className="od-shortcuts-label">{item.label}</span>
            <div className="od-shortcuts-keys">
              {item.keys.map((k, idx) => {
                const formattedKey = k.replace("Ctrl", modifier);
                return (
                  <React.Fragment key={k}>
                    {idx > 0 && <span className="od-shortcuts-or">or</span>}
                    <div className="od-shortcuts-combo">
                      {formattedKey.split("+").map((keyPart) => (
                        <kbd key={keyPart} className="od-kbd">
                          {keyPart}
                        </kbd>
                      ))}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps): React.JSX.Element | null {
  const modifier = useMemo(() => resolvePlatformModifier(), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
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
      <div className="od-modal" style={{ maxWidth: "680px" }}>
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

        <div className="od-modal__body">
          <div className="od-shortcuts-grid">
            <div className="od-shortcuts-col">
              {LEFT_GROUPS.map((group) => (
                <ShortcutGroupCard key={group.category} group={group} modifier={modifier} />
              ))}
            </div>
            <div className="od-shortcuts-col">
              {RIGHT_GROUPS.map((group) => (
                <ShortcutGroupCard key={group.category} group={group} modifier={modifier} />
              ))}
            </div>
          </div>
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
