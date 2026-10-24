import { CanvasEditor } from '@open-draw/canvas';
import { inferType } from '@open-draw/semantics';
import { AutosaveManager } from './persistence.js';
import { ToastManager } from './toast.js';
import { ClearCanvasModal } from './clear-modal.js';
import { ChipController, type ChipMode } from './chips.js';
import { StudioInspector } from './inspector/inspector.js';
import { PlaygroundCompileModal } from './playground-compile-modal.js';
import { initPopups } from './popups.js';
import { downloadBlob, exportSnapshotJSON, importSnapshotJSON } from './storage.js';

const container = document.getElementById('canvas-container') as HTMLElement;
const editor = new CanvasEditor();
editor.mount(container);

const autosave = new AutosaveManager(300);
const toast = new ToastManager(document.body);
const chips = new ChipController(editor);
const clearModal = new ClearCanvasModal(editor, () => {
  editor.loadSnapshot({ version: 1, shapes: [], camera: { x: 0, y: 0, zoom: 1 } });
  autosave.clear();
  updateUIState();
});

const inspector = new StudioInspector(editor, document.body, () => {
  autosave.schedule(() => ({ ...editor.getSnapshot(), meta: inspector.docSettings.getState() }));
});

const compileModal = new PlaygroundCompileModal(editor, () => inspector.docSettings.getState());

const popups = initPopups(editor, (color: string) => {
  const selected = editor.selection;
  if (selected.length === 0) return;
  editor.store.transact(() => {
    for (const id of selected) {
      const s = editor.store.getShape(id);
      if (s) editor.updateShape(id, { props: { ...s.props, fill: color } });
    }
  });
});

// Load document
const saved = autosave.load();
if (saved && saved.shapes && saved.shapes.length > 0) {
  editor.loadSnapshot(saved);
  if (saved.meta) {
    inspector.docSettings.setState({
      platform: (saved.meta['platform'] as string) || 'web',
      style: (saved.meta['style'] as string) || 'neubrutalism',
    });
  }
} else {
  seedStarterWireframe(editor);
}
updateUIState();

// Auto-save on store change + smart defaults
editor.store.listen((diff) => {
  if (diff?.created && diff.created.size > 0) {
    for (const id of diff.created) {
      const shape = editor.store.getShape(id);
      const sem = shape?.meta?.semantic as Record<string, unknown> | undefined;
      if (shape && !sem?.['type']) {
        const inferred = inferType(shape, editor.getSnapshot());
        if (inferred?.tier === 'strong') {
          editor.store.updateShape(id, {
            meta: {
              ...shape.meta,
              semantic: {
                ...((shape.meta?.semantic as Record<string, unknown>) ?? {}),
                type: inferred.type,
                inferredType: inferred.type,
              },
            },
          });
          editor.store.mergeLastHistoryEntry();
        }
      }
    }
  }
  autosave.schedule(() => ({ ...editor.getSnapshot(), meta: inspector.docSettings.getState() }));
  updateUIState();
});

editor.selectionManager.subscribe(() => {
  updateUIState();
  const selected = editor.selection;
  if (selected.length === 1) {
    const s = editor.store.getShape(selected[0]!);
    if (s && typeof s.props['fill'] === 'string') popups.setCurrentColor(s.props['fill']);
  }
});

const TOOL_ICONS: Record<string, string> = {
  rect: 'crop_square', ellipse: 'circle', arrow: 'arrow_right_alt',
  frame: 'crop_free', note: 'sticky_note_2', text: 'title', ink: 'draw', eraser: 'ink_eraser',
};

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

// Chips mode toggle
document.querySelectorAll<HTMLButtonElement>('[data-chip-mode]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const mode = btn.getAttribute('data-chip-mode') as ChipMode;
    if (mode) {
      chips.setMode(mode);
      document.querySelectorAll<HTMLButtonElement>('[data-chip-mode]').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-chip-mode') === mode);
      });
    }
  });
});

