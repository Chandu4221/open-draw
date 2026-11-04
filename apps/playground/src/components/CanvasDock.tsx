import React from "react";
import { TOOLS, type ToolId } from "@open-draw/canvas";
import { OdIconButton, OdTooltip } from "@open-draw/ui";

export interface CanvasDockProps {
  readonly tool: ToolId;
  readonly chooseTool: (tool: ToolId) => void;
  readonly handleUndo?: () => void;
  readonly handleRedo?: () => void;
  readonly handleDuplicate?: () => void;
  readonly handleDelete?: () => void;
  readonly handleLoad?: () => void;
  readonly handleExportSvg?: () => void;
  readonly handleExportPng?: () => void;
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
    handleExportSvg,
    handleExportPng,
    onOpenExportModal,
  } = props;

  return (
    <div className="od-dock" role="toolbar" aria-label="Canvas tools and actions dock">
      {/* Group 1: Tools */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--od-2)" }}>
        <OdTooltip text="Select (V)">
          <OdIconButton
            name="select-tool"
            aria-label="Select tool (V)"
            active={tool === TOOLS.select}
            onClick={() => chooseTool(TOOLS.select)}
          />
        </OdTooltip>
        <OdTooltip text="Rectangle (R)">
          <OdIconButton
            name="rect-tool"
            aria-label="Draw rectangle (R)"
            active={tool === TOOLS.drawRect}
            onClick={() => chooseTool(TOOLS.drawRect)}
          />
        </OdTooltip>
        <OdTooltip text="Ellipse (O)">
          <OdIconButton
            name="ellipse-tool"
            aria-label="Draw ellipse (O)"
            active={tool === TOOLS.drawEllipse}
            onClick={() => chooseTool(TOOLS.drawEllipse)}
          />
        </OdTooltip>
        <OdTooltip text="Line (L)">
          <OdIconButton
            name="line-tool"
            aria-label="Draw line (L)"
            active={tool === TOOLS.drawLine}
            onClick={() => chooseTool(TOOLS.drawLine)}
          />
        </OdTooltip>
        <OdTooltip text="Pen (P)">
          <OdIconButton
            name="pen-tool"
            aria-label="Draw pen path (P)"
            active={tool === TOOLS.drawPenPath}
            onClick={() => chooseTool(TOOLS.drawPenPath)}
          />
        </OdTooltip>
      </div>

      <div className="od-divider" />

      {/* Group 2: Edit actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--od-2)" }}>
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

      <div className="od-divider" />

      {/* Group 3: File & Export actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--od-2)" }}>
        {handleLoad && (
          <OdTooltip text="Open document">
            <OdIconButton name="open" aria-label="Open document" ghost onClick={handleLoad} />
          </OdTooltip>
        )}
        {handleExportSvg && (
          <OdTooltip text="Save SVG">
            <OdIconButton aria-label="Save SVG" ghost onClick={handleExportSvg}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                SVG
              </span>
            </OdIconButton>
          </OdTooltip>
        )}
        {handleExportPng && (
          <OdTooltip text="Save PNG">
            <OdIconButton aria-label="Save PNG" ghost onClick={handleExportPng}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                PNG
              </span>
            </OdIconButton>
          </OdTooltip>
        )}
        <OdTooltip text="Save / Export wireframe">
          <OdIconButton
            name="save"
            aria-label="Save or export wireframe"
            ghost
            onClick={onOpenExportModal}
          />
        </OdTooltip>
      </div>
    </div>
  );
}
