import type { CanvasEditor } from '@open-draw/canvas';
import { compile } from '@open-draw/markdown';

export class PlaygroundCompileModal {
  private readonly modalEl: HTMLElement;
  private readonly overlayEl: HTMLElement;
  private readonly textareaEl: HTMLTextAreaElement;
  private readonly legendCheckbox: HTMLInputElement;
  private readonly designDirCheckbox: HTMLInputElement;
  private readonly copyBtn: HTMLButtonElement;
  private readonly editor: CanvasEditor;

  constructor(editor: CanvasEditor) {
    this.editor = editor;

    // Overlay backdrop
    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'od-compile-overlay';
    this.overlayEl.style.cssText = `
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      z-index: 100; display: none; align-items: center; justify-content: center;
    `;

    // Modal dialog
    this.modalEl = document.createElement('div');
    this.modalEl.id = 'od-compile-modal';
    this.modalEl.setAttribute('role', 'dialog');
    this.modalEl.setAttribute('aria-label', 'Compiled Markdown Specification');
    this.modalEl.style.cssText = `
      width: 90vw; max-width: 820px; max-height: 85vh;
      background: #ffffff; border-radius: 14px;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.25);
      border: 1px solid #e2e8f0; display: flex; flex-direction: column;
      overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
    `;
    header.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px;">
          <span>Compiled Markdown Specification</span>
          <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: #e0f2fe; color: #0369a1;">v1 spec</span>
        </h3>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Deterministic, byte-stable specification for AI prompts &amp; developers</p>
      </div>
      <button id="od-compile-close-x" style="background: none; border: none; cursor: pointer; color: #64748b; font-size: 20px; padding: 4px 8px; border-radius: 6px;">✕</button>
    `;

    // Options Bar
    const optionsBar = document.createElement('div');
    optionsBar.style.cssText = `
      display: flex; align-items: center; gap: 20px; padding: 10px 20px;
      border-bottom: 1px solid #e2e8f0; background: #ffffff; font-size: 13px; color: #334155;
    `;

    const legendLabel = document.createElement('label');
    legendLabel.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;';
    this.legendCheckbox = document.createElement('input');
    this.legendCheckbox.type = 'checkbox';
    this.legendCheckbox.checked = true;
    legendLabel.appendChild(this.legendCheckbox);
    legendLabel.appendChild(document.createTextNode('Include Element Legend'));

    const designDirLabel = document.createElement('label');
    designDirLabel.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;';
    this.designDirCheckbox = document.createElement('input');
    this.designDirCheckbox.type = 'checkbox';
    this.designDirCheckbox.checked = true;
    designDirLabel.appendChild(this.designDirCheckbox);
    designDirLabel.appendChild(document.createTextNode('Include Design Direction'));

    optionsBar.appendChild(legendLabel);
    optionsBar.appendChild(designDirLabel);

    // Textarea Body
    const bodyContainer = document.createElement('div');
    bodyContainer.style.cssText = 'flex: 1; min-height: 320px; max-height: 55vh; padding: 14px 20px; background: #f8fafc; overflow: hidden;';

    this.textareaEl = document.createElement('textarea');
    this.textareaEl.id = 'od-compile-output';
    this.textareaEl.readOnly = true;
    this.textareaEl.style.cssText = `
      width: 100%; height: 100%; box-sizing: border-box; resize: none;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px; line-height: 1.5; padding: 12px;
      border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff;
      color: #0f172a; white-space: pre; overflow: auto;
    `;
    bodyContainer.appendChild(this.textareaEl);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; border-top: 1px solid #e2e8f0; background: #ffffff;
    `;

    const statsSpan = document.createElement('span');
    statsSpan.id = 'od-compile-stats';
    statsSpan.style.cssText = 'font-size: 12px; color: #64748b;';

    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display: flex; align-items: center; gap: 10px;';

    this.copyBtn = document.createElement('button');
    this.copyBtn.id = 'od-compile-copy-btn';
    this.copyBtn.style.cssText = `
      padding: 8px 16px; border-radius: 8px; border: 1px solid #2563eb;
      background: #2563eb; color: #ffffff; font-weight: 600; font-size: 13px;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
    `;
    this.copyBtn.textContent = 'Copy Specification';

    const closeBtn = document.createElement('button');
    closeBtn.id = 'od-compile-close-btn';
    closeBtn.style.cssText = `
      padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: #ffffff; color: #334155; font-weight: 600; font-size: 13px; cursor: pointer;
    `;
    closeBtn.textContent = 'Close';

    btnGroup.appendChild(closeBtn);
    btnGroup.appendChild(this.copyBtn);

    footer.appendChild(statsSpan);
    footer.appendChild(btnGroup);

    // Assemble
    this.modalEl.appendChild(header);
    this.modalEl.appendChild(optionsBar);
    this.modalEl.appendChild(bodyContainer);
    this.modalEl.appendChild(footer);
    this.overlayEl.appendChild(this.modalEl);
    document.body.appendChild(this.overlayEl);

    // Event listeners
    this.legendCheckbox.addEventListener('change', () => this.refreshContent());
    this.designDirCheckbox.addEventListener('change', () => this.refreshContent());

    this.copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(this.textareaEl.value);
        this.copyBtn.textContent = 'Copied to Clipboard!';
        this.copyBtn.style.background = '#16a34a';
        this.copyBtn.style.borderColor = '#16a34a';
        setTimeout(() => {
          this.copyBtn.textContent = 'Copy Specification';
          this.copyBtn.style.background = '#2563eb';
          this.copyBtn.style.borderColor = '#2563eb';
        }, 2000);
      } catch {
        this.textareaEl.select();
      }
    });

    closeBtn.addEventListener('click', () => this.close());
    header.querySelector('#od-compile-close-x')?.addEventListener('click', () => this.close());
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlayEl.style.display === 'flex') {
        this.close();
      }
    });
  }

  public open(): void {
    this.refreshContent();
    this.overlayEl.style.display = 'flex';
  }

  public close(): void {
    this.overlayEl.style.display = 'none';
  }

  private refreshContent(): void {
    const snapshot = this.editor.getSnapshot();
    const markdown = compile(snapshot, {
      legend: this.legendCheckbox.checked,
      designDirection: this.designDirCheckbox.checked,
    });
    this.textareaEl.value = markdown;

    const stats = this.modalEl.querySelector('#od-compile-stats');
    if (stats) {
      stats.textContent = `${snapshot.shapes.length} elements · ${markdown.length} characters · ${markdown.split('\n').length} lines`;
    }
  }
}
