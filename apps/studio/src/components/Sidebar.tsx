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

  const sidebarRef = useRef<HTMLElement | null>(null);

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
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* 1. PROPERTIES Panel */}
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "column",
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
            display: propertiesExpanded ? "block" : "none",
          }}
        >
          <Inspector {...inspectorProps} />
        </div>
      </div>

      {/* 2. LAYERS Panel */}
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          flexDirection: "column",
          borderTop: "var(--od-border-width) solid var(--od-border)",
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
            display: layersExpanded ? "block" : "none",
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

      {/* 3. EXPORT Panel */}
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
