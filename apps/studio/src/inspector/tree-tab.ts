import type { CanvasEditor } from '@open-draw/canvas';
import type { ShapeRecord } from '@open-draw/schema';
import { TreeContextMenu } from './tree-context-menu.js';

export class StructureTreeTab {
  private editor: CanvasEditor;
  readonly element: HTMLElement;
  private treeContainer: HTMLElement;
  private contextMenu: TreeContextMenu;
  private collapsedIds = new Set<string>();
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
    this.treeContainer.className = 'od-tree-container';
    this.element.appendChild(this.treeContainer);

    this.contextMenu = new TreeContextMenu({
      onReveal: (shapeId) => this.revealShape(shapeId),
      onCopy: (shapeId) => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(shapeId).catch(() => {});
        }
      },
    });

    this.unsubscribeStore = this.editor.store.listen(() => this.render());
    this.unsubscribeSelection = this.editor.selectionManager.subscribe(() => {
      this.updateSelectionHighlight();
    });

    this.render();
  }

  show(): void {
    this.element.style.display = 'block';
    this.render();
  }

  hide(): void {
    this.element.style.display = 'none';
    this.contextMenu.hide();
  }

  revealShape(shapeId: string): void {
    const shape = this.editor.store.getShape(shapeId);
    if (!shape) return;

    this.editor.selectionManager.setSelection([shapeId]);

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
      this.treeContainer.innerHTML =
        '<div style="color: #94a3b8; font-style: italic; padding: 12px; text-align: center;">Empty canvas</div>';
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

    const renderNode = (s: ShapeRecord, containerEl: HTMLElement) => {
      const children = childrenByParent.get(s.id);
      const hasChildren = Boolean(children && children.length > 0);
      const isCollapsed = this.collapsedIds.has(s.id);

      const nodeEl = document.createElement('div');
      nodeEl.className = 'od-tree-node';
      nodeEl.setAttribute('data-id', s.id);

      if (this.editor.selection.includes(s.id)) {
        nodeEl.classList.add('selected');
      }

      // Chevron Twisty vs Spacer
      if (hasChildren) {
        const twisty = document.createElement('span');
        twisty.className = 'od-tree-twisty';
        twisty.setAttribute('data-action', 'toggle-collapse');
        twisty.textContent = isCollapsed ? '▸' : '▾';
        twisty.title = isCollapsed ? 'Expand' : 'Collapse';
        twisty.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.collapsedIds.has(s.id)) {
            this.collapsedIds.delete(s.id);
          } else {
            this.collapsedIds.add(s.id);
          }
          this.render();
        });
        nodeEl.appendChild(twisty);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'od-tree-spacer';
        nodeEl.appendChild(spacer);
      }

      // Icon (folder vs leaf type icon)
      const iconEl = document.createElement('span');
      iconEl.className = 'od-tree-icon';
      if (hasChildren) {
        iconEl.textContent = isCollapsed ? '📁' : '📂';
      } else {
        const TYPE_ICONS: Record<string, string> = {
          frame: '⛶',
          group: '⧉',
          text: 'T',
          image: '🖼',
          circle: '◯',
          diamond: '◇',
          arrow: '➔',
          line: '―',
          star: '★',
        };
        iconEl.textContent = TYPE_ICONS[s.type] ?? '▢';
      }
      nodeEl.appendChild(iconEl);

      // Label (Primary name + #id)
      const sem = (s.meta['semantic'] ?? {}) as Record<string, unknown>;
      const semType = sem['type'] as string | undefined;
      const name = (sem['name'] as string) || '';
      const isUntagged = !semType;
      const displayLabel = name ? `${name} (${semType || s.type})` : (semType || s.type);

      const labelEl = document.createElement('span');
      labelEl.className = 'od-tree-label';

      const nameEl = document.createElement('span');
      nameEl.className = 'od-tree-name';
      nameEl.textContent = displayLabel;
      labelEl.appendChild(nameEl);

      const idEl = document.createElement('span');
      idEl.className = 'od-tree-id';
      idEl.textContent = `#${s.id}`;
      labelEl.appendChild(idEl);

      nodeEl.appendChild(labelEl);

      // Untagged badge
      if (isUntagged) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'od-tree-untagged-badge';
        badgeEl.textContent = 'untagged';
        nodeEl.appendChild(badgeEl);
      }

      // Hover actions (🎯 Reveal, 📋 Copy ID)
      const actionsEl = document.createElement('span');
      actionsEl.className = 'od-tree-actions';

      const revealBtn = document.createElement('button');
      revealBtn.className = 'od-tree-action-btn';
      revealBtn.title = 'Reveal on canvas';
      revealBtn.textContent = '🎯';
      revealBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.revealShape(s.id);
      });

      const copyBtn = document.createElement('button');
      copyBtn.className = 'od-tree-action-btn';
      copyBtn.title = 'Copy ID';
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(s.id).catch(() => {});
        }
      });

      actionsEl.appendChild(revealBtn);
      actionsEl.appendChild(copyBtn);
      nodeEl.appendChild(actionsEl);

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
        this.contextMenu.show(e.clientX, e.clientY, s.id);
      });

      containerEl.appendChild(nodeEl);

      // Render children under guide lines if expanded
      if (hasChildren && !isCollapsed && children) {
        const childContainer = document.createElement('div');
        childContainer.className = 'od-tree-children';
        for (const child of sortList(children)) {
          renderNode(child, childContainer);
        }
        containerEl.appendChild(childContainer);
      }
    };

    for (const root of sortList(roots)) {
      renderNode(root, this.treeContainer);
    }
  }

  private updateSelectionHighlight(): void {
    const sel = this.editor.selection;
    const allNodeEls = this.treeContainer.querySelectorAll('.od-tree-node');
    for (const nodeEl of allNodeEls) {
      const id = nodeEl.getAttribute('data-id');
      if (id && sel.includes(id)) {
        nodeEl.classList.add('selected');
      } else {
        nodeEl.classList.remove('selected');
      }
    }
  }

  destroy(): void {
    if (this.unsubscribeStore) this.unsubscribeStore();
    if (this.unsubscribeSelection) this.unsubscribeSelection();
    this.contextMenu.destroy();
    this.element.remove();
  }
}
