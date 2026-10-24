import type { CanvasEditor } from '@open-draw/canvas';
import type { ShapeRecord } from '@open-draw/schema';

export class StructureTreeTab {
  private editor: CanvasEditor;
  readonly element: HTMLElement;
  private treeContainer: HTMLElement;
  private contextMenuEl: HTMLElement;
  private activeContextShapeId: string | null = null;
  private unsubscribeStore?: () => void;
  private unsubscribeSelection?: () => void;

  constructor(editor: CanvasEditor) {
    this.editor = editor;

    this.element = document.createElement('div');
    this.element.id = 'inspector-tree-tab';
    this.element.className = 'od-tree-tab';
    this.element.style.cssText = 'display: none; padding-top: 8px;';

    this.treeContainer = document.createElement('div');
    this.treeContainer.id = 'od-tree-container';
    this.treeContainer.style.cssText = `
      max-height: calc(100vh - 240px); overflow-y: auto; overflow-x: hidden;
      font-size: 12px; font-family: monospace;
    `;
    this.element.appendChild(this.treeContainer);

    // Floating Context Menu
    this.contextMenuEl = document.createElement('div');
    this.contextMenuEl.id = 'od-tree-context-menu';
    this.contextMenuEl.style.cssText = `
      position: fixed; display: none; z-index: 100;
      background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 4px 0; font-family: sans-serif;
      font-size: 12px; min-width: 130px;
    `;

    const revealItem = document.createElement('div');
    revealItem.id = 'od-tree-menu-reveal';
    revealItem.textContent = 'Reveal on canvas';
    revealItem.style.cssText = 'padding: 6px 12px; cursor: pointer; color: #0f172a;';
    revealItem.addEventListener('mouseenter', () => revealItem.style.background = '#f1f5f9');
    revealItem.addEventListener('mouseleave', () => revealItem.style.background = 'transparent');
    revealItem.addEventListener('click', () => this.onRevealShape());

    const copyItem = document.createElement('div');
    copyItem.id = 'od-tree-menu-copy';
    copyItem.textContent = 'Copy ID';
    copyItem.style.cssText = 'padding: 6px 12px; cursor: pointer; color: #0f172a;';
    copyItem.addEventListener('mouseenter', () => copyItem.style.background = '#f1f5f9');
    copyItem.addEventListener('mouseleave', () => copyItem.style.background = 'transparent');
    copyItem.addEventListener('click', () => this.onCopyId());

    this.contextMenuEl.appendChild(revealItem);
    this.contextMenuEl.appendChild(copyItem);
    document.body.appendChild(this.contextMenuEl);

    document.addEventListener('pointerdown', (e) => {
      if (!this.contextMenuEl.contains(e.target as Node)) {
        this.hideContextMenu();
      }
    });

    this.unsubscribeStore = this.editor.store.listen(() => this.render());
    this.unsubscribeSelection = this.editor.selectionManager.subscribe(() => this.updateSelectionHighlight());

    this.render();
  }

  show(): void {
    this.element.style.display = 'block';
    this.render();
  }

  hide(): void {
    this.element.style.display = 'none';
    this.hideContextMenu();
  }

  private hideContextMenu(): void {
    this.contextMenuEl.style.display = 'none';
    this.activeContextShapeId = null;
  }

  private onRevealShape(): void {
    if (!this.activeContextShapeId) return;
    this.revealShape(this.activeContextShapeId);
    this.hideContextMenu();
  }

