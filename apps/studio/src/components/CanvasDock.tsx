import React from "react";
import { TOOLS, type ToolId } from "@open-draw/canvas";
import { OdIconButton, OdTooltip } from "@open-draw/ui";

export interface CanvasDockProps {
  readonly tool: ToolId;
  readonly chooseTool: (tool: ToolId) => void;
  readonly handleLoad?: () => void;
}

export function CanvasDock(props: CanvasDockProps): React.JSX.Element {
  const { tool, chooseTool, handleLoad } = props;

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

      {handleLoad && (
        <>
          <div className="od-divider" />
          <div className="od-dock-group">
            <OdTooltip text="Open document">
              <OdIconButton name="open" aria-label="Open document" ghost onClick={handleLoad} />
            </OdTooltip>
          </div>
        </>
      )}
    </div>
  );
}
