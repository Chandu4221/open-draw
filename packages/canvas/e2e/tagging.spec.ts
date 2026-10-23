import { test, expect } from '@playwright/test';

test.describe('Phase 4 §0.2: Tag Popover & Human Tagging Affordance Gate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#canvas-container');
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.loadSnapshot({
        version: 1,
        shapes: [],
        camera: { x: 0, y: 0, zoom: 1 },
      });
      editor.clearSelection();
      (window as any).__od_debug__.setChipMode('always');
    });
  });

  test('selecting a shape opens tag panel showing read-only ID, name, and type; deselecting hides it', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 100, fill: '#3b82f6' },
        meta: { semantic: { type: 'card', name: 'Profile Card' } },
      });
      return s.id;
    });

    // Before selection: panel is hidden
    const isHiddenBefore = await page.evaluate(() => {
      const panel = document.getElementById('tag-panel');
      return !panel || panel.style.display === 'none';
    });
    expect(isHiddenBefore).toBe(true);

    // Select shape
    await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      editor.selectShape(id);
    }, shapeId);

    // After selection: panel is visible and displays shape metadata
    const panelState = await page.evaluate(() => {
      const panel = document.getElementById('tag-panel')!;
      const idEl = document.getElementById('tag-panel-id')!;
      const nameInput = document.getElementById('tag-panel-name') as HTMLInputElement;
      const typeSelect = document.getElementById('tag-panel-type') as HTMLSelectElement;

      return {
        visible: panel.style.display !== 'none',
        idText: idEl.textContent,
        nameValue: nameInput.value,
        typeValue: typeSelect.value,
      };
    });

    expect(panelState.visible).toBe(true);
    expect(panelState.idText).toBe(`#${shapeId}`);
    expect(panelState.nameValue).toBe('Profile Card');
    expect(panelState.typeValue).toBe('card');

    // Deselect -> panel hidden
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      editor.clearSelection();
    });

    const isHiddenAfter = await page.evaluate(() => {
      const panel = document.getElementById('tag-panel');
      return !panel || panel.style.display === 'none';
    });
    expect(isHiddenAfter).toBe(true);
  });

  test('retag via popover updates chip in single transaction; undo restores previous type', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 120, height: 40, fill: '#3b82f6' },
        meta: { semantic: { type: 'card' } },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    // Retag from 'card' to 'button' via type dropdown
    await page.evaluate(() => {
      const select = document.getElementById('tag-panel-type') as HTMLSelectElement;
      select.value = 'button';
      select.dispatchEvent(new Event('change'));
    });

    // Assert store updated to button
    const typeAfter = await page.evaluate((id) => {
      const s = (window as any).__od_debug__.editor.store.getShape(id);
      return s?.meta?.semantic?.type;
    }, shapeId);
    expect(typeAfter).toBe('button');

    // Assert visible chip contains 'button'
    const chipText = await page.evaluate((id) => {
      const chip = document.querySelector(`.od-semantic-chip[data-shape-id="${id}"] text`);
      return chip?.textContent;
    }, shapeId);
    expect(chipText).toContain('button');

    // Undo: single step restores 'card'
    await page.evaluate(() => {
      (window as any).__od_debug__.editor.undo();
    });

    const typeRestored = await page.evaluate((id) => {
      const s = (window as any).__od_debug__.editor.store.getShape(id);
      return s?.meta?.semantic?.type;
    }, shapeId);
    expect(typeRestored).toBe('card');

    const chipRestored = await page.evaluate((id) => {
      const chip = document.querySelector(`.od-semantic-chip[data-shape-id="${id}"] text`);
      return chip?.textContent;
    }, shapeId);
    expect(chipRestored).toContain('card');
  });

  test('rename via popover updates chip label while keeping shape ID unchanged', async ({ page }) => {
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 150, height: 50, fill: '#3b82f6' },
        meta: { semantic: { type: 'button' } },
      });
      editor.selectShape(s.id);
      return s.id;
    });

    // Rename via input
    await page.evaluate(() => {
      const input = document.getElementById('tag-panel-name') as HTMLInputElement;
      input.value = 'Submit CTA';
      input.dispatchEvent(new Event('change'));
    });

    const storeState = await page.evaluate((id) => {
      const s = (window as any).__od_debug__.editor.store.getShape(id);
      return {
        id: s?.id,
        name: s?.meta?.semantic?.name,
        type: s?.meta?.semantic?.type,
      };
    }, shapeId);

    expect(storeState.id).toBe(shapeId);
    expect(storeState.name).toBe('Submit CTA');
    expect(storeState.type).toBe('button');

    // Assert chip label format matches `#<id> Submit CTA`
    const chipText = await page.evaluate((id) => {
      const chip = document.querySelector(`.od-semantic-chip[data-shape-id="${id}"] text`);
      return chip?.textContent;
    }, shapeId);
    expect(chipText).toBe(`#${shapeId} Submit CTA`);
  });

  test('provenance hint displays inference status and retagged-by-you state', async ({ page }) => {
    const { rectId } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const p = editor.createShape({
        type: 'frame',
        x: 50,
        y: 50,
        props: { width: 800, height: 600, label: 'Page' },
        meta: { semantic: { type: 'page' } },
      });
      const r = editor.createShape({
        type: 'rect',
        x: 50,
        y: 50,
        props: { width: 750, height: 200, fill: '#3b82f6' },
        meta: { parent: p.id },
      });
      editor.selectShape(r.id);
      return { rectId: r.id };
    });

    // Initial inferred state: should show "Inferred: section"
    const initialHint = await page.evaluate(() => {
      const hint = document.getElementById('tag-panel-hint');
      return hint?.textContent;
    });
    expect(initialHint).toBe('Inferred: section');

    // Retag to card
    await page.evaluate(() => {
      const select = document.getElementById('tag-panel-type') as HTMLSelectElement;
      select.value = 'card';
      select.dispatchEvent(new Event('change'));
    });

    // After user override: should show "Inferred: section — retagged by you"
    const retaggedHint = await page.evaluate(() => {
      const hint = document.getElementById('tag-panel-hint');
      return hint?.textContent;
    });
    expect(retaggedHint).toBe('Inferred: section — retagged by you');
  });
});