// Action buttons
document.getElementById('btn-undo')?.addEventListener('click', () => editor.undo());
document.getElementById('btn-redo')?.addEventListener('click', () => editor.redo());
document.getElementById('btn-delete')?.addEventListener('click', () => {
  const sel = [...editor.selection];
  if (sel.length === 0) return;
  const framesOrGroups = sel.filter((id) => {
    const s = editor.store.getShape(id);
    return s && (s.type === 'frame' || s.type === 'group'); // EXEMPTION: UI cascade deletion warning check for frame/group container shapes
  });
  editor.store.transact(() => {
    for (const id of sel) editor.deleteShape(id);
  });
  if (framesOrGroups.length > 0) {
    const label = framesOrGroups[0] ? (editor.store.getShape(framesOrGroups[0])?.props['label'] as string || 'Frame') : 'Frame';
    toast.show(`${label} deleted (${sel.length} shapes) — Undo`, {
      actionText: 'Undo',
      onAction: () => editor.undo(),
    });
  }
});

// Zoom Controls
document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
  editor.zoomAroundPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 1.25);
});
document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
  editor.zoomAroundPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 0.8);
});
document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
  editor.setCamera({ x: 0, y: 0, zoom: 1 });
});

function updateZoomLabel(): void {
  const label = document.getElementById('zoom-label');
  if (label) label.textContent = `${Math.round(editor.camera.camera.zoom * 100)}%`; // EXEMPTION: UI display percentage formatting only
}
editor.camera.subscribe(() => updateZoomLabel());

// Export / Import / Compile / Clear
document.getElementById('btn-compile-spec')?.addEventListener('click', () => compileModal.open());
document.getElementById('btn-clear')?.addEventListener('click', () => clearModal.open());

document.getElementById('btn-export-png')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-export-png') as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  try {
    const blob = await editor.exportPNG({ scale: 2 });
    downloadBlob(blob, `opendraw-${Date.now()}.png`);
  } catch (err) {
    console.error('PNG export failed:', err);
  } finally {
    if (btn) btn.disabled = false;
  }
});

document.getElementById('btn-export-json')?.addEventListener('click', () => {
  const snapshot = { ...editor.getSnapshot(), meta: inspector.docSettings.getState() };
  exportSnapshotJSON(snapshot, `opendraw-${Date.now()}.json`);
});

const fileInput = document.getElementById('file-import-json') as HTMLInputElement | null;
document.getElementById('btn-import-json')?.addEventListener('click', () => fileInput?.click());
fileInput?.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    const snap = await importSnapshotJSON(file);
    editor.loadSnapshot(snap);
    if (snap.meta) {
      inspector.docSettings.setState({
        platform: (snap.meta['platform'] as string) || 'web',
        style: (snap.meta['style'] as string) || 'neubrutalism',
      });
    }
    fileInput.value = '';
  } catch (err) {
    alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
  }
});

function updateUIState(): void {
  const tool = editor.getTool();
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tool') === tool);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-popup-tool]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-popup-tool') === tool);
  });
  const shapeCount = document.getElementById('shape-count');
  if (shapeCount) shapeCount.textContent = `${editor.store.listShapes().length} shapes`;
  updateZoomLabel();
}

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
  const key = e.key.toLowerCase();
  const toolMap: Record<string, string> = {
    v: 'select', r: 'rect', o: 'ellipse', t: 'text',
    f: 'frame', n: 'note', a: 'arrow', p: 'ink', e: 'eraser',
  };
  if (toolMap[key] && !e.ctrlKey && !e.metaKey && !e.altKey) setActiveTool(toolMap[key]!);
});

function seedStarterWireframe(ed: CanvasEditor): void {
  ed.store.transact(() => {
    const frame = ed.createShape({
      type: 'frame', x: 140, y: 90,
      props: { width: 620, height: 320, label: 'Hero Frame' },
    });
    ed.createShape({
      type: 'text', x: 180, y: 170,
      props: { text: 'Welcome to OpenDraw Studio', width: 420, height: 44, fontSize: 32, fontWeight: 'bold', fill: '#0f172a' },
      meta: { parent: frame.id },
    });
    ed.createShape({
      type: 'text', x: 180, y: 230,
      props: { text: 'Infinite SVG canvas engine with full semantic metadata and real-time inspector.', width: 520, height: 26, fontSize: 16, fill: '#64748b' },
      meta: { parent: frame.id },
    });
  });
}

// Dev handles
(window as unknown as { __od_debug__: Record<string, unknown> }).__od_debug__ = {
  editor, inspector, chips, autosave, toast, clearModal, compileModal,
  setChipMode: (mode: ChipMode) => chips.setMode(mode),
};
