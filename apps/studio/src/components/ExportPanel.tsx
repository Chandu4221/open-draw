import React, { useMemo, useState } from "react";
import { isRootId, type ShapeId } from "@open-draw/contracts";
import type { Document, Shape } from "@open-draw/document";
import { resolveRootShape } from "@open-draw/semantics";
import { OdButton, OdIcon } from "@open-draw/ui";
import {
  exportDocumentJson,
  exportDocumentMarkdown,
  exportDocumentPng,
  exportDocumentSvg,
} from "../document-io";
import { getPngBytes } from "../png-export";
import { downloadZip } from "../zip-export";
import {
  buildExportZipFiles,
  CHECKBOX_LABEL_STYLE,
  resolveExportTargetTitle,
} from "./export-panel-helpers";

export interface ExportPanelProps {
  readonly doc: Document;
  readonly targetRootShape?: Shape | undefined;
  readonly selectedShapes?: readonly Shape[] | undefined;
  readonly onOpenAdvancedModal?: (() => void) | undefined;
}

export function ExportPanel(props: ExportPanelProps): React.JSX.Element {
  const { doc, targetRootShape, selectedShapes, onOpenAdvancedModal } = props;

  const [selectedFormats, setSelectedFormats] = useState({
    markdown: true,
    png: true,
    json: false,
    svg: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // 1. Multi-selected root containers
  const selectedRootContainers = useMemo(() => {
    if (!selectedShapes || selectedShapes.length <= 1) return [];
    const rootIds = new Set<ShapeId>();
    const roots: Shape[] = [];
    for (const shape of selectedShapes) {
      const root = resolveRootShape(doc, shape.id);
      if (root && !rootIds.has(root.id)) {
        rootIds.add(root.id);
        roots.push(root);
      }
    }
    return roots;
  }, [doc, selectedShapes]);

  // 2. All root containers on the canvas
  const canvasRootContainers = useMemo(
    () => Object.values(doc.shapes).filter((s) => isRootId(s.parentId)),
    [doc.shapes],
  );

  const isMultiContainerSelected = selectedRootContainers.length >= 2;
  const isEntireCanvas = !targetRootShape && !isMultiContainerSelected;

  const containerCount = isMultiContainerSelected
    ? selectedRootContainers.length
    : targetRootShape
      ? 1
      : canvasRootContainers.length;

  const targetTitle = resolveExportTargetTitle(
    doc,
    isMultiContainerSelected,
    selectedRootContainers,
    targetRootShape,
  );

  const selectedFormatsCount =
    (selectedFormats.markdown ? 1 : 0) +
    (selectedFormats.png ? 1 : 0) +
    (selectedFormats.json ? 1 : 0) +
    (selectedFormats.svg ? 1 : 0);

  // Count suffix: shown only when 2 or more containers are selected or when exporting entire canvas with >= 2 containers
  const showContainerCount = isMultiContainerSelected || (isEntireCanvas && containerCount >= 2);
  const countSuffix = showContainerCount ? ` (${containerCount})` : "";

  const getFormatPrefix = (): string => {
    if (selectedFormatsCount > 1 || isMultiContainerSelected) return "Export ZIP";
    if (selectedFormats.markdown) return "Export Markdown";
    if (selectedFormats.json) return "Export JSON";
    if (selectedFormats.png) return "Export PNG";
    return "Export SVG";
  };

  const getButtonLabel = (): string => {
    if (selectedFormatsCount === 0) return "Select at least 1 format";
    const prefix = getFormatPrefix();
    return `${prefix}${countSuffix} · ${targetTitle}`;
  };

  const handleExport = async () => {
    if (selectedFormatsCount === 0 || isExporting) return;
    setIsExporting(true);
    try {
      const rootId = !isMultiContainerSelected ? targetRootShape?.id : undefined;
      const baseSlug =
        (targetTitle || "export")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "export";

      if (!isMultiContainerSelected && selectedFormatsCount === 1) {
        if (selectedFormats.markdown) exportDocumentMarkdown(doc, { rootId });
        else if (selectedFormats.json) exportDocumentJson(doc, undefined, rootId);
        else if (selectedFormats.svg) exportDocumentSvg(doc, { rootId, includeAnnotations: true });
        else if (selectedFormats.png) exportDocumentPng(doc, { rootId, includeAnnotations: true });
        return;
      }

      let pngBytesMap: Map<ShapeId | undefined, Uint8Array> | undefined;
      let pngFailedCount = 0;
      if (selectedFormats.png) {
        pngBytesMap = new Map();
        if (isMultiContainerSelected) {
          for (const root of selectedRootContainers) {
            const pngData = await getPngBytes(doc, root.id);
            if (pngData) {
              pngBytesMap.set(root.id, pngData);
            } else {
              pngFailedCount++;
            }
          }
        } else {
          const pngData = await getPngBytes(doc, rootId);
          if (pngData) {
            pngBytesMap.set(rootId, pngData);
          } else {
            pngFailedCount++;
          }
        }
      }

      const files = buildExportZipFiles({
        doc,
        isMultiContainerSelected,
        selectedRootContainers,
        targetRootShape,
        selectedFormats,
        baseSlug,
        pngBytesMap,
      });

      if (pngFailedCount > 0) {
        setExportError(
          `PNG rendering failed (${pngFailedCount} file${pngFailedCount > 1 ? "s" : ""} omitted)`,
        );
      } else {
        setExportError(null);
      }

      if (files.length > 0) {
        downloadZip(`${baseSlug}-export.zip`, files);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--od-8)",
        padding: "var(--od-8) var(--od-12)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--od-8)",
        }}
      >
        <label style={CHECKBOX_LABEL_STYLE}>
          <input
            type="checkbox"
            checked={selectedFormats.markdown}
            onChange={(e) => {
              setExportError(null);
              setSelectedFormats((prev) => ({ ...prev, markdown: e.target.checked }));
            }}
          />
          <span>Markdown</span>
        </label>
        <label style={CHECKBOX_LABEL_STYLE}>
          <input
            type="checkbox"
            checked={selectedFormats.json}
            onChange={(e) => {
              setExportError(null);
              setSelectedFormats((prev) => ({ ...prev, json: e.target.checked }));
            }}
          />
          <span>JSON</span>
        </label>
        <label style={CHECKBOX_LABEL_STYLE}>
          <input
            type="checkbox"
            checked={selectedFormats.png}
            onChange={(e) => {
              setExportError(null);
              setSelectedFormats((prev) => ({ ...prev, png: e.target.checked }));
            }}
          />
          <span>PNG</span>
        </label>
        <label style={CHECKBOX_LABEL_STYLE}>
          <input
            type="checkbox"
            checked={selectedFormats.svg}
            onChange={(e) => {
              setExportError(null);
              setSelectedFormats((prev) => ({ ...prev, svg: e.target.checked }));
            }}
          />
          <span>SVG</span>
        </label>
      </div>

      <OdButton
        variant="primary"
        disabled={selectedFormatsCount === 0 || isExporting}
        onClick={handleExport}
        style={{
          width: "100%",
          justifyContent: "center",
          gap: "var(--od-6)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        <OdIcon name="export" size={14} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{getButtonLabel()}</span>
      </OdButton>

      {exportError && (
        <span
          role="alert"
          style={{
            fontSize: "var(--od-text-xs)",
            color: "var(--od-danger)",
            textAlign: "center",
          }}
        >
          {exportError}
        </span>
      )}

      {onOpenAdvancedModal && (
        <OdButton
          variant="ghost"
          onClick={onOpenAdvancedModal}
          style={{
            width: "100%",
            justifyContent: "center",
            fontSize: "var(--od-text-xs)",
            color: "var(--od-text-secondary)",
            height: "24px",
            padding: 0,
          }}
        >
          Preview & Options...
        </OdButton>
      )}
    </div>
  );
}
