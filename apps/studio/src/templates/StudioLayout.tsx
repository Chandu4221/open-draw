import React from "react";
import { Allotment } from "allotment";
import { OdIcon, OdToastHost } from "@open-draw/ui";
import { CANVAS_CONTAINER_STYLE, CANVAS_WIRE_STYLE } from "../types";

export interface StudioLayoutProps {
  readonly svgRef: React.RefObject<SVGSVGElement | null>;
  readonly showSidebar: boolean;
  readonly onToggleSidebar: (show: boolean) => void;
  readonly brandSlot?: React.ReactNode | undefined;
  readonly dockSlot?: React.ReactNode | undefined;
  readonly zoomSlot?: React.ReactNode | undefined;
  readonly hintSlot?: React.ReactNode | undefined;
  readonly shortcutsSlot?: React.ReactNode | undefined;
  readonly sidebarSlot: React.ReactNode;
  readonly modalSlot?: React.ReactNode | undefined;
}

export function StudioLayout(props: StudioLayoutProps): React.JSX.Element {
  const {
    svgRef,
    showSidebar,
    onToggleSidebar,
    brandSlot,
    dockSlot,
    zoomSlot,
    hintSlot,
    shortcutsSlot,
    sidebarSlot,
    modalSlot,
  } = props;

  const handleAllotmentChange = (sizes: number[]) => {
    // When the user drags the sash towards the right and collapses the sidebar pane
    const sidebarWidth = sizes[1];
    if (sidebarWidth !== undefined && sidebarWidth <= 15 && showSidebar) {
      onToggleSidebar(false);
    } else if (sidebarWidth !== undefined && sidebarWidth > 15 && !showSidebar) {
      onToggleSidebar(true);
    }
  };

  const handleVisibleChange = (index: number, visible: boolean) => {
    if (index === 1 && !visible && showSidebar) {
      onToggleSidebar(false);
    }
  };

  return (
    <main style={{ height: "100%", width: "100%", minHeight: 0, minWidth: 0, overflow: "hidden" }}>
      <Allotment
        className="allotment-module"
        onChange={handleAllotmentChange}
        onVisibleChange={handleVisibleChange}
      >
        <Allotment.Pane minSize={400}>
          <div className="od-canvas-bg" style={CANVAS_CONTAINER_STYLE}>
            {brandSlot}
            {!showSidebar && (
              <button
                type="button"
                aria-label="Show Inspector"
                className="od-panel-toggle-btn"
                style={{
                  position: "absolute",
                  top: "var(--od-16)",
                  right: "var(--od-16)",
                  zIndex: 20,
                }}
                onClick={() => onToggleSidebar(true)}
              >
                <span>Inspector</span>
                <OdIcon name="panel" size={16} />
              </button>
            )}
            <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" style={CANVAS_WIRE_STYLE} />
            {hintSlot}
            {shortcutsSlot}
            {dockSlot}
            {zoomSlot}
          </div>
        </Allotment.Pane>
        <Allotment.Pane preferredSize={340} minSize={260} maxSize={500} snap visible={showSidebar}>
          {sidebarSlot}
        </Allotment.Pane>
      </Allotment>

      {modalSlot}
      <OdToastHost />
    </main>
  );
}
