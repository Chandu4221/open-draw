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
      <h2 style={{ fontSize: "15px", margin: "0 0 8px 0", color: "#0f172a" }}>Tree Outline</h2>
      <div
        style={{
          maxHeight: "220px",
          overflowY: "auto",
          border: "1px solid #cbd5e1",
          borderRadius: "4px",
          padding: "6px",
          backgroundColor: "#f8fafc",
        }}
      >
        {treeNodes.length === 0 ? (
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Empty tree</span>
        ) : (
          treeNodes.map((node) => (
            <div
              key={node.shape.id}
              style={{
                paddingLeft: `${node.depth * 14 + 4}px`,
                paddingTop: "3px",
                paddingBottom: "3px",
                paddingRight: "6px",
                fontSize: "12px",
                cursor: "pointer",
                borderRadius: "3px",
                backgroundColor: node.shape.id === selectedShapeId ? "#dbeafe" : "transparent",
                color: node.shape.id === selectedShapeId ? "#1d4ed8" : "#334155",
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
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 4px",
                    borderRadius: "2px",
                    marginLeft: "4px",
                    flexShrink: 0,
                  }}
                  title={node.conflict.reason}
                >
                  conflict
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
