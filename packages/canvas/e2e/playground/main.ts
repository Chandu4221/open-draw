import { CanvasEditor } from '@open-draw/canvas';

const container = document.getElementById('canvas-container') as HTMLElement;
const editor = new CanvasEditor();
editor.mount(container);

// Expose debug handle in dev
(window as unknown as { __od_debug__: { editor: CanvasEditor } }).__od_debug__ = { editor };

// Hook toolbar buttons for dev convenience
document.getElementById('btn-pan')?.addEventListener('click', () => {
  editor.pan(100, 100);
});
document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
  editor.zoomAroundPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 1.5);
});
document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
  editor.zoomAroundPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, 0.75);
});
document.getElementById('btn-reset')?.addEventListener('click', () => {
  editor.setCamera({ x: 0, y: 0, zoom: 1 });
});
