import React from "react";
import type { ShapeId } from "@open-draw/contracts";
import type { walkSemanticTree } from "@open-draw/semantics";
import { OdBadge } from "@open-draw/ui";

type TreeNodes = ReturnType<typeof walkSemanticTree>;

export interface TreeOutlineProps {
  readonly treeNodes: TreeNodes;
  readonly selectedShapeId: ShapeId | null;
  readonly selectShape: (id: ShapeId) => void;
}

export function TreeOutline(props: TreeOutlineProps): React.JSX.Element {
  const { treeNodes, selectedShapeId, selectShape } = props;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--od-8) var(--od-16)",
          borderBottom: "var(--od-border-width) solid var(--od-border)",
          flexShrink: 0,
        }}
      >
        <span className="od-section-header">LAYERS</span>
        <OdBadge>{treeNodes.length}</OdBadge>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--od-4) var(--od-8)",
        }}
      >
        {treeNodes.length === 0 ? (
          <div className="od-empty" style={{ padding: "var(--od-16)" }}>
            <span>No layers</span>
          </div>
        ) : (
          treeNodes.map((node) => {
            const isSelected = node.shape.id === selectedShapeId;
            return (
              <div
                key={node.shape.id}
                style={{
                  paddingLeft: `calc(${node.depth} * var(--od-12) + var(--od-4))`,
                  paddingTop: "var(--od-2)",
                  paddingBottom: "var(--od-2)",
                  paddingRight: "var(--od-4)",
                  fontSize: "var(--od-text-xs)",
                  cursor: "pointer",
                  borderRadius: "var(--od-radius-sm)",
                  backgroundColor: isSelected ? "var(--od-accent-soft)" : "transparent",
                  color: isSelected ? "var(--od-accent)" : "var(--od-text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onClick={() => selectShape(node.shape.id)}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {node.displayName}
                </span>
                {node.conflict && (
                  <span
                    style={{
                      backgroundColor: "var(--od-danger-soft)",
                      color: "var(--od-danger)",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "1px 4px",
                      borderRadius: "var(--od-radius-sm)",
                      marginLeft: "var(--od-4)",
                      flexShrink: 0,
                    }}
                    title={node.conflict.reason}
                  >
                    conflict
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
