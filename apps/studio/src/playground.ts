import { CanvasEditor } from '@open-draw/canvas';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  downloadBlob,
  exportSnapshotJSON,
  importSnapshotJSON,
} from './storage.js';
import { initPopups } from './popups.js';

const container = document.getElementById('canvas-container') as HTMLElement;
const editor = new CanvasEditor();
editor.mount(container);

// Initialize popups for shapes and color palette
const popups = initPopups(editor, (color: string) => {
  const selected = editor.selection;
  if (selected.length === 0) return;
  editor.store.transact(() => {
    for (const id of selected) {
      const s = editor.store.getShape(id);
      if (s) {
        editor.updateShape(id, { props: { ...s.props, fill: color } });
      }
    }
  });
});

// Auto-load snapshot from localStorage or seed initial wireframe demo
const saved = loadFromLocalStorage();
if (saved && saved.shapes && saved.shapes.length > 0) {
  editor.loadSnapshot(saved);
} else {
  seedStarterWireframe(editor);
}

// Auto-save on every store change
editor.store.listen(() => {
  saveToLocalStorage(editor.getSnapshot());
  updateUIState();
});
editor.selectionManager.subscribe(() => {
  updateUIState();
  const selected = editor.selection;
  if (selected.length === 1) {
    const s = editor.store.getShape(selected[0]!);
    if (s && typeof s.props['fill'] === 'string') {
      popups.setCurrentColor(s.props['fill']);
    }
  }
});

const TOOL_ICONS: Record<string, string> = {
  rect: 'crop_square',
  ellipse: 'circle',
  arrow: 'arrow_right_alt',
  frame: 'crop_free',
  note: 'sticky_note_2',
  text: 'title',
  ink: 'draw',
  eraser: 'ink_eraser',
};

// Sync active tool UI
function setActiveTool(toolId: string): void {
  editor.setTool(toolId);
  const toolActiveShape = document.getElementById('tool-active-shape');
  const activeShapeIcon = document.getElementById('active-shape-icon');
  if (toolId !== 'select' && TOOL_ICONS[toolId] && toolActiveShape && activeShapeIcon) {
    toolActiveShape.setAttribute('data-tool', toolId);
    activeShapeIcon.textContent = TOOL_ICONS[toolId]!;
    toolActiveShape.title = `${toolId.charAt(0).toUpperCase() + toolId.slice(1)} (${toolId.charAt(0).toUpperCase()})`;
  }
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tool') === toolId);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-popup-tool]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-popup-tool') === toolId);
  });
}

document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tool = btn.getAttribute('data-tool');
    if (tool) setActiveTool(tool);
  });
});

// Action buttons
document.getElementById('btn-undo')?.addEventListener('click', () => editor.undo());
document.getElementById('btn-redo')?.addEventListener('click', () => editor.redo());
document.getElementById('btn-delete')?.addEventListener('click', () => {
  const sel = [...editor.selection];
  if (sel.length === 0) return;
  editor.store.transact(() => {
    for (const id of sel) editor.deleteShape(id);
  });
});

// Zoom Controls
document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
  editor.zoomAroundPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 1.25);
  updateZoomLabel();
});
document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
  editor.zoomAroundPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 0.8);
  updateZoomLabel();
});
document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
  editor.setCamera({ x: 0, y: 0, zoom: 1 });
  updateZoomLabel();
});

function updateZoomLabel(): void {
  const label = document.getElementById('zoom-label');
  if (label) {
    label.textContent = `${Math.round(editor.camera.camera.zoom * 100)}%`; // EXEMPTION: UI display percentage formatting only
  }
}

// Export / Import
document.getElementById('btn-export-png')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-export-png') as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  try {
    const blob = await editor.exportPNG({ scale: 2 });
    downloadBlob(blob, `opendraw-${Date.now()}.png`);
  } catch (err) {
    console.error('PNG export failed:', err);
    alert('Failed to export PNG');
  } finally {
    if (btn) btn.disabled = false;
  }
});

document.getElementById('btn-export-json')?.addEventListener('click', () => {
  exportSnapshotJSON(editor.getSnapshot(), `opendraw-${Date.now()}.json`);
});

const fileInput = document.getElementById('file-import-json') as HTMLInputElement | null;
document.getElementById('btn-import-json')?.addEventListener('click', () => fileInput?.click());
fileInput?.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    const snap = await importSnapshotJSON(file);
    editor.loadSnapshot(snap);
    fileInput.value = '';
  } catch (err) {
    alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
  }
});

document.getElementById('btn-clear')?.addEventListener('click', () => {
  if (confirm('Clear all shapes from canvas?')) {
    editor.loadSnapshot({ version: 1, shapes: [], camera: { x: 0, y: 0, zoom: 1 } });
    clearLocalStorage();
  }
});

// Update stats / state
function updateUIState(): void {
  const tool = editor.getTool();
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tool') === tool);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-popup-tool]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-popup-tool') === tool);
  });
  const shapeCount = document.getElementById('shape-count');
  if (shapeCount) {
    shapeCount.textContent = `${editor.store.listShapes().length} shapes`;
  }
  updateZoomLabel();
}

// Global hotkeys (when not in text editing mode)
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  const key = e.key.toLowerCase();
  const toolMap: Record<string, string> = {
    v: 'select',
    r: 'rect',
    o: 'ellipse',
    t: 'text',
    f: 'frame',
    n: 'note',
    a: 'arrow',
    p: 'ink',
    e: 'eraser',
  };
  if (toolMap[key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
    setActiveTool(toolMap[key]!);
  }
});

function seedStarterWireframe(ed: CanvasEditor): void {
  ed.store.transact(() => {
    const frame = ed.createShape({
      type: 'frame',
      x: 140,
      y: 90,
      props: { width: 620, height: 320, label: 'Hero Frame' },
    });
    ed.createShape({
      type: 'text',
      x: 180,
      y: 170,
      props: { text: 'Welcome to OpenDraw', width: 420, height: 44, fontSize: 32, fontWeight: 'bold', fill: '#0f172a' },
      meta: { parent: frame.id },
    });
    ed.createShape({
      type: 'text',
      x: 180,
      y: 230,
      props: { text: 'Infinite SVG canvas engine for wireframing, diagrams, and sketches.', width: 520, height: 26, fontSize: 16, fill: '#64748b' },
      meta: { parent: frame.id },
    });
    ed.createShape({
      type: 'text',
      x: 180,
      y: 280,
      props: { text: 'Pick a tool from the dock below and drag across the canvas to draw.', width: 500, height: 22, fontSize: 13, fill: '#94a3b8' },
      meta: { parent: frame.id },
    });
  });
}
