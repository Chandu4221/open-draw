import React, { useRef, useState } from "react";
import type { ShapeId } from "@open-draw/contracts";
import type { Document } from "@open-draw/document";
import type { SemanticTreeNode } from "@open-draw/semantics";
import { OdBadge, OdIconButton } from "@open-draw/ui";
import { ExportPanel } from "./ExportPanel";
import { Inspector, type InspectorProps } from "./Inspector";
import { SidebarPanelHeader } from "./SidebarPanelHeader";
import { TreeOutline } from "./TreeOutline";

export interface SidebarProps extends InspectorProps {
  readonly treeNodes: readonly SemanticTreeNode[];
  readonly selectedShapeId: ShapeId | null;
  readonly selectShape: (id: ShapeId) => void;
  readonly onClose?: (() => void) | undefined;
  readonly isScopedToRoot?: boolean | undefined;
  readonly activeRootTitle?: string | undefined;
  readonly onClearScope?: (() => void) | undefined;
  readonly doc?: Document | undefined;
  readonly onOpenAdvancedModal?: (() => void) | undefined;
}

export function Sidebar(props: SidebarProps): React.JSX.Element {
  const {
    treeNodes,
    selectedShapeId,
    selectShape,
    onClose,
    isScopedToRoot,
    activeRootTitle,
    onClearScope,
    doc,
    onOpenAdvancedModal,
    ...inspectorProps
  } = props;
  const [propertiesExpanded, setPropertiesExpanded] = useState(true);
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [exportExpanded, setExportExpanded] = useState(true);
  const [propertiesHeight, setPropertiesHeight] = useState<number | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const sidebarRef = useRef<HTMLElement | null>(null);
  const propertiesRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleSashPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = propertiesRef.current?.getBoundingClientRect().height ?? 300;
  };

  const handleSashPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const deltaY = e.clientY - startYRef.current;
    const containerHeight = sidebarRef.current?.getBoundingClientRect().height ?? 600;
    // Allow dragging up to 36px (header) and down to containerHeight - 36px
    const clamped = Math.max(36, Math.min(containerHeight - 36, startHeightRef.current + deltaY));
    setPropertiesHeight(clamped);
  };

  const handleSashPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already lost
    }
  };

  const handleSashKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setPropertiesHeight((prev) => {
        const cur = prev ?? propertiesRef.current?.getBoundingClientRect().height ?? 300;
        return Math.max(36, cur - 16);
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setPropertiesHeight((prev) => {
        const cur = prev ?? propertiesRef.current?.getBoundingClientRect().height ?? 300;
        const containerHeight = sidebarRef.current?.getBoundingClientRect().height ?? 600;
        return Math.min(containerHeight - 36, cur + 16);
      });
    }
  };

  const propertiesMaxHeight = !propertiesExpanded
    ? "36px"
    : layersExpanded
      ? propertiesHeight !== undefined
        ? `${propertiesHeight}px`
        : "50%"
      : undefined;

  return (
    <aside
      ref={sidebarRef}
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
      {/* 1. PROPERTIES Panel (auto-hugs content via flex: 0 1 auto; max-height: ...) */}
      <div
        ref={propertiesRef}
        style={{
          flex: propertiesExpanded ? "0 1 auto" : "0 0 36px",
          maxHeight: propertiesMaxHeight,
          minHeight: "36px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <SidebarPanelHeader
          title="PROPERTIES"
          isExpanded={propertiesExpanded}
          onToggle={() => setPropertiesExpanded((prev) => !prev)}
          action={
            onClose ? (
              <OdIconButton
                name="close"
                aria-label="Hide Inspector"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                onKeyDown={(e) => {
                  e.stopPropagation();
                }}
                ghost
                style={{ width: "24px", height: "24px" }}
              />
            ) : undefined
          }
        />
        {/* Inspector container: always mounted to preserve state */}
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            display: propertiesExpanded ? "block" : "none",
          }}
        >
          <Inspector {...inspectorProps} />
        </div>
      </div>

      {/* 2. Draggable Horizontal Sash Separator */}
      {propertiesExpanded && layersExpanded && (
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="horizontal"
          aria-label="Resize panels"
          className={isDragging ? "od-sidebar-sash od-sidebar-sash--active" : "od-sidebar-sash"}
          onPointerDown={handleSashPointerDown}
          onPointerMove={handleSashPointerMove}
          onPointerUp={handleSashPointerUp}
          onKeyDown={handleSashKeyDown}
        />
      )}

      {/* 3. LAYERS Panel (auto-hugs content via flex: 0 1 auto; scrolls when constrained) */}
      <div
        style={{
          flex: layersExpanded ? "0 1 auto" : "0 0 36px",
          minHeight: "36px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderTop:
            propertiesExpanded && layersExpanded
              ? "none"
              : "var(--od-border-width) solid var(--od-border)",
        }}
      >
        <SidebarPanelHeader
          title="LAYERS"
          isExpanded={layersExpanded}
          onToggle={() => setLayersExpanded((prev) => !prev)}
          action={<OdBadge>{treeNodes.length}</OdBadge>}
          style={{
            borderBottom: layersExpanded ? "var(--od-border-width) solid var(--od-border)" : "none",
          }}
        />
        {/* TreeOutline container: always mounted to preserve state */}
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflow: "hidden",
            display: layersExpanded ? "flex" : "none",
          }}
        >
          <TreeOutline
            treeNodes={treeNodes}
            selectedShapeId={selectedShapeId}
            selectShape={selectShape}
            showHeader={false}
            isScopedToRoot={isScopedToRoot}
            activeRootTitle={activeRootTitle}
            onClearScope={onClearScope}
          />
        </div>
      </div>

      {/* 4. EXPORT Panel */}
      {doc && (
        <div
          style={{
            flex: "0 0 auto",
            borderTop: "var(--od-border-width) solid var(--od-border)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SidebarPanelHeader
            title="EXPORT"
            isExpanded={exportExpanded}
            onToggle={() => setExportExpanded((prev) => !prev)}
            style={{
              borderBottom: exportExpanded
                ? "var(--od-border-width) solid var(--od-border)"
                : "none",
            }}
          />
          {exportExpanded && (
            <ExportPanel
              doc={doc}
              targetRootShape={inspectorProps.rootShape}
              selectedShapes={inspectorProps.selectedShapes}
              onOpenAdvancedModal={onOpenAdvancedModal}
            />
          )}
        </div>
      )}
    </aside>
  );
}
