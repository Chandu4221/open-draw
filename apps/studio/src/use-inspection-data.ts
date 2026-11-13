import type { DeviceType, Document, Shape, ShapeId } from "@open-draw/canvas";
import { ROOT_ID } from "@open-draw/canvas";
import type {
  DesignStyleId,
  PlatformId,
  PlatformProfile,
  StyleId,
  ThemePalette,
} from "@open-draw/profiles";
import { PLATFORM_PROFILES, STYLE_PROFILES } from "@open-draw/profiles";
import type { RootRole, SemanticConflict, SemanticDefinition } from "@open-draw/semantics";
import { ROOT_ROLES } from "@open-draw/semantics";
import {
  computeSemanticConflict,
  resolveRootDarkMode,
  resolveRootDesignStyle,
  resolveRootPlatform,
  resolveRootRole,
  resolveRootShape,
  resolveRootStyle,
  resolveRootTheme,
  resolveShapeDisplayName,
  walkSemanticTree,
  type SemanticTreeNode,
} from "@open-draw/semantics";

export interface InspectionData {
  readonly selectedShape: Shape | undefined;
  readonly rootShape: Shape | undefined;
  readonly rootPlatform: PlatformId | undefined;
  readonly rootStyle: StyleId;
  readonly rootDesignStyle: DesignStyleId | undefined;
  readonly rootRole: RootRole;
  readonly rootTheme: ThemePalette | undefined;
  readonly rootDarkMode: boolean;
  readonly activeProfile: PlatformProfile | undefined;
  readonly conflict: SemanticConflict | undefined;
  readonly semanticDef: SemanticDefinition | undefined;
  readonly semanticProps: Record<string, string | number | boolean>;
  readonly treeNodes: readonly SemanticTreeNode[];
  readonly isScopedToRoot: boolean;
  readonly activeRootTitle: string | undefined;
}

export function computeInspectionData(
  doc: Document,
  selectedShapeId: ShapeId | null,
  activeDeviceType: DeviceType | undefined,
): InspectionData {
  const selectedShape = selectedShapeId !== null ? doc.shapes[selectedShapeId] : undefined;
  const rootShape = selectedShape ? resolveRootShape(doc, selectedShape.id) : undefined;
  const rootPlatform = rootShape ? resolveRootPlatform(doc, rootShape.id) : undefined;
  const rootStyle = rootShape ? resolveRootStyle(doc, rootShape.id) : STYLE_PROFILES.minimal;
  const rootDesignStyle = rootShape ? resolveRootDesignStyle(doc, rootShape.id) : undefined;
  const rootRole = rootShape ? resolveRootRole(doc, rootShape.id) : ROOT_ROLES.screen;
  const rootTheme = rootShape ? resolveRootTheme(doc, rootShape.id) : undefined;
  const rootDarkMode = rootShape ? resolveRootDarkMode(doc, rootShape.id) : false;
  const activeProfile = rootPlatform !== undefined ? PLATFORM_PROFILES[rootPlatform] : undefined;
  const conflict = selectedShape
    ? computeSemanticConflict(doc, selectedShape, activeProfile)
    : undefined;
  const semanticDef =
    selectedShape?.meta.semantic !== undefined && activeProfile !== undefined
      ? activeProfile.semantics[selectedShape.meta.semantic.id]
      : undefined;
  const semanticProps = selectedShape?.meta.semantic?.properties ?? {};

  const isScopedToRoot = rootShape !== undefined;
  const activeRootTitle = rootShape ? resolveShapeDisplayName(rootShape, activeProfile) : undefined;

  const treeNodes = isScopedToRoot
    ? walkSemanticTree(doc, rootShape.id, activeProfile, activeDeviceType)
    : walkSemanticTree(doc, ROOT_ID, undefined, activeDeviceType).filter(
        (node) => node.depth === 0,
      );

  return {
    selectedShape,
    rootShape,
    rootPlatform,
    rootStyle,
    rootDesignStyle,
    rootRole,
    rootTheme,
    rootDarkMode,
    activeProfile,
    conflict,
    semanticDef,
    semanticProps,
    treeNodes,
    isScopedToRoot,
    activeRootTitle,
  };
}

export const useInspectionData = computeInspectionData;
