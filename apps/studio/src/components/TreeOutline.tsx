import React from "react";
import type { ShapeId } from "@open-draw/contracts";
import type { walkSemanticTree } from "@open-draw/semantics";

type TreeNodes = ReturnType<typeof walkSemanticTree>;

export interface TreeOutlineProps {
  readonly treeNodes: TreeNodes;
  readonly selectedShapeId: ShapeId | null;
  readonly selectShape: (id: ShapeId) => void;
}

export function TreeOutline(props: TreeOutlineProps): React.JSX.Element {
  const { treeNodes, selectedShapeId, selectShape } = props;

  return (
    <div>
      <h2 className="od-panel-title" style={{ marginBottom: "var(--od-8)" }}>
        Tree Outline
      </h2>
      <div
        style={{
          maxHeight: "220px",
          overflowY: "auto",
          border: "var(--od-border-width) solid var(--od-border)",
          borderRadius: "var(--od-radius-sm)",
          padding: "var(--od-4)",
          backgroundColor: "var(--od-bg)",
        }}
      >
        {treeNodes.length === 0 ? (
          <div className="od-empty" style={{ padding: "var(--od-12)" }}>
            <span>Empty tree</span>
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
