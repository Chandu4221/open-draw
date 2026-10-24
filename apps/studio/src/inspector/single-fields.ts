import type { CanvasEditor } from '@open-draw/canvas';
import { SEMANTIC_TYPES } from '@open-draw/semantics';
import { isValidShapeName, type ShapeRecord } from '@open-draw/schema';

export class SingleFieldsController {
  private editor: CanvasEditor;
  readonly containerEl: HTMLElement;
  private idEl: HTMLElement;
  private nameInput: HTMLInputElement;
  private typeSelect: HTMLSelectElement;
  private hintEl: HTMLElement;
  private activeShapeId: string | null = null;
  private isUpdating = false;

  constructor(editor: CanvasEditor, externalIdEl?: HTMLElement) {
    this.editor = editor;
    this.containerEl = document.createElement('div');

    if (externalIdEl) {
      this.idEl = externalIdEl;
    } else {
      // Fallback Header (ID + Copy)
      const header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9;';
      const title = document.createElement('span');
      title.textContent = 'INSPECTOR';
      title.style.cssText = 'font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px;';

      this.idEl = document.createElement('span');
      this.idEl.id = 'inspector-id';
      this.idEl.title = 'Shape ID (click to copy)';
      this.idEl.style.cssText = 'font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #334155; cursor: pointer; user-select: all;';
      this.idEl.addEventListener('click', () => {
        const id = this.idEl.textContent?.replace('#', '') || '';
        if (id && navigator.clipboard?.writeText) navigator.clipboard.writeText(id).catch(() => {});
      });
      header.appendChild(title);
      header.appendChild(this.idEl);
      this.containerEl.appendChild(header);
    }

    // Name Field
    const nameGroup = document.createElement('div');
    nameGroup.style.cssText = 'margin-bottom: 10px;';
    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'inspector-name';
    nameLabel.textContent = 'Name';
    nameLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;';
    this.nameInput = document.createElement('input');
    this.nameInput.id = 'inspector-name';
    this.nameInput.setAttribute('aria-label', 'Shape Name');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 64;
    this.nameInput.placeholder = 'Optional shape label';
    this.nameInput.style.cssText = 'width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; background: #ffffff;';
    this.nameInput.addEventListener('change', () => this.onNameCommit());
    this.nameInput.addEventListener('blur', () => this.onNameCommit());
    this.nameInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        this.onNameCommit();
        this.nameInput.blur();
      } else if (e.key === 'Escape') {
        const s = this.activeShapeId ? this.editor.store.getShape(this.activeShapeId) : null;
        this.nameInput.value = (s?.meta?.semantic as Record<string, unknown>)?.name as string || '';
        this.nameInput.blur();
      }
    });
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(this.nameInput);
    this.containerEl.appendChild(nameGroup);

    // Semantic Type Field
    const typeGroup = document.createElement('div');
    typeGroup.style.cssText = 'margin-bottom: 10px;';
    const typeLabel = document.createElement('label');
    typeLabel.htmlFor = 'inspector-type';
    typeLabel.textContent = 'Semantic Type';
    typeLabel.style.cssText = 'display: block; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px;';
    this.typeSelect = document.createElement('select');
    this.typeSelect.id = 'inspector-type';
    this.typeSelect.setAttribute('aria-label', 'Semantic Type');
    this.typeSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; outline: none; background: #ffffff; cursor: pointer;';
    for (const [key, def] of Object.entries(SEMANTIC_TYPES)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `${def.label} (${key})`;
      this.typeSelect.appendChild(opt);
    }
    this.typeSelect.addEventListener('change', () => this.onTypeChange());
    typeGroup.appendChild(typeLabel);
    typeGroup.appendChild(this.typeSelect);
    this.containerEl.appendChild(typeGroup);

    // Provenance Hint
    this.hintEl = document.createElement('div');
    this.hintEl.id = 'inspector-hint';
    this.hintEl.style.cssText = 'font-size: 10px; color: #64748b; font-style: italic; margin-bottom: 10px; min-height: 14px;';
    this.containerEl.appendChild(this.hintEl);

    // Horizontal divider between Semantic Type and Parent Frame
    const typeDivider = document.createElement('div');
    typeDivider.style.cssText = 'border-bottom: 1px solid #e2e8f0; margin: 12px 0 10px 0;';
    this.containerEl.appendChild(typeDivider);
  }

  private lastShapeId: string | null = null;
  private lastName: string | null = null;
  private lastType: string | null = null;
  private lastInferredType: string | null = null;

  update(shape: ShapeRecord): void {
    const semantic = (shape.meta?.semantic ?? {}) as Record<string, unknown>;
    const name = (semantic.name as string) || '';
    const currentType = (semantic.type as string) || shape.type;
    const inferredType = (semantic.inferredType as string | undefined) || '';

    if (
      this.lastShapeId === shape.id &&
      this.lastName === name &&
      this.lastType === currentType &&
      this.lastInferredType === inferredType
    ) {
      return;
    }

    this.lastShapeId = shape.id;
    this.lastName = name;
    this.lastType = currentType;
    this.lastInferredType = inferredType;

    this.isUpdating = true;
    this.activeShapeId = shape.id;
    this.idEl.textContent = `#${shape.id}`;
    this.idEl.style.display = 'inline-block';
    
    if (document.activeElement !== this.nameInput) {
      this.nameInput.value = name;
    }
    this.nameInput.style.borderColor = '#cbd5e1';

    this.typeSelect.value = currentType in SEMANTIC_TYPES ? currentType : 'section';

    if (inferredType) {
      this.hintEl.textContent = currentType === inferredType
        ? `Inferred: ${inferredType}`
        : `Inferred: ${inferredType} — retagged by you`;
    } else {
      this.hintEl.textContent = '';
    }
    this.isUpdating = false;
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

  clear(): void {
    this.activeShapeId = null;
    this.lastShapeId = null;
    this.lastName = null;
    this.lastType = null;
    this.lastInferredType = null;
    this.idEl.textContent = '';
    this.idEl.style.display = 'none';
  }
}