  private onCopyId(): void {
    if (!this.activeContextShapeId) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(this.activeContextShapeId).catch(() => {});
    }
    this.hideContextMenu();
  }

  revealShape(shapeId: string): void {
    const shape = this.editor.store.getShape(shapeId);
    if (!shape) return;

    this.editor.selectionManager.setSelection([shapeId]);

    // Pan camera to center shape in viewport if off-screen
    const container = this.editor.getContainer();
    if (container) {
      const rect = container.getBoundingClientRect();
      const screenPos = this.editor.camera.pageToScreen({ x: shape.x, y: shape.y });
      const isOffscreen =
        screenPos.x < 50 || screenPos.x > rect.width - 50 ||
        screenPos.y < 50 || screenPos.y > rect.height - 50;

      if (isOffscreen) {
        const targetScreenX = rect.width / 2;
        const targetScreenY = rect.height / 2;
        const dx = targetScreenX - screenPos.x;
        const dy = targetScreenY - screenPos.y;
        this.editor.camera.pan(dx, dy);
      }
    }
  }

  render(): void {
    this.treeContainer.innerHTML = '';
    const shapes = this.editor.store.listShapes();
    if (shapes.length === 0) {
      this.treeContainer.innerHTML = '<div style="color: #94a3b8; font-style: italic; padding: 12px; text-align: center;">Empty canvas</div>';
      return;
    }

    const shapeMap = new Map<string, ShapeRecord>();
    for (const s of shapes) shapeMap.set(s.id, s);

    const childrenByParent = new Map<string, ShapeRecord[]>();
    const roots: ShapeRecord[] = [];

    for (const s of shapes) {
      const pId = (s.meta['parent'] ?? s.meta['parentId']) as string | undefined;
      if (pId && shapeMap.has(pId)) {
        const list = childrenByParent.get(pId) ?? [];
        list.push(s);
        childrenByParent.set(pId, list);
      } else {
        roots.push(s);
      }
    }

    const sortList = (arr: ShapeRecord[]) =>
      [...arr].sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));

    const renderNode = (s: ShapeRecord, depth: number) => {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'od-tree-node';
      nodeEl.setAttribute('data-id', s.id);
      nodeEl.style.cssText = `
        padding: 5px 8px 5px ${depth * 14 + 8}px; cursor: pointer;
        display: flex; align-items: center; gap: 6px; border-radius: 4px;
        margin-bottom: 2px; user-select: none;
      `;

      if (this.editor.selection.includes(s.id)) {
        nodeEl.classList.add('selected');
        nodeEl.style.background = '#e0f2fe';
        nodeEl.style.color = '#0369a1';
        nodeEl.style.fontWeight = '600';
      }

      // Icon
      const iconEl = document.createElement('span');
      iconEl.className = 'od-tree-icon';
      iconEl.style.fontSize = '11px';
      const TYPE_ICONS: Record<string, string> = {
        frame: '⛶',
        group: '⧉',
        text: 'T',
        image: '🖼',
      };
      iconEl.textContent = TYPE_ICONS[s.type] ?? '▢';
      nodeEl.appendChild(iconEl);

      // Label
      const sem = (s.meta['semantic'] ?? {}) as Record<string, unknown>;
      const semType = sem['type'] as string | undefined;
      const name = (sem['name'] as string) || '';
      const isUntagged = !semType;
      const displayLabel = name ? `${name} (${semType || s.type})` : (semType || s.type);

      const labelEl = document.createElement('span');
      labelEl.className = 'od-tree-label';
      labelEl.textContent = `#${s.id} ${displayLabel}`;
      labelEl.style.flex = '1';
      labelEl.style.overflow = 'hidden';
      labelEl.style.textOverflow = 'ellipsis';
      labelEl.style.whiteSpace = 'nowrap';
      nodeEl.appendChild(labelEl);

      // Untagged badge
      if (isUntagged) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'od-tree-untagged-badge';
        badgeEl.textContent = 'untagged';
        badgeEl.style.cssText = `
          font-size: 9px; font-weight: 600; text-transform: uppercase;
          background: #fee2e2; color: #b91c1c; padding: 1px 4px;
          border-radius: 3px; letter-spacing: 0.3px;
        `;
        nodeEl.appendChild(badgeEl);
      }

      // Click to select
      nodeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          const current = this.editor.selection;
          if (current.includes(s.id)) {
            this.editor.selectionManager.setSelection(current.filter((id) => id !== s.id));
          } else {
            this.editor.selectionManager.setSelection([...current, s.id]);
          }
        } else {
          this.revealShape(s.id);
        }
      });

      // Context menu
      nodeEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.activeContextShapeId = s.id;
        this.contextMenuEl.style.left = `${e.clientX}px`;
        this.contextMenuEl.style.top = `${e.clientY}px`;
        this.contextMenuEl.style.display = 'block';
      });

      this.treeContainer.appendChild(nodeEl);

      const children = childrenByParent.get(s.id);
      if (children && children.length > 0) {
        for (const child of sortList(children)) {
          renderNode(child, depth + 1);
        }
      }
    };

    for (const root of sortList(roots)) {
      renderNode(root, 0);
    }
  }

  private updateSelectionHighlight(): void {
    const sel = this.editor.selection;
    const allNodeEls = this.treeContainer.querySelectorAll('.od-tree-node');
    for (const nodeEl of allNodeEls) {
      const id = nodeEl.getAttribute('data-id');
      const el = nodeEl as HTMLElement;
      if (id && sel.includes(id)) {
        el.classList.add('selected');
        el.style.background = '#e0f2fe';
        el.style.color = '#0369a1';
        el.style.fontWeight = '600';
      } else {
        el.classList.remove('selected');
        el.style.background = 'transparent';
        el.style.color = '#0f172a';
        el.style.fontWeight = 'normal';
      }
    }
  }

  destroy(): void {
    if (this.unsubscribeStore) this.unsubscribeStore();
    if (this.unsubscribeSelection) this.unsubscribeSelection();
    this.contextMenuEl.remove();
    this.element.remove();
  }
}
