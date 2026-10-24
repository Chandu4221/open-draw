import type { CanvasEditor } from '@open-draw/canvas';
import { compile } from '@open-draw/markdown';

export class PlaygroundCompileModal {
  private readonly modalEl: HTMLElement;
  private readonly overlayEl: HTMLElement;
  private readonly textareaEl: HTMLTextAreaElement;
  private readonly legendCheckbox: HTMLInputElement;
  private readonly designDirCheckbox: HTMLInputElement;
  private readonly responsiveCheckbox: HTMLInputElement;
  private readonly directiveSelect: HTMLSelectElement;
  private readonly scopeSelect: HTMLSelectElement;
  private readonly copyBtn: HTMLButtonElement;
  private readonly editor: CanvasEditor;
  private readonly getMetaProvider?: () => Record<string, unknown>;

  constructor(editor: CanvasEditor, getMetaProvider?: () => Record<string, unknown>) {
    this.editor = editor;
    this.getMetaProvider = getMetaProvider;

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
      overflow: hidden; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
          <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; background: #e0f2fe; color: #0369a1;">v1.1 spec</span>
        </h3>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Deterministic, byte-stable specification for AI prompts &amp; developers</p>
      </div>
      <button id="od-compile-close-x" aria-label="Close" style="background: none; border: none; cursor: pointer; color: #64748b; font-size: 20px; padding: 4px 8px; border-radius: 6px;">✕</button>
    `;

    // Options Bar
    const optionsBar = document.createElement('div');
    optionsBar.style.cssText = `
      display: flex; align-items: center; gap: 16px; padding: 10px 20px;
      border-bottom: 1px solid #e2e8f0; background: #ffffff; font-size: 13px; color: #334155; flex-wrap: wrap;
    `;

    const makeCheckbox = (label: string, checked = true) => {
      const lbl = document.createElement('label');
      lbl.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = checked;
      input.setAttribute('aria-label', `Include ${label}`);
      lbl.appendChild(input);
      lbl.appendChild(document.createTextNode(label));
      return { lbl, input };
    };

    const legendItem = makeCheckbox('Element Legend');
    this.legendCheckbox = legendItem.input;

    const designDirItem = makeCheckbox('Design Direction');
    this.designDirCheckbox = designDirItem.input;

    const responsiveItem = makeCheckbox('Responsive');
    this.responsiveCheckbox = responsiveItem.input;

    const controlsBox = document.createElement('div');
    controlsBox.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-left: auto;';

    const makeSelect = (id: string, label: string, html: string) => {
      const box = document.createElement('div');
      box.style.cssText = 'display: flex; align-items: center; gap: 4px;';
      const lbl = document.createElement('label');
      lbl.htmlFor = id;
      lbl.textContent = label;
      lbl.style.cssText = 'font-size: 12px; font-weight: 600; color: #64748b;';
      const sel = document.createElement('select');
      sel.id = id;
      sel.setAttribute('aria-label', label.replace(':', ''));
      sel.style.cssText = 'padding: 3px 6px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px; background: #ffffff; color: #0f172a; cursor: pointer;';
      sel.innerHTML = html;
      box.appendChild(lbl);
      box.appendChild(sel);
      return { box, sel };
    };

    const scopeItem = makeSelect('od-compile-scope', 'Scope:', `
      <option value="auto">Auto (Detect)</option>
      <option value="component">Component</option>
      <option value="page">Page</option>
    `);
    this.scopeSelect = scopeItem.sel;

    const dirItem = makeSelect('od-compile-directive', 'Directive:', `
      <option value="strict-fidelity">Strict Fidelity</option>
      <option value="creative-allowed">Creative Allowed</option>
    `);
    this.directiveSelect = dirItem.sel;

    controlsBox.appendChild(scopeItem.box);
    controlsBox.appendChild(dirItem.box);

    optionsBar.appendChild(legendItem.lbl);
    optionsBar.appendChild(designDirItem.lbl);
    optionsBar.appendChild(responsiveItem.lbl);
    optionsBar.appendChild(controlsBox);

    // Textarea Body
    const bodyContainer = document.createElement('div');
    bodyContainer.style.cssText = `
      flex: 1; display: flex; flex-direction: column;
      min-height: 400px; height: 50vh; padding: 14px 20px;
      background: #f8fafc; overflow: hidden;
    `;

    this.textareaEl = document.createElement('textarea');
    this.textareaEl.id = 'od-compile-output';
    this.textareaEl.setAttribute('aria-label', 'Compiled Markdown Output');
    this.textareaEl.readOnly = true;
    this.textareaEl.style.cssText = `
      flex: 1; width: 100%; min-height: 380px; box-sizing: border-box; resize: none;
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

    const downloadBtn = document.createElement('button');
    downloadBtn.id = 'od-compile-download-btn';
    downloadBtn.setAttribute('aria-label', 'Download .md');
    downloadBtn.style.cssText = `
      padding: 8px 14px; border-radius: 8px; border: 1px solid #cbd5e1;
      background: #ffffff; color: #334155; font-weight: 600; font-size: 13px; cursor: pointer;
    `;
    downloadBtn.textContent = 'Download .md';
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([this.textareaEl.value], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'opendraw-spec.md';
      a.click();
      URL.revokeObjectURL(url);
    });

    btnGroup.appendChild(closeBtn);
    btnGroup.appendChild(downloadBtn);
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

    // Defense-in-depth: stop bubbling to canvas container or document
    this.overlayEl.addEventListener('pointerdown', (e) => {
      if (e.target === this.overlayEl) this.close();
      e.stopPropagation();
    });
    this.overlayEl.addEventListener('mousedown', (e) => e.stopPropagation());
    this.overlayEl.addEventListener('wheel', (e) => e.stopPropagation());

    this.modalEl.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.modalEl.addEventListener('mousedown', (e) => e.stopPropagation());
    this.modalEl.addEventListener('wheel', (e) => e.stopPropagation());
    this.modalEl.addEventListener('keydown', (e) => e.stopPropagation());

    // Event listeners
    [this.legendCheckbox, this.designDirCheckbox, this.responsiveCheckbox, this.directiveSelect, this.scopeSelect]
      .forEach(el => el.addEventListener('change', () => this.refreshContent()));

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

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlayEl.style.display === 'flex') {
        e.stopPropagation();
        e.preventDefault();
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

  public destroy(): void {
    this.overlayEl.remove();
  }

  private refreshContent(): void {
    const baseSnap = this.editor.getSnapshot();
    const meta = this.getMetaProvider ? this.getMetaProvider() : (baseSnap.meta ?? {});
    const snapshot = {
      ...baseSnap,
      meta: { ...(baseSnap.meta ?? {}), ...meta },
    };
    const markdown = compile(snapshot, {
      legend: this.legendCheckbox.checked,
      designDirection: this.designDirCheckbox.checked,
      responsive: this.responsiveCheckbox.checked,
      directive: this.directiveSelect.value as 'strict-fidelity' | 'creative-allowed',
      scope: this.scopeSelect.value as 'auto' | 'component' | 'page',
      platform: (meta['platform'] as string) || undefined,
    });
    this.textareaEl.value = markdown;

    const stats = this.modalEl.querySelector('#od-compile-stats');
    if (stats) {
      stats.textContent = `${snapshot.shapes.length} elements · ${markdown.length} characters · ${markdown.split('\n').length} lines`;
    }
  }
}
