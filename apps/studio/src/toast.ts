export interface ToastOptions {
  readonly actionText?: string;
  readonly onAction?: () => void;
  readonly durationMs?: number;
}

export class ToastManager {
  private containerEl: HTMLElement;
  private activeToast: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(mountTarget: HTMLElement = document.body) {
    this.containerEl = document.createElement('div');
    this.containerEl.id = 'od-toast-container';
    this.containerEl.setAttribute('role', 'status');
    this.containerEl.setAttribute('aria-live', 'polite');
    this.containerEl.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    `;
    mountTarget.appendChild(this.containerEl);
  }

  show(message: string, options: ToastOptions = {}): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.activeToast) {
      this.activeToast.remove();
      this.activeToast = null;
    }

    const toast = document.createElement('div');
    toast.className = 'od-toast';
    toast.style.cssText = `
      pointer-events: auto;
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 16px;
      border-radius: 10px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: od-toast-in 0.2s ease-out;
    `;

    toast.addEventListener('pointerdown', (e) => e.stopPropagation());
    toast.addEventListener('mousedown', (e) => e.stopPropagation());

    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    if (options.actionText && options.onAction) {
      const btn = document.createElement('button');
      btn.className = 'od-toast-action';
      btn.textContent = options.actionText;
      btn.setAttribute('aria-label', options.actionText);
      btn.style.cssText = `
        background: #3b82f6;
        color: #ffffff;
        border: none;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      `;
      btn.addEventListener('click', () => {
        options.onAction?.();
        this.dismiss();
      });
      toast.appendChild(btn);
    }

    this.activeToast = toast;
    this.containerEl.appendChild(toast);

    const duration = options.durationMs ?? 4000;
    this.timer = setTimeout(() => this.dismiss(), duration);
  }

  dismiss(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.activeToast) {
      this.activeToast.remove();
      this.activeToast = null;
    }
  }

  destroy(): void {
    this.dismiss();
    this.containerEl.remove();
  }
}
