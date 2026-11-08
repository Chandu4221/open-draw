import React from "react";
import { TOOLS, type ToolId } from "@open-draw/canvas";
import { OdButton, OdIcon, OdIconButton, OdTooltip } from "@open-draw/ui";

export interface CanvasDockProps {
  readonly tool: ToolId;
  readonly chooseTool: (tool: ToolId) => void;
  readonly handleUndo?: () => void;
  readonly handleRedo?: () => void;
  readonly handleDuplicate?: () => void;
  readonly handleDelete?: () => void;
  readonly handleLoad?: () => void;
  readonly onOpenExportModal: () => void;
}

export function CanvasDock(props: CanvasDockProps): React.JSX.Element {
  const {
    tool,
    chooseTool,
    handleUndo,
    handleRedo,
    handleDuplicate,
    handleDelete,
    handleLoad,
    onOpenExportModal,
  } = props;

  return (
    <div className="od-dock" role="toolbar" aria-label="Canvas tools and actions dock">
      {/* Group 1: Drawing Tools Pill */}
      <div className="od-dock-group">
        <OdTooltip text="Select (V)">
          <OdIconButton
            name="select-tool"
            aria-label="Select tool (V)"
            active={tool === TOOLS.select}
            ghost
            onClick={() => chooseTool(TOOLS.select)}
          />
        </OdTooltip>
        <OdTooltip text="Rectangle (R)">
          <OdIconButton
            name="rect-tool"
            aria-label="Draw rectangle (R)"
            active={tool === TOOLS.drawRect}
            ghost
            onClick={() => chooseTool(TOOLS.drawRect)}
          />
        </OdTooltip>
        <OdTooltip text="Ellipse (O)">
          <OdIconButton
            name="ellipse-tool"
            aria-label="Draw ellipse (O)"
            active={tool === TOOLS.drawEllipse}
            ghost
            onClick={() => chooseTool(TOOLS.drawEllipse)}
          />
        </OdTooltip>
        <OdTooltip text="Line (L)">
          <OdIconButton
            name="line-tool"
            aria-label="Draw line (L)"
            active={tool === TOOLS.drawLine}
            ghost
            onClick={() => chooseTool(TOOLS.drawLine)}
          />
        </OdTooltip>
        <OdTooltip text="Pen (P)">
          <OdIconButton
            name="pen-tool"
            aria-label="Draw pen path (P)"
            active={tool === TOOLS.drawPenPath}
            ghost
            onClick={() => chooseTool(TOOLS.drawPenPath)}
          />
        </OdTooltip>
        <OdTooltip text="Text (T)">
          <OdIconButton
            name="text-tool"
            aria-label="Add text (T)"
            active={tool === TOOLS.drawText}
            ghost
            onClick={() => chooseTool(TOOLS.drawText)}
          />
        </OdTooltip>
      </div>

      {/* Group 2: Edit / History Actions Pill */}
      <div className="od-dock-group">
        {handleUndo && (
          <OdTooltip text="Undo (Ctrl+Z)">
            <OdIconButton name="undo" aria-label="Undo" ghost onClick={handleUndo} />
          </OdTooltip>
        )}
        {handleRedo && (
          <OdTooltip text="Redo (Ctrl+Y)">
            <OdIconButton name="redo" aria-label="Redo" ghost onClick={handleRedo} />
          </OdTooltip>
        )}
        {handleDuplicate && (
          <OdTooltip text="Duplicate (Ctrl+D)">
            <OdIconButton name="duplicate" aria-label="Duplicate" ghost onClick={handleDuplicate} />
          </OdTooltip>
        )}
        {handleDelete && (
          <OdTooltip text="Delete (Del)">
            <OdIconButton name="delete" aria-label="Delete" ghost onClick={handleDelete} />
          </OdTooltip>
        )}
      </div>

      {/* Group 3: File & Export Pill */}
      <div className="od-dock-group">
        {handleLoad && (
          <OdTooltip text="Open document">
            <OdIconButton name="open" aria-label="Open document" ghost onClick={handleLoad} />
          </OdTooltip>
        )}
        <OdTooltip text="Export wireframe">
          <OdButton
            variant="ghost"
            onClick={onOpenExportModal}
            aria-label="Export wireframe"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--od-4)",
              padding: "0 var(--od-8)",
              height: "var(--od-control-height)",
              fontSize: "var(--od-text-xs)",
              fontWeight: 600,
            }}
          >
            <OdIcon name="export" size={16} />
            <span>Export</span>
          </OdButton>
        </OdTooltip>
      </div>
    </div>
  );
}
