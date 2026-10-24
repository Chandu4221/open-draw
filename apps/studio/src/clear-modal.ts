import type { CanvasEditor } from '@open-draw/canvas';

export class ClearCanvasModal {
  private editor: CanvasEditor;
  private overlayEl: HTMLElement;
  private modalEl: HTMLElement;
  private onConfirm: () => void;

  constructor(editor: CanvasEditor, onConfirm: () => void, mountTarget: HTMLElement = document.body) {
    this.editor = editor;
    this.onConfirm = onConfirm;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'od-clear-overlay';
    this.overlayEl.style.cssText = `
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      z-index: 100; display: none; align-items: center; justify-content: center;
    `;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'od-clear-modal';
    this.modalEl.setAttribute('role', 'dialog');
    this.modalEl.setAttribute('aria-label', 'Confirm New Canvas');
    this.modalEl.style.cssText = `
      width: 90vw; max-width: 440px; background: #ffffff;
      border-radius: 12px; padding: 20px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.25);
      border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Stop bubbling
    this.overlayEl.addEventListener('pointerdown', (e) => {
      if (e.target === this.overlayEl) this.close();
      e.stopPropagation();
    });
    this.overlayEl.addEventListener('mousedown', (e) => e.stopPropagation());
    this.modalEl.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.modalEl.addEventListener('mousedown', (e) => e.stopPropagation());

    const title = document.createElement('h3');
    title.textContent = 'Start New Canvas?';
    title.style.cssText = 'margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #0f172a;';

    const desc = document.createElement('p');
    desc.textContent = 'This will clear all elements from the canvas and reset your local working document.';
    desc.style.cssText = 'margin: 0 0 20px 0; font-size: 13px; color: #64748b; line-height: 1.4;';

    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'od-clear-cancel-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #ffffff; color: #334155; font-weight: 600; font-size: 13px; cursor: pointer;';
    cancelBtn.addEventListener('click', () => this.close());

    const confirmBtn = document.createElement('button');
    confirmBtn.id = 'od-clear-confirm-btn';
    confirmBtn.textContent = 'Clear Canvas';
    confirmBtn.style.cssText = 'padding: 8px 14px; border-radius: 6px; border: 1px solid #ef4444; background: #ef4444; color: #ffffff; font-weight: 600; font-size: 13px; cursor: pointer;';
    confirmBtn.addEventListener('click', () => {
      this.onConfirm();
      this.close();
    });

    btnGroup.appendChild(cancelBtn);
    btnGroup.appendChild(confirmBtn);

    this.modalEl.appendChild(title);
    this.modalEl.appendChild(desc);
    this.modalEl.appendChild(btnGroup);
    this.overlayEl.appendChild(this.modalEl);
    mountTarget.appendChild(this.overlayEl);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlayEl.style.display === 'flex') {
        e.stopPropagation();
        e.preventDefault();
        this.close();
      }
    });
  }

  open(): void {
    this.overlayEl.style.display = 'flex';
  }

  close(): void {
    this.overlayEl.style.display = 'none';
  }

  destroy(): void {
    this.overlayEl.remove();
  }
}
