import {
  isRootId,
  SHAPE_KIND_LABELS,
  type BuiltinShapeKind,
  type ShapeId,
} from "@open-draw/canvas";
import { resolveShapeSemanticType, type walkSemanticTree } from "@open-draw/semantics";
import { OdBadge } from "@open-draw/ui";

type TreeNodes = ReturnType<typeof walkSemanticTree>;
type TreeNode = TreeNodes[number];

function determineDotCategory(
  node: TreeNode,
): "conflict" | "container" | "interactive" | "content" | "primitive" {
  if (node.conflict !== undefined) {
    return "conflict";
  }
  if (isRootId(node.shape.parentId)) {
    return "container";
  }
  const category = node.semantic?.definition?.category;
  if (category === "layout") {
    return "container";
  }
  if (category === "interactive" || category === "forms" || category === "navigation") {
    return "interactive";
  }
  if (category === "content" || category === "feedback") {
    return "content";
  }
  return "primitive";
}

export interface TreeOutlineProps {
  readonly treeNodes: TreeNodes;
  readonly selectedShapeId: ShapeId | null;
  readonly selectShape: (id: ShapeId) => void;
  readonly showHeader?: boolean;
  readonly isScopedToRoot?: boolean | undefined;
  readonly activeRootTitle?: string | undefined;
  readonly onClearScope?: (() => void) | undefined;
  readonly hoveredShapeId?: ShapeId | null | undefined;
  readonly onHoverShape?: ((id: ShapeId | null) => void) | undefined;
}

export function TreeOutline(props: TreeOutlineProps): React.JSX.Element {
  const {
    treeNodes,
    selectedShapeId,
    selectShape,
    showHeader = true,
    isScopedToRoot,
    activeRootTitle,
    onClearScope,
    hoveredShapeId,
    onHoverShape,
  } = props;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        minHeight: 0,
        boxSizing: "border-box",
      }}
    >
      {showHeader && (
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
      )}
      {isScopedToRoot && activeRootTitle && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--od-4) var(--od-8)",
            backgroundColor: "var(--od-bg)",
            borderBottom: "var(--od-border-width) solid var(--od-border)",
            fontSize: "var(--od-text-xs)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--od-4)", minWidth: 0 }}>
            <span style={{ color: "var(--od-text-secondary)", flexShrink: 0 }}>Scope:</span>
            <span
              style={{
                fontWeight: 600,
                color: "var(--od-text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeRootTitle}
            </span>
          </div>
          {onClearScope && (
            <button
              type="button"
              className="od-btn od-btn--ghost"
              style={{
                height: "20px",
                padding: "0 var(--od-4)",
                fontSize: "10px",
                flexShrink: 0,
              }}
              onClick={onClearScope}
              title="Show all screens on canvas"
            >
              All Screens
            </button>
          )}
        </div>
      )}
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          padding: "var(--od-4) var(--od-8)",
        }}
      >
        {treeNodes.length === 0 ? (
          <div className="od-empty" style={{ padding: "var(--od-16)" }}>
            <span>No layers</span>
          </div>
        ) : (
          treeNodes.map((node, index) => {
            const isSelected = node.shape.id === selectedShapeId;
            const isHovered = !isSelected && node.shape.id === hoveredShapeId;
            const itemName =
              node.shape.label && node.shape.label.trim().length > 0
                ? node.shape.label
                : (SHAPE_KIND_LABELS[node.shape.kind as BuiltinShapeKind] ?? node.shape.kind);
            const semanticChip =
              node.semanticType ??
              node.semantic?.displayName ??
              (isRootId(node.shape.parentId) ? resolveShapeSemanticType(node.shape) : undefined);
            const nextNode = treeNodes[index + 1];
            const isContainer =
              isRootId(node.shape.parentId) ||
              (nextNode !== undefined && nextNode.depth > node.depth);
            const dotCategory = determineDotCategory(node);

            return (
              <div
                key={node.shape.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Select layer ${itemName}`}
                className={`od-tree-item${isHovered ? " od-tree-item--hovered" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--od-8)",
                  paddingLeft: "var(--od-4)",
                  paddingTop: "var(--od-2)",
                  paddingBottom: "var(--od-2)",
                  paddingRight: "var(--od-4)",
                  backgroundColor: isSelected ? "var(--od-accent-soft)" : "transparent",
                  color: isSelected ? "var(--od-accent)" : "var(--od-text)",
                }}
                onClick={() => selectShape(node.shape.id)}
                onPointerEnter={() => onHoverShape?.(node.shape.id)}
                onPointerLeave={() => onHoverShape?.(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectShape(node.shape.id);
                  }
                }}
              >
                <div className="od-tree-item__left">
                  {node.depth > 0 && (
                    <span
                      className="od-tree-guide"
                      style={{ width: `${node.depth * 14}px` }}
                      aria-hidden="true"
                    />
                  )}
                  {isContainer && <span className="od-tree-chevron" aria-hidden="true" />}
                  <span className={`od-tree-dot od-tree-dot--${dotCategory}`} aria-hidden="true" />
                  <span className="od-tree-item__label">{itemName}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--od-4)",
                    flexShrink: 0,
                  }}
                >
                  {semanticChip && (
                    <OdBadge
                      variant="outline"
                      style={{
                        fontSize: "11px",
                        height: "18px",
                        padding: "0 6px",
                        fontWeight: 500,
                      }}
                    >
                      {semanticChip}
                    </OdBadge>
                  )}
                  {node.conflict && (
                    <span
                      style={{
                        backgroundColor: "var(--od-danger-soft)",
                        color: "var(--od-danger)",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: "var(--od-radius-sm)",
                        flexShrink: 0,
                      }}
                      title={node.conflict.reason}
                    >
                      conflict
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
