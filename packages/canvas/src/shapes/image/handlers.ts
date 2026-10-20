import type { CanvasEditor } from '../../editor.js';
import { containFit } from './geometry.js';

export function createImageFromDataUrl(
  editor: CanvasEditor,
  dataUrl: string,
  pagePoint: { x: number; y: number },
  natural: { w: number; h: number }
): void {
  const fit = containFit(natural, { width: 300, height: 300 });
  editor.store.transact(() => {
    editor.createShape({
      type: 'image',
      x: pagePoint.x,
      y: pagePoint.y,
      props: {
        width: fit.width,
        height: fit.height,
        src: dataUrl,
        natural,
      },
    });
  });
}

export function attachImageTransferHandlers(container: HTMLElement, editor: CanvasEditor): () => void {
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const containerRect = container.getBoundingClientRect();
    const screenPt = { x: e.clientX - containerRect.left, y: e.clientY - containerRect.top };
    const pagePt = editor.camera.screenToPage(screenPt);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        createImageFromDataUrl(editor, dataUrl, pagePt, {
          w: img.naturalWidth || 200,
          h: img.naturalHeight || 200,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const onPaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (!file) continue;

        const centerScreen = { x: container.clientWidth / 2, y: container.clientHeight / 2 };
        const pagePt = editor.camera.screenToPage(centerScreen);

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const img = new Image();
          img.onload = () => {
            createImageFromDataUrl(editor, dataUrl, pagePt, {
              w: img.naturalWidth || 200,
              h: img.naturalHeight || 200,
            });
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  container.addEventListener('dragover', onDragOver);
  container.addEventListener('drop', onDrop);
  window.addEventListener('paste', onPaste);

  return () => {
    container.removeEventListener('dragover', onDragOver);
    container.removeEventListener('drop', onDrop);
    window.removeEventListener('paste', onPaste);
  };
}
