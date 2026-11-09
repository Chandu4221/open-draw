// Mutates a shape record in-place for a single command and returns inverse commands.
// Used by applyTransaction to batch N commands in O(N) without intermediate Document copying (R-018, ADR-0002 D8).
import type { ShapeId } from "@open-draw/contracts";
import { isRootId, isRootRole, SHAPE_KINDS } from "@open-draw/contracts";
import { COMMANDS } from "./commands/registry";
import type { Command } from "./commands";
import type { CreateShape } from "./commands/create-shape";
import type { ShapeScaleHook } from "./commands/set-shape-bounding-box";
import { deriveDeterministicId } from "./commands/duplicate-shapes";
import type { Document } from "./document";
import { SCHEMA_VERSION } from "./document";
import { DocumentError } from "./errors";
import { pruneSelectedDescendants } from "./reparent";
import { isCustomShape, type Shape } from "./shape";
import { subtreeOf } from "./tree";
import { parseThemePalette } from "./meta-validation";
import { parseShape } from "./validation";
import { parseColor, parseStrokeWidth } from "./style-validation";

export function applyCommandToMap(
  shapes: Record<ShapeId, Shape>,
  command: Command,
  scaleHook?: ShapeScaleHook,
): readonly Command[] {
  switch (command.type) {
    case COMMANDS.createShape: {
      const shape = parseShape(command.shape);
      if (shapes[shape.id] !== undefined) {
        throw new DocumentError("duplicateShapeId", `shape already exists: ${shape.id}`);
      }
      shapes[shape.id] = shape;
      return [{ type: COMMANDS.deleteShape, id: shape.id as ShapeId }];
    }

    case COMMANDS.deleteShape: {
      const dummyDoc = { schema: { version: SCHEMA_VERSION }, shapes } as unknown as Document;
      const subtree = subtreeOf(dummyDoc, command.id);
      for (const shape of subtree) {
        delete shapes[shape.id];
      }
      return [...subtree].reverse().map((shape): CreateShape => ({
        type: COMMANDS.createShape,
        shape,
      }));
    }

    case COMMANDS.setShapeLabel: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      const previousLabel = shape.label === undefined ? null : shape.label;
      const nextShape = { ...shape };
      if (command.label === null) {
        delete nextShape.label;
      } else {
        nextShape.label = command.label;
      }
      shapes[command.id] = nextShape as Shape;
      return [{ type: COMMANDS.setShapeLabel, id: command.id, label: previousLabel }];
    }

    case COMMANDS.reparentShape: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      const previousParentId = shape.parentId;
      const previousBoundingBox = shape.boundingBox;
      const targetParentId = command.parentId ?? command.parent!;
      shapes[command.id] = { ...shape, parentId: targetParentId, boundingBox: command.boundingBox };
      return [
        {
          type: COMMANDS.reparentShape,
          id: command.id,
          parentId: previousParentId,
          boundingBox: previousBoundingBox,
        },
      ];
    }

    case COMMANDS.moveShapes: {
      for (const id of command.ids) {
        if (shapes[id] === undefined) {
          throw new DocumentError("shapeNotFound", `no shape with id: ${id}`);
        }
      }
      for (const id of command.ids) {
        const shape = shapes[id]!;
        shapes[id] = {
          ...shape,
          boundingBox: {
            ...shape.boundingBox,
            x: shape.boundingBox.x + command.dx,
            y: shape.boundingBox.y + command.dy,
          },
        };
      }
      return [{ type: COMMANDS.moveShapes, ids: command.ids, dx: -command.dx, dy: -command.dy }];
    }

    case COMMANDS.setShapeBoundingBox: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      if (
        !Number.isFinite(command.boundingBox.x) ||
        !Number.isFinite(command.boundingBox.y) ||
        !Number.isFinite(command.boundingBox.width) ||
        !Number.isFinite(command.boundingBox.height) ||
        command.boundingBox.width <= 0 ||
        command.boundingBox.height <= 0
      ) {
        throw new DocumentError(
          "invalidShape",
          "boundingBox must have finite position and positive dimensions",
        );
      }
      const previousBox = shape.boundingBox;

      let nextShape: Shape;
      if (scaleHook !== undefined) {
        nextShape = scaleHook(shape, previousBox, command.boundingBox);
      } else if (!isCustomShape(shape)) {
        switch (shape.kind) {
          case SHAPE_KINDS.line: {
            const scaleX =
              previousBox.width === 0 ? 1 : command.boundingBox.width / previousBox.width;
            const scaleY =
              previousBox.height === 0 ? 1 : command.boundingBox.height / previousBox.height;
            nextShape = {
              ...shape,
              boundingBox: command.boundingBox,
              start: { x: shape.start.x * scaleX, y: shape.start.y * scaleY },
              end: { x: shape.end.x * scaleX, y: shape.end.y * scaleY },
            };
            break;
          }
          case SHAPE_KINDS.penPath: {
            const scaleX =
              previousBox.width === 0 ? 1 : command.boundingBox.width / previousBox.width;
            const scaleY =
              previousBox.height === 0 ? 1 : command.boundingBox.height / previousBox.height;
            nextShape = {
              ...shape,
              boundingBox: command.boundingBox,
              points: shape.points.map((p) => ({ x: p.x * scaleX, y: p.y * scaleY })),
            };
            break;
          }
          default: {
            nextShape = { ...shape, boundingBox: command.boundingBox };
            break;
          }
        }
      } else {
        nextShape = { ...shape, boundingBox: command.boundingBox };
      }

      shapes[command.id] = nextShape;
      return [{ type: COMMANDS.setShapeBoundingBox, id: command.id, boundingBox: previousBox }];
    }

    case COMMANDS.setShapeSemantic: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      const previousSemantic = shape.meta.semantic ?? null;
      const nextMeta = { ...shape.meta };
      if (command.semantic === null) {
        delete nextMeta.semantic;
      } else {
        nextMeta.semantic = command.semantic;
      }
      shapes[command.id] = { ...shape, meta: nextMeta };
      return [{ type: COMMANDS.setShapeSemantic, id: command.id, semantic: previousSemantic }];
    }

    case COMMANDS.setRootPlatform: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      if (!isRootId(shape.parentId)) {
        throw new DocumentError("invalidShape", "platform may only be set on root shapes (R-026)");
      }
      const previousPlatform = shape.meta.platform ?? null;
      const nextMeta = { ...shape.meta };
      if (command.platform === null) {
        delete nextMeta.platform;
      } else {
        nextMeta.platform = command.platform;
      }
      shapes[command.id] = { ...shape, meta: nextMeta };
      return [{ type: COMMANDS.setRootPlatform, id: command.id, platform: previousPlatform }];
    }

    case COMMANDS.setRootStyle: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      if (!isRootId(shape.parentId)) {
        throw new DocumentError(
          "invalidShape",
          "style profile may only be set on root shapes (R-026)",
        );
      }
      const previousStyle = shape.meta.style ?? null;
      const nextMeta = { ...shape.meta };
      if (command.style === null) {
        delete nextMeta.style;
      } else {
        nextMeta.style = command.style;
      }
      shapes[command.id] = { ...shape, meta: nextMeta };
      return [{ type: COMMANDS.setRootStyle, id: command.id, style: previousStyle }];
    }

    case COMMANDS.setRootDesignStyle: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      if (!isRootId(shape.parentId)) {
        throw new DocumentError(
          "invalidShape",
          "design style may only be set on root shapes (R-026)",
        );
      }
      const previousDesignStyle = shape.meta.designStyle ?? null;
      const nextMeta = { ...shape.meta };
      if (command.designStyle === null) {
        delete nextMeta.designStyle;
      } else {
        nextMeta.designStyle = command.designStyle;
      }
      shapes[command.id] = { ...shape, meta: nextMeta };
      return [
        { type: COMMANDS.setRootDesignStyle, id: command.id, designStyle: previousDesignStyle },
      ];
    }

    case COMMANDS.setRootRole: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      if (!isRootId(shape.parentId)) {
        throw new DocumentError("invalidShape", "role may only be set on root shapes (R-026)");
      }
      if (command.role !== null && !isRootRole(command.role)) {
        throw new DocumentError("invalidCommand", `unknown role: ${String(command.role)}`);
      }
      const previousRole = shape.meta.role ?? null;
      const nextMeta = { ...shape.meta };
      if (command.role === null) {
        delete nextMeta.role;
      } else {
        nextMeta.role = command.role;
      }
      shapes[command.id] = { ...shape, meta: nextMeta };
      return [{ type: COMMANDS.setRootRole, id: command.id, role: previousRole }];
    }

    case COMMANDS.setRootTheme: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      if (!isRootId(shape.parentId)) {
        throw new DocumentError("invalidShape", "theme may only be set on root shapes (R-026)");
      }
      const previousTheme = shape.meta.theme ?? null;
      const nextMeta = { ...shape.meta };
      if (command.theme === null) {
        delete nextMeta.theme;
      } else {
        nextMeta.theme = parseThemePalette(command.theme);
      }
      shapes[command.id] = { ...shape, meta: nextMeta };
      return [{ type: COMMANDS.setRootTheme, id: command.id, theme: previousTheme }];
    }

    case COMMANDS.setRootDarkMode: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      if (!isRootId(shape.parentId)) {
        throw new DocumentError("invalidShape", "darkMode may only be set on root shapes (R-026)");
      }
      const previousDarkMode = shape.meta.darkMode ?? null;
      const nextMeta = { ...shape.meta };
      if (command.darkMode === null || command.darkMode === false) {
        delete nextMeta.darkMode;
      } else {
        nextMeta.darkMode = true;
      }
      shapes[command.id] = { ...shape, meta: nextMeta };
      return [{ type: COMMANDS.setRootDarkMode, id: command.id, darkMode: previousDarkMode }];
    }

    case COMMANDS.setShapeHiddenOn: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      const previousHiddenOn = shape.meta.hiddenOn ?? null;
      const nextMeta = { ...shape.meta };
      if (command.hiddenOn === null || command.hiddenOn.length === 0) {
        delete nextMeta.hiddenOn;
      } else {
        nextMeta.hiddenOn = command.hiddenOn;
      }
      shapes[command.id] = { ...shape, meta: nextMeta };
      return [{ type: COMMANDS.setShapeHiddenOn, id: command.id, hiddenOn: previousHiddenOn }];
    }

    case COMMANDS.setShapeOrder: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      const previousOrder = shape.meta.order[command.deviceType] ?? null;
      const nextOrder = { ...shape.meta.order };
      if (command.order === null) {
        delete nextOrder[command.deviceType];
      } else {
        nextOrder[command.deviceType] = command.order;
      }
      shapes[command.id] = { ...shape, meta: { ...shape.meta, order: nextOrder } };
      return [
        {
          type: COMMANDS.setShapeOrder,
          id: command.id,
          deviceType: command.deviceType,
          order: previousOrder,
        },
      ];
    }

    case COMMANDS.setShapeStyle: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      const previousFill = shape.fill === undefined ? null : shape.fill;
      const previousStroke = shape.stroke === undefined ? null : shape.stroke;
      const previousStrokeWidth = shape.strokeWidth === undefined ? null : shape.strokeWidth;
      const nextShapeData: Record<string, unknown> = { ...shape };
      if (command.fill !== undefined) {
        if (command.fill === null) {
          delete nextShapeData.fill;
        } else {
          nextShapeData.fill = parseColor(command.fill, "fill");
        }
      }
      if (command.stroke !== undefined) {
        if (command.stroke === null) {
          delete nextShapeData.stroke;
        } else {
          nextShapeData.stroke = parseColor(command.stroke, "stroke");
        }
      }
      if (command.strokeWidth !== undefined) {
        if (command.strokeWidth === null) {
          delete nextShapeData.strokeWidth;
        } else {
          nextShapeData.strokeWidth = parseStrokeWidth(command.strokeWidth);
        }
      }

      shapes[command.id] = nextShapeData as unknown as Shape;
      return [
        {
          type: COMMANDS.setShapeStyle,
          id: command.id,
          fill: previousFill,
          stroke: previousStroke,
          strokeWidth: previousStrokeWidth,
        },
      ];
    }

    case COMMANDS.setShapeContent: {
      const shape = shapes[command.id];
      if (shape === undefined) {
        throw new DocumentError("shapeNotFound", `no shape with id: ${command.id}`);
      }
      const previousContent = shape.content === undefined ? null : shape.content;
      const nextShape = { ...shape };
      if (command.content === null) {
        delete nextShape.content;
      } else {
        nextShape.content = command.content;
      }
      shapes[command.id] = nextShape as Shape;
      return [{ type: COMMANDS.setShapeContent, id: command.id, content: previousContent }];
    }

    case COMMANDS.duplicateShapes: {
      const dummyDoc = { schema: { version: SCHEMA_VERSION }, shapes } as unknown as Document;
      for (const id of command.ids) {
        if (shapes[id] === undefined) {
          throw new DocumentError("shapeNotFound", `no shape with id: ${id}`);
        }
      }
      const topLevelIds = pruneSelectedDescendants(dummyDoc, command.ids);
      if (topLevelIds.length === 0) {
        return [];
      }
      const dx = command.dx ?? 20;
      const dy = command.dy ?? 20;
      const shapesToClone: Shape[] = [];
      const topLevelSet = new Set<ShapeId>(topLevelIds);
      for (const topId of topLevelIds) {
        shapesToClone.push(...subtreeOf(dummyDoc, topId));
      }
      const idMap = new Map<ShapeId, ShapeId>();
      const usedIds = new Set<ShapeId>();
      for (const shape of shapesToClone) {
        const mapped = command.newShapeIds?.[shape.id];
        const newId = mapped ?? deriveDeterministicId(dummyDoc, usedIds, shape.id);
        idMap.set(shape.id, newId);
        usedIds.add(newId);
      }
      for (const shape of shapesToClone) {
        const isTopLevel = topLevelSet.has(shape.id);
        const newId = idMap.get(shape.id)!;
        const newParentId = isTopLevel
          ? shape.parentId
          : (idMap.get(shape.parentId) ?? shape.parentId);
        const newBoundingBox = isTopLevel
          ? {
              ...shape.boundingBox,
              x: shape.boundingBox.x + dx,
              y: shape.boundingBox.y + dy,
            }
          : shape.boundingBox;
        shapes[newId] = {
          ...shape,
          id: newId,
          parentId: newParentId,
          boundingBox: newBoundingBox,
        };
      }
      return topLevelIds.map((oldId) => ({
        type: COMMANDS.deleteShape,
        id: idMap.get(oldId)!,
      }));
    }
  }
}
