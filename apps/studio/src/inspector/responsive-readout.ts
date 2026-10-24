import type { CanvasEditor } from '@open-draw/canvas';
import type { ShapeRecord, Snapshot } from '@open-draw/schema';
import { derive, getPlatformProfile, SEMANTIC_TYPES } from '@open-draw/semantics';

const CONTAINER_SHAPE_TYPES = new Set(['frame', 'group']);
const CONTAINER_TYPES = new Set(['card', 'section', 'column', 'page', 'group', 'frame', 'row']);

export function isContainerShape(shape: ShapeRecord): boolean {
  if (CONTAINER_SHAPE_TYPES.has(shape.type)) return true;
  const semType = (shape.meta?.semantic as Record<string, unknown> | undefined)?.type as string | undefined;
  if (semType) {
    if (CONTAINER_TYPES.has(semType)) return true;
    const def = SEMANTIC_TYPES[semType];
    if (def?.isContainer) return true;
  }
  return false;
}

export function computeContainerReadout(
  editor: CanvasEditor,
  containerShape: ShapeRecord,
  platformKey: string = 'web'
): { label: string; text: string }[] {
  const shapes = editor.store.listShapes();
  const children = shapes.filter(
    (s) => s.meta['parent'] === containerShape.id || s.meta['parentId'] === containerShape.id
  );

  const platform = getPlatformProfile(platformKey);
  const breakpoints = platform?.breakpoints && platform.breakpoints.length > 0
    ? platform.breakpoints
    : [{ id: 'mobile', label: 'Mobile (< 768px)', width: 580 }];

  if (children.length === 0) {
    return breakpoints.map((bp) => ({
      label: bp.label,
      text: 'no children — nothing to reflow',
    }));
  }

  const snapshot: Snapshot = {
    version: 1,
    shapes: [...shapes],
    meta: { platform: platformKey },
  };

  const results: { label: string; text: string }[] = [];

  for (const bp of breakpoints) {
    const derived = derive(snapshot, { width: bp.width });
    let reflowedCount = 0;
    let stackedCount = 0;

    for (const child of children) {
      const layout = derived.layouts.get(child.id);
      if (layout && layout.isReflowed) {
        reflowedCount++;
        const origY = Math.round(child.y);
        const origX = Math.round(child.x);
        if (Math.abs(layout.y - origY) > 20 && Math.abs(layout.x - origX) > 0) {
          stackedCount++;
        }
      }
    }

    if (reflowedCount > 0) {
      const verb = stackedCount > 0 ? 'children stack vertically' : 'children reflow';
      results.push({
        label: bp.label,
        text: `${reflowedCount} ${verb}`,
      });
    } else {
      results.push({
        label: bp.label,
        text: 'natural layout flow preserved',
      });
    }
  }

  return results;
}

export class ResponsiveReadoutController {
  private editor: CanvasEditor;
  readonly containerEl: HTMLElement;
  private headerEl: HTMLElement;
  private contentEl: HTMLElement;

  constructor(editor: CanvasEditor) {
    this.editor = editor;

    this.containerEl = document.createElement('div');
    this.containerEl.id = 'inspector-responsive-readout';
    this.containerEl.style.cssText = `
      margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9;
      display: none;
    `;

    this.headerEl = document.createElement('div');
    this.headerEl.style.cssText = `
      font-size: 11px; font-weight: 700; color: #64748b;
      letter-spacing: 0.5px; margin-bottom: 6px;
    `;
    this.headerEl.textContent = 'RESPONSIVE BEHAVIOR';

    this.contentEl = document.createElement('div');
    this.contentEl.id = 'responsive-readout-content';
    this.contentEl.style.cssText = 'font-size: 12px; color: #334155; line-height: 1.4;';

    this.containerEl.appendChild(this.headerEl);
    this.containerEl.appendChild(this.contentEl);
  }

  update(shape: ShapeRecord | null, platformKey: string = 'web'): void {
    if (!shape || !isContainerShape(shape)) {
      this.containerEl.style.display = 'none';
      this.contentEl.innerHTML = '';
      return;
    }

    const readouts = computeContainerReadout(this.editor, shape, platformKey);
    this.contentEl.innerHTML = '';

    for (const r of readouts) {
      const item = document.createElement('div');
      item.style.cssText = 'margin-bottom: 4px;';
      item.innerHTML = `<strong>${r.label}:</strong> ${r.text}`;
      this.contentEl.appendChild(item);
    }

    this.containerEl.style.display = 'block';
  }
}
