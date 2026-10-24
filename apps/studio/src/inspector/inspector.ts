import type { CanvasEditor } from '@open-draw/canvas';
import { SEMANTIC_TYPES } from '@open-draw/semantics';
import { SingleFieldsController } from './single-fields.js';
import { ParentSelectController } from './parent-select.js';
import { MemberListController } from './member-list.js';
import { DocSettingsController, type DocSettingsState } from './doc-settings.js';

export class StudioInspector {
  private editor: CanvasEditor;
  private rootEl: HTMLElement;
  private headerEl: HTMLElement;
  private headerTitleEl: HTMLElement;
  private idBadgeEl: HTMLElement;
  private emptyStateEl: HTMLElement;
  private singleContainer: HTMLElement;
  private singleFields: SingleFieldsController;
  private parentGroup: HTMLElement;
  private parentController: ParentSelectController;
  private memberController: MemberListController;
  private multiGroup: HTMLElement;
  private multiCountEl: HTMLElement;
  private multiTypeSelect: HTMLSelectElement;
  readonly docSettings: DocSettingsController;

  constructor(
    editor: CanvasEditor,
    mountTarget: HTMLElement = document.body,
    onDocSettingsChange?: (state: DocSettingsState) => void
  ) {
    this.editor = editor;

    this.rootEl = document.createElement('div');
    this.rootEl.id = 'studio-inspector';
    this.rootEl.className = 'od-studio-inspector';
    this.rootEl.setAttribute('role', 'region');
    this.rootEl.setAttribute('aria-label', 'Shape Inspector');
    this.rootEl.style.cssText = `
      position: fixed; top: 72px; right: 20px; width: 260px;
      max-height: calc(100vh - 100px); overflow-y: auto;
      background: #ffffff;
      border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); z-index: 55;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px; color: #0f172a;
    `;

    // Defense-in-depth: stop bubbling to canvas container or document
    this.rootEl.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.rootEl.addEventListener('mousedown', (e) => e.stopPropagation());
    this.rootEl.addEventListener('wheel', (e) => e.stopPropagation());
    this.rootEl.addEventListener('keydown', (e) => e.stopPropagation());

    // Permanent Inspector Header
    this.headerEl = document.createElement('div');
    this.headerEl.id = 'inspector-header';
    this.headerEl.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;';
    this.headerTitleEl = document.createElement('span');
    this.headerTitleEl.textContent = 'INSPECTOR PANEL';
    this.headerTitleEl.style.cssText = 'font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;';
    this.idBadgeEl = document.createElement('span');
    this.idBadgeEl.id = 'inspector-id';
    this.idBadgeEl.title = 'Shape ID (click to copy)';
    this.idBadgeEl.style.cssText = 'font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #334155; cursor: pointer; user-select: all; display: none;';
    this.idBadgeEl.addEventListener('click', () => {
      const id = this.idBadgeEl.textContent?.replace('#', '') || '';
      if (id && navigator.clipboard?.writeText) navigator.clipboard.writeText(id).catch(() => {});
    });
    this.headerEl.appendChild(this.headerTitleEl);
    this.headerEl.appendChild(this.idBadgeEl);

    // Document Settings Controller (at top)
    this.docSettings = new DocSettingsController(onDocSettingsChange);

    // Empty state note
    this.emptyStateEl = document.createElement('div');
    this.emptyStateEl.id = 'inspector-empty-state';
    this.emptyStateEl.textContent = 'No shape selected';
    this.emptyStateEl.style.cssText = 'font-size: 11px; color: #94a3b8; font-style: italic; text-align: center; padding: 10px 0;';

    // Single item container
    this.singleContainer = document.createElement('div');
    this.singleContainer.id = 'inspector-single-group';
    this.singleFields = new SingleFieldsController(editor, this.idBadgeEl);
    this.singleContainer.appendChild(this.singleFields.containerEl);

    // Parent Field
    this.parentGroup = document.createElement('div');
    this.parentGroup.style.cssText = 'margin-bottom: 10px;';
    const parentLabel = document.createElement('label');
    parentLabel.htmlFor = 'inspector-parent-select';
    parentLabel.textContent = 'Parent Frame';
    parentLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;';
    this.parentController = new ParentSelectController(editor);
    this.parentGroup.appendChild(parentLabel);
    this.parentGroup.appendChild(this.parentController.element);
    this.singleContainer.appendChild(this.parentGroup);

    // Member list
    this.memberController = new MemberListController(editor);
    this.singleContainer.appendChild(this.memberController.containerEl);

    // Multi-Select Group
    this.multiGroup = document.createElement('div');
    this.multiGroup.id = 'inspector-multi-group';
    this.multiGroup.style.cssText = 'display: none;';
    this.multiCountEl = document.createElement('div');
    this.multiCountEl.id = 'inspector-multi-count';
    this.multiCountEl.style.cssText = 'font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 10px;';

    const batchTypeGroup = document.createElement('div');
    batchTypeGroup.style.cssText = 'margin-bottom: 10px;';
    const batchTypeLabel = document.createElement('label');
    batchTypeLabel.htmlFor = 'inspector-batch-type';
    batchTypeLabel.textContent = 'Batch Apply Semantic Type';
    batchTypeLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;';
    this.multiTypeSelect = document.createElement('select');
    this.multiTypeSelect.id = 'inspector-batch-type';
    this.multiTypeSelect.setAttribute('aria-label', 'Batch Semantic Type');
    this.multiTypeSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; background: #ffffff; cursor: pointer;';
    const placeholderOpt = document.createElement('option');
    placeholderOpt.value = '';
    placeholderOpt.textContent = '-- Select type to apply to all --';
    this.multiTypeSelect.appendChild(placeholderOpt);
    for (const [key, def] of Object.entries(SEMANTIC_TYPES)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${def.label} (${key})`;
      this.multiTypeSelect.appendChild(opt);
    }
    this.multiTypeSelect.addEventListener('change', () => this.onBatchTypeChange());
    batchTypeGroup.appendChild(batchTypeLabel);
    batchTypeGroup.appendChild(this.multiTypeSelect);

    const parentDisabledNote = document.createElement('div');
    parentDisabledNote.textContent = 'Parent assignment disabled during multi-selection';
    parentDisabledNote.title = 'Batch re-parenting is disabled';
    parentDisabledNote.style.cssText = 'font-size: 11px; color: #94a3b8; font-style: italic;';
    this.multiGroup.appendChild(this.multiCountEl);
    this.multiGroup.appendChild(batchTypeGroup);
    this.multiGroup.appendChild(parentDisabledNote);

    // Root DOM mounting order: Header -> Doc Settings -> Empty State / Single / Multi
    this.rootEl.appendChild(this.headerEl);
    this.rootEl.appendChild(this.docSettings.element);
    this.rootEl.appendChild(this.emptyStateEl);
    this.rootEl.appendChild(this.singleContainer);
    this.rootEl.appendChild(this.multiGroup);
    mountTarget.appendChild(this.rootEl);

    // Subscriptions
    this.editor.selectionManager.subscribe(() => this.update());
    this.editor.store.listen(() => this.update());
    this.update();
  }

  update(): void {
    if (this.editor.gesture?.isActive) return;
    const sel = this.editor.selection;
    this.rootEl.style.display = 'block';

    if (sel.length === 0) {
      this.singleContainer.style.display = 'none';
      this.multiGroup.style.display = 'none';
      this.emptyStateEl.style.display = 'block';
      this.idBadgeEl.style.display = 'none';
      this.singleFields.clear();
      return;
    }

    if (sel.length > 1) {
      this.singleContainer.style.display = 'none';
      this.multiGroup.style.display = 'block';
      this.emptyStateEl.style.display = 'none';
      this.idBadgeEl.textContent = `${sel.length} selected`;
      this.idBadgeEl.style.display = 'inline-block';
      this.singleFields.clear();
      this.multiCountEl.textContent = `${sel.length} shapes selected`;
      this.multiTypeSelect.value = '';
      return;
    }

    // Single shape selected
    this.singleContainer.style.display = 'block';
    this.multiGroup.style.display = 'none';
    this.emptyStateEl.style.display = 'none';

    const shapeId = sel[0]!;
    const shape = this.editor.store.getShape(shapeId);
    if (!shape) {
      this.singleContainer.style.display = 'none';
      this.emptyStateEl.style.display = 'block';
      this.idBadgeEl.style.display = 'none';
      this.singleFields.clear();
      return;
    }

    this.singleFields.update(shape);
    this.parentController.update(shapeId);
    this.memberController.update(shape);
  }

  private onBatchTypeChange(): void {
    const nextType = this.multiTypeSelect.value;
    if (!nextType) return;
    const sel = this.editor.selection;
    if (sel.length === 0) return;

    this.editor.store.transact(() => {
      for (const id of sel) {
        const shape = this.editor.store.getShape(id);
        if (shape) {
          this.editor.store.updateShape(id, {
            meta: {
              ...shape.meta,
              semantic: {
                ...((shape.meta?.semantic as Record<string, unknown>) ?? {}),
                type: nextType,
              },
            },
          });
        }
      }
    });
  }

  destroy(): void {
    this.parentController.destroy();
    this.rootEl.remove();
  }
}
