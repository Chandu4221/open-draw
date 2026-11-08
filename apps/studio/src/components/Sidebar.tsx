import React from "react";
import { Allotment } from "allotment";
import type { ShapeId } from "@open-draw/contracts";
import type { SemanticTreeNode } from "@open-draw/semantics";
import { OdIconButton } from "@open-draw/ui";
import { Inspector, type InspectorProps } from "./Inspector";
import { TreeOutline } from "./TreeOutline";

export interface SidebarProps extends InspectorProps {
  readonly treeNodes: readonly SemanticTreeNode[];
  readonly selectedShapeId: ShapeId | null;
  readonly selectShape: (id: ShapeId) => void;
  readonly onClose?: (() => void) | undefined;
}

export function Sidebar(props: SidebarProps): React.JSX.Element {
  const { treeNodes, selectedShapeId, selectShape, onClose, ...inspectorProps } = props;

  return (
    <aside
      className="od-panel"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
        borderTop: "none",
        borderBottom: "none",
        borderRight: "none",
        borderRadius: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--od-12) var(--od-16)",
          borderBottom: "var(--od-border-width) solid var(--od-border)",
          flexShrink: 0,
        }}
      >
        <span className="od-panel-title" style={{ letterSpacing: "0.02em" }}>
          PROPERTIES
        </span>
        {onClose && (
          <OdIconButton
            name="close"
            aria-label="Hide Inspector"
            onClick={onClose}
            ghost
            style={{ width: "24px", height: "24px" }}
          />
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
        <Allotment vertical className="allotment-module">
          <Allotment.Pane preferredSize="60%" minSize={160}>
            <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
              <Inspector {...inspectorProps} />
            </div>
          </Allotment.Pane>
          <Allotment.Pane preferredSize="40%" minSize={100} snap>
            <div
              style={{
                height: "100%",
                overflow: "hidden",
                borderTop: "var(--od-border-width) solid var(--od-border)",
              }}
            >
              <TreeOutline
                treeNodes={treeNodes}
                selectedShapeId={selectedShapeId}
                selectShape={selectShape}
              />
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
    </aside>
  );
}
