import type { Bounds, Point, ShapeId, ShapeRecord } from '@open-draw/schema';
import type { CanvasEditor } from '../editor.js';
import type { ShapeRegistry } from '../registry.js';
import type { CommandId } from './keymap.js';

let lastNudgeTime = 0;
let lastNudgeDir = '';
let clipboard: ShapeRecord[] = [];

function computeUnionBounds(shapes: readonly ShapeRecord[], registry: ShapeRegistry): Bounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const s of shapes) {
    if (s.hidden) continue;
    const def = registry.get(s.type);
    if (!def) continue;
    const b = def.geometry.bounds(s);
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getViewportSize(editor: CanvasEditor): { width: number; height: number } {
  const container = editor.getShapeWrapper(editor.selection[0] ?? '')?.closest('.od-canvas-root') ?? null;
  const rect = container?.getBoundingClientRect();
  return { width: rect?.width || 800, height: rect?.height || 600 };
}

export function nudge(editor: CanvasEditor, dir: 'up' | 'down' | 'left' | 'right', amount: number): void {
  const sel = editor.selection;
  if (sel.length === 0) return;

  const screenDelta: Point = {
    x: dir === 'left' ? -amount : dir === 'right' ? amount : 0,
    y: dir === 'up' ? -amount : dir === 'down' ? amount : 0,
  };

  const p0 = editor.camera.screenToPage({ x: 0, y: 0 });
  const p1 = editor.camera.screenToPage(screenDelta);
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;

  const now = Date.now();
  const shouldMerge = dir === lastNudgeDir && now - lastNudgeTime < 500;
  lastNudgeTime = now;
  lastNudgeDir = dir;

  editor.store.transact(() => {
    for (const id of sel) {
      const s = editor.store.getShape(id);
      if (s) {
        editor.store.updateShape(id, { x: s.x + dx, y: s.y + dy });
      }
    }
  });

  if (shouldMerge) {
    editor.store.mergeLastHistoryEntry();
  }
}

export function deleteSelection(editor: CanvasEditor): void {
  const sel = [...editor.selection];
  if (sel.length === 0) return;

  editor.store.transact(() => {
    for (const id of sel) {
      editor.deleteShape(id);
    }
  });
  editor.clearSelection();
}

export function duplicateSelection(editor: CanvasEditor): void {
  const sel = editor.selection;
  if (sel.length === 0) return;

  const newIds: ShapeId[] = [];
  editor.store.transact(() => {
    for (const id of sel) {
      const s = editor.store.getShape(id);
      if (s) {
        const copy = editor.createShape({
          type: s.type,
          x: s.x + 10,
          y: s.y + 10,
          rotation: s.rotation,
          props: s.props,
          meta: s.meta,
        });
        newIds.push(copy.id);
      }
    }
  });
  editor.setSelection(newIds);
}

export function clipboardCopy(editor: CanvasEditor): void {
  clipboard = editor.selection
    .map((id) => editor.store.getShape(id))
    .filter(Boolean)
    .map((s) => JSON.parse(JSON.stringify(s)));
}

export function clipboardCut(editor: CanvasEditor): void {
  clipboardCopy(editor);
  deleteSelection(editor);
}

export function clipboardPaste(editor: CanvasEditor): void {
  if (clipboard.length === 0) return;

  const newIds: ShapeId[] = [];
  editor.store.transact(() => {
    for (const s of clipboard) {
      const copy = editor.createShape({
        type: s.type,
        x: s.x + 10,
        y: s.y + 10,
        rotation: s.rotation,
        props: s.props,
        meta: s.meta,
      });
      newIds.push(copy.id);
    }
  });
  editor.setSelection(newIds);
}

export function zoomFit(editor: CanvasEditor): void {
  const bounds = computeUnionBounds(editor.store.listShapes(), editor.registry);
  if (bounds) {
    editor.camera.fitToBounds(bounds, getViewportSize(editor));
  }
}

export function zoomSelection(editor: CanvasEditor): void {
  const shapes = editor.selection.map((id) => editor.store.getShape(id)).filter(Boolean) as ShapeRecord[];
  const bounds = computeUnionBounds(shapes, editor.registry);
  if (bounds) {
    editor.camera.fitToBounds(bounds, getViewportSize(editor));
  }
}

export function executeCommand(command: CommandId, editor: CanvasEditor): void {
  if (command === 'select-all') return editor.selectAll();
  if (command === 'clear-selection') return editor.clearSelection();
  if (command === 'cycle-forward') return editor.cycleSelection('forward');
  if (command === 'cycle-backward') return editor.cycleSelection('backward');
  if (command === 'nudge-up') return nudge(editor, 'up', 1);
  if (command === 'nudge-down') return nudge(editor, 'down', 1);
  if (command === 'nudge-left') return nudge(editor, 'left', 1);
  if (command === 'nudge-right') return nudge(editor, 'right', 1);
  if (command === 'nudge-up-big') return nudge(editor, 'up', 10);
  if (command === 'nudge-down-big') return nudge(editor, 'down', 10);
  if (command === 'nudge-left-big') return nudge(editor, 'left', 10);
  if (command === 'nudge-right-big') return nudge(editor, 'right', 10);
  if (command === 'delete') return deleteSelection(editor);
  if (command === 'duplicate') return duplicateSelection(editor);
  if (command === 'clipboard-copy') return clipboardCopy(editor);
  if (command === 'clipboard-cut') return clipboardCut(editor);
  if (command === 'clipboard-paste') return clipboardPaste(editor);
  if (command === 'undo') return void editor.undo();
  if (command === 'redo') return void editor.redo();
  if (command === 'zoom-reset') return void editor.camera.reset();
  if (command === 'zoom-fit') return zoomFit(editor);
  if (command === 'zoom-selection') return zoomSelection(editor);
  if (command === 'bring-to-front') return editor.store.reorderShapes('front', editor.selection);
  if (command === 'send-to-back') return editor.store.reorderShapes('back', editor.selection);
  if (command === 'bring-forward') return editor.store.reorderShapes('forward', editor.selection);
  if (command === 'send-backward') return editor.store.reorderShapes('backward', editor.selection);
  if (command.startsWith('tool-')) return editor.setTool(command.slice(5));
}
