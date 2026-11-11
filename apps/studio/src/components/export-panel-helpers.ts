import { PLATFORMS, ROOT_ROLES, type ShapeId } from "@open-draw/contracts";
import type { Document, Shape } from "@open-draw/document";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import { resolveRootPlatform, resolveShapeDisplayName } from "@open-draw/semantics";
import { generateExportJson, generateExportMarkdown, generateExportSvg } from "../document-io";
import type { ZipFileInput } from "../zip-export";

export const CHECKBOX_LABEL_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--od-6)",
  cursor: "pointer",
  fontSize: "var(--od-text-xs)",
  color: "var(--od-text)",
  userSelect: "none",
};

export interface ExportFormatsSelection {
  readonly markdown: boolean;
  readonly json: boolean;
  readonly svg: boolean;
  readonly png: boolean;
}

export function resolveExportTargetTitle(
  doc: Document,
  isMultiContainerSelected: boolean,
  selectedRootContainers: readonly Shape[],
  targetRootShape: Shape | undefined,
): string {
  if (isMultiContainerSelected) {
    const allComponents = selectedRootContainers.every((r) => r.meta.role === ROOT_ROLES.component);
    if (allComponents) return "Selected Components";

    const allWeb = selectedRootContainers.every((r) => r.meta.platform === PLATFORMS.web);
    if (allWeb) return "Selected Pages";

    return "Selected Screens";
  }

  if (targetRootShape) {
    const targetPlatform = resolveRootPlatform(doc, targetRootShape.id);
    const targetProfile = targetPlatform ? PLATFORM_PROFILES[targetPlatform] : undefined;
    return resolveShapeDisplayName(targetRootShape, targetProfile);
  }

  return "Entire Canvas";
}

export interface BuildZipOptions {
  readonly doc: Document;
  readonly isMultiContainerSelected: boolean;
  readonly selectedRootContainers: readonly Shape[];
  readonly targetRootShape?: Shape | undefined;
  readonly selectedFormats: ExportFormatsSelection;
  readonly baseSlug: string;
  readonly pngBytesMap?: ReadonlyMap<ShapeId | undefined, Uint8Array> | undefined;
}

/**
 * Builds array of zip file entries for export, scoping each selected container
 * to its own subtree when multiple containers are selected (R-008, R-016, R-026).
 */
export function buildExportZipFiles(options: BuildZipOptions): readonly ZipFileInput[] {
  const {
    doc,
    isMultiContainerSelected,
    selectedRootContainers,
    targetRootShape,
    selectedFormats,
    baseSlug,
    pngBytesMap,
  } = options;

  const files: ZipFileInput[] = [];

  if (isMultiContainerSelected && selectedRootContainers.length >= 2) {
    const seenSlugs = new Map<string, number>();

    for (const root of selectedRootContainers) {
      const rootPlatform = resolveRootPlatform(doc, root.id);
      const rootProfile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
      const title = resolveShapeDisplayName(root, rootProfile) || root.label || root.id;
      const rawSlug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") || "container";

      const count = seenSlugs.get(rawSlug) ?? 0;
      seenSlugs.set(rawSlug, count + 1);
      const slug = count === 0 ? rawSlug : `${rawSlug}-${count + 1}`;

      if (selectedFormats.markdown) {
        files.push({
          name: `${slug}.md`,
          data: generateExportMarkdown(doc, { rootId: root.id }),
        });
      }
      if (selectedFormats.json) {
        files.push({
          name: `${slug}.json`,
          data: generateExportJson(doc, undefined, root.id),
        });
      }
      if (selectedFormats.svg) {
        files.push({
          name: `${slug}.svg`,
          data: generateExportSvg(doc, { rootId: root.id, includeAnnotations: true }),
        });
      }
      if (selectedFormats.png) {
        const pngData = pngBytesMap?.get(root.id);
        if (pngData) {
          files.push({
            name: `${slug}.png`,
            data: pngData,
          });
        }
      }
    }
    return files;
  }

  // Single container or Entire Canvas
  const rootId = targetRootShape?.id;

  if (selectedFormats.markdown) {
    files.push({
      name: `${baseSlug}.md`,
      data: generateExportMarkdown(doc, { rootId }),
    });
  }
  if (selectedFormats.json) {
    files.push({
      name: `${baseSlug}.json`,
      data: generateExportJson(doc, undefined, rootId),
    });
  }
  if (selectedFormats.svg) {
    files.push({
      name: `${baseSlug}.svg`,
      data: generateExportSvg(doc, { rootId, includeAnnotations: true }),
    });
  }
  if (selectedFormats.png) {
    const pngData = pngBytesMap?.get(rootId);
    if (pngData) {
      files.push({
        name: `${baseSlug}.png`,
        data: pngData,
      });
    }
  }

  return files;
}
