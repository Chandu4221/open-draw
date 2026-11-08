import React from "react";
import { OdIconButton, OdTooltip } from "@open-draw/ui";

export interface CanvasShortcutsTriggerProps {
  readonly onOpenShortcuts: () => void;
}

export function CanvasShortcutsTrigger({
  onOpenShortcuts,
}: CanvasShortcutsTriggerProps): React.JSX.Element {
  return (
    <div className="od-canvas-overlay-bottom-left">
      <div className="od-shortcuts-trigger">
        <OdTooltip text="Keyboard shortcuts (?)">
          <OdIconButton
            name="keyboard"
            aria-label="Keyboard shortcuts (?)"
            onClick={onOpenShortcuts}
          />
        </OdTooltip>
      </div>
    </div>
  );
}
