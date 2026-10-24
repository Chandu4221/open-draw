import type { CanvasEditor } from '@open-draw/canvas';
import { SEMANTIC_TYPES } from '@open-draw/semantics';
import { isValidShapeName } from '@open-draw/schema';

/**
 * Minimal Tagging Affordance for OpenDraw Playground (§0.2).
 * Provides a clean docked/floating popover for viewing shape ID,
 * editing human shape name, selecting semantic type, and viewing inference provenance.
 */
export class PlaygroundTagPanel {
  private editor: CanvasEditor;
  private rootEl: HTMLElement;
  private idEl: HTMLElement;
  private nameInput: HTMLInputElement;
  private typeSelect: HTMLSelectElement;
  private hintEl: HTMLElement;
  private activeShapeId: string | null = null;
  private isUpdating = false;

  constructor(editor: CanvasEditor, mountTarget: HTMLElement = document.body) {
    this.editor = editor;

    // Create container
    this.rootEl = document.createElement('div');
    this.rootEl.id = 'tag-panel';
    this.rootEl.className = 'od-tag-panel';
    this.rootEl.setAttribute('role', 'region');
    this.rootEl.setAttribute('aria-label', 'Shape Semantics');
    this.rootEl.style.cssText = `
      position: fixed;
      top: 72px;
      right: 20px;
      width: 220px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.04);
      z-index: 55;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: #0f172a;
      display: none;
    `;

    // Defense-in-depth: stop bubbling to canvas container or document
    this.rootEl.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.rootEl.addEventListener('mousedown', (e) => e.stopPropagation());
    this.rootEl.addEventListener('wheel', (e) => e.stopPropagation());
    this.rootEl.addEventListener('keydown', (e) => e.stopPropagation());

    // Header: Shape ID
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;';
    
    const title = document.createElement('span');
    title.textContent = 'SEMANTICS';
    title.style.cssText = 'font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;';
    
    this.idEl = document.createElement('span');
    this.idEl.id = 'tag-panel-id';
    this.idEl.className = 'od-tag-id';
    this.idEl.title = 'Shape ID (read-only, click to copy)';
    this.idEl.style.cssText = 'font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #334155; cursor: pointer; user-select: all;';
    this.idEl.addEventListener('click', () => {
      const idText = this.idEl.textContent?.replace('#', '') || '';
      if (idText && typeof navigator?.clipboard?.writeText === 'function') {
        navigator.clipboard.writeText(idText);
      }
    });

    header.appendChild(title);
    header.appendChild(this.idEl);
    this.rootEl.appendChild(header);

    // Form: Name input
    const nameGroup = document.createElement('div');
    nameGroup.style.cssText = 'margin-bottom: 8px;';
    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'tag-panel-name';
    nameLabel.textContent = 'Name';
    nameLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 3px;';
    
    this.nameInput = document.createElement('input');
    this.nameInput.id = 'tag-panel-name';
    this.nameInput.setAttribute('aria-label', 'Shape Name');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 64;
    this.nameInput.placeholder = 'Optional label';
    this.nameInput.style.cssText = 'width: 100%; box-sizing: border-box; padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; background: #ffffff;';
    this.nameInput.addEventListener('change', () => this.onNameCommit());
    this.nameInput.addEventListener('blur', () => this.onNameCommit());
    this.nameInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        this.onNameCommit();
        this.nameInput.blur();
      } else if (e.key === 'Escape') {
        const shape = this.activeShapeId ? this.editor.store.getShape(this.activeShapeId) : null;
        const currentName = shape ? (((shape.meta?.semantic as Record<string, unknown>)?.name as string) || '') : '';
        this.nameInput.value = currentName;
        this.nameInput.blur();
        this.update();
      }
    });

    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(this.nameInput);
    this.rootEl.appendChild(nameGroup);

    // Form: Type dropdown
    const typeGroup = document.createElement('div');
    typeGroup.style.cssText = 'margin-bottom: 8px;';
    const typeLabel = document.createElement('label');
    typeLabel.htmlFor = 'tag-panel-type';
    typeLabel.textContent = 'Type';
    typeLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 3px;';

    this.typeSelect = document.createElement('select');
    this.typeSelect.id = 'tag-panel-type';
    this.typeSelect.setAttribute('aria-label', 'Semantic Type');
    this.typeSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; background: #ffffff; cursor: pointer;';
    
    for (const [key, def] of Object.entries(SEMANTIC_TYPES)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${def.label} (${key})`;
      this.typeSelect.appendChild(opt);
    }
    this.typeSelect.addEventListener('change', () => this.onTypeChange());

    typeGroup.appendChild(typeLabel);
    typeGroup.appendChild(this.typeSelect);
    this.rootEl.appendChild(typeGroup);

    // Provenance Hint
    this.hintEl = document.createElement('div');
    this.hintEl.id = 'tag-panel-hint';
    this.hintEl.style.cssText = 'font-size: 10px; color: #64748b; font-style: italic; line-height: 1.3; min-height: 14px;';
    this.rootEl.appendChild(this.hintEl);

    mountTarget.appendChild(this.rootEl);

    // Subscribe to selection and store
    this.editor.selectionManager.subscribe(() => this.update());
    this.editor.store.listen(() => this.update());
    this.update();
  }

  private onNameCommit(): void {
    if (!this.activeShapeId || this.isUpdating) return;
    const raw = this.nameInput.value.trim();
    if (raw.length > 0 && !isValidShapeName(raw)) {
      this.nameInput.style.borderColor = '#ef4444';
      return;
    }
    this.nameInput.style.borderColor = '#cbd5e1';

    const current = this.editor.store.getShape(this.activeShapeId);
    if (!current) return;
    const currentName = ((current.meta?.semantic as Record<string, unknown>)?.name as string) || '';
    if (raw === currentName) return;

    this.editor.store.transact(() => {
      this.editor.store.updateShape(this.activeShapeId!, {
        meta: {
          ...current.meta,
          semantic: {
            ...((current.meta?.semantic as Record<string, unknown>) ?? {}),
            name: raw.length > 0 ? raw : undefined,
          },
        },
      });
    });
  }

  private onTypeChange(): void {
    if (!this.activeShapeId || this.isUpdating) return;
    const nextType = this.typeSelect.value;
    const current = this.editor.store.getShape(this.activeShapeId);
    if (!current) return;
    const currentType = ((current.meta?.semantic as Record<string, unknown>)?.type as string) || current.type;
    if (nextType === currentType) return;

    this.editor.store.transact(() => {
      this.editor.store.updateShape(this.activeShapeId!, {
        meta: {
          ...current.meta,
          semantic: {
            ...((current.meta?.semantic as Record<string, unknown>) ?? {}),
            type: nextType,
          },
        },
      });
    });
  }

  private lastShapeId: string | null = null;
  private lastName: string | null = null;
  private lastType: string | null = null;
  private lastInferredType: string | null = null;

  update(): void {
    if (this.editor.gesture?.isActive) return;
    const sel = this.editor.selection;
    if (sel.length !== 1) {
      this.activeShapeId = null;
      this.lastShapeId = null;
      this.rootEl.style.display = 'none';
      return;
    }

    const shapeId = sel[0]!;
    const shape = this.editor.store.getShape(shapeId);
    if (!shape) {
      this.activeShapeId = null;
      this.lastShapeId = null;
      this.rootEl.style.display = 'none';
      return;
    }

    const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
    const name = (semantic.name as string) || '';
    const currentType = (semantic.type as string) || shape.type;
    const inferredType = (semantic.inferredType as string | undefined) || '';

    if (
      this.lastShapeId === shapeId &&
      this.lastName === name &&
      this.lastType === currentType &&
      this.lastInferredType === inferredType
    ) {
      return;
    }

    this.lastShapeId = shapeId;
    this.lastName = name;
    this.lastType = currentType;
    this.lastInferredType = inferredType;

    this.activeShapeId = shapeId;
    this.isUpdating = true;
    this.rootEl.style.display = 'block';

    this.idEl.textContent = `#${shape.id}`;
    
    if (document.activeElement !== this.nameInput) {
      this.nameInput.value = name;
    }
    this.nameInput.style.borderColor = '#cbd5e1';

    this.typeSelect.value = currentType in SEMANTIC_TYPES ? currentType : 'section';

    if (inferredType) {
      if (currentType === inferredType) {
        this.hintEl.textContent = `Inferred: ${inferredType}`;
      } else {
        this.hintEl.textContent = `Inferred: ${inferredType} — retagged by you`;
      }
    } else {
      this.hintEl.textContent = '';
    }

    this.isUpdating = false;
  }

  destroy(): void {
    this.rootEl.remove();
  }
}
