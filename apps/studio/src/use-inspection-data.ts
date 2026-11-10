import type {
  DeviceType,
  DesignStyleId,
  PlatformId,
  PlatformProfile,
  SemanticConflict,
  SemanticDefinition,
  ShapeId,
  StyleId,
  RootRole,
  ThemePalette,
} from "@open-draw/contracts";
import { isRootId, ROOT_ID, ROOT_ROLES, STYLE_PROFILES } from "@open-draw/contracts";
import type { Document, Shape } from "@open-draw/document";
import { PLATFORM_PROFILES } from "@open-draw/profiles";
import {
  computeSemanticConflict,
  resolveRootDarkMode,
  resolveRootDesignStyle,
  resolveRootPlatform,
  resolveRootRole,
  resolveRootShape,
  resolveRootStyle,
  resolveRootTheme,
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
}

export function computeInspectionData(
  doc: Document,
  selectedShapeId: ShapeId | null,
  activeDeviceType: DeviceType | undefined,
): InspectionData {
  const selectedShape = selectedShapeId !== null ? doc.shapes[selectedShapeId] : undefined;
  const rootShape = selectedShape
    ? resolveRootShape(doc, selectedShape.id)
    : Object.values(doc.shapes).find((s) => isRootId(s.parentId) && s.meta.platform !== undefined);
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
  const treeNodes = walkSemanticTree(doc, ROOT_ID, activeProfile, activeDeviceType);

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
  };
}

export const useInspectionData = computeInspectionData;
