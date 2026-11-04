import React from "react";
import type { ShapeId } from "@open-draw/contracts";
import type { SemanticTreeNode } from "@open-draw/semantics";
import { Inspector, type InspectorProps } from "./Inspector";
import { TreeOutline } from "./TreeOutline";

export interface SidebarProps extends InspectorProps {
  readonly treeNodes: readonly SemanticTreeNode[];
  readonly selectedShapeId: ShapeId | null;
  readonly selectShape: (id: ShapeId) => void;
}

export function Sidebar(props: SidebarProps): React.JSX.Element {
  const { treeNodes, selectedShapeId, selectShape, ...inspectorProps } = props;

  return (
    <aside
      className="od-panel"
      style={{
        width: "360px",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
        borderTop: "none",
        borderBottom: "none",
        borderRight: "none",
        borderRadius: 0,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "var(--od-16)",
        flexShrink: 0,
      }}
    >
      <Inspector {...inspectorProps} />
      <TreeOutline
        treeNodes={treeNodes}
        selectedShapeId={selectedShapeId}
        selectShape={selectShape}
      />
    </aside>
  );
}
