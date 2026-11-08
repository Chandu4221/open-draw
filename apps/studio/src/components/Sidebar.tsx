import React from "react";
import type { ShapeId } from "@open-draw/contracts";
import type { SemanticTreeNode } from "@open-draw/semantics";
import { OdIconButton } from "@open-draw/ui";
import { Inspector, type InspectorProps } from "./Inspector";
import { TreeOutline } from "./TreeOutline";

export interface SidebarProps extends InspectorProps {
  readonly treeNodes: readonly SemanticTreeNode[];
  readonly selectedShapeId: ShapeId | null;
  readonly selectShape: (id: ShapeId) => void;
  readonly onClose?: () => void;
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
        overflowY: "auto",
        overflowX: "hidden",
        padding: "var(--od-16)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--od-12)",
          paddingBottom: "var(--od-8)",
          borderBottom: "var(--od-border-width) solid var(--od-border)",
        }}
      >
        <span className="od-panel-title" style={{ letterSpacing: "0.02em" }}>
          INSPECTOR
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

      <Inspector {...inspectorProps} />
      <TreeOutline
        treeNodes={treeNodes}
        selectedShapeId={selectedShapeId}
        selectShape={selectShape}
      />
    </aside>
  );
}
