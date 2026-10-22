import { test, expect } from '@playwright/test';

// Helper to decode PNG header magic bytes and dimensions
function parsePngHeader(buffer: Buffer): { validMagic: boolean; width: number; height: number } {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const validMagic =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // IHDR chunk begins at offset 8 (4 bytes length + 4 bytes 'IHDR' + 8 bytes width/height)
  const isIhdr =
    buffer[12] === 0x49 && buffer[13] === 0x48 && buffer[14] === 0x44 && buffer[15] === 0x52;

  const width = isIhdr ? buffer.readUInt32BE(16) : 0;
  const height = isIhdr ? buffer.readUInt32BE(20) : 0;

  return { validMagic, width, height };
}

test.describe('Phase 2.s §2: Canvas exportPNG E2E Gate', () => {
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
    });
  });

  test('export 3-shape scene, decode PNG header, assert dimensions, non-empty, and store untouched', async ({ page }) => {
    // 1. Create 3 shapes on canvas
    const { id1, id2, id3 } = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s1 = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 120, height: 80, fill: '#3b82f6' },
      });
      const s2 = editor.createShape({
        type: 'note',
        x: 260,
        y: 100,
        props: { width: 140, height: 100, color: '#fef08a', text: 'Sticky Note' },
      });
      const s3 = editor.createShape({
        type: 'frame',
        x: 440,
        y: 100,
        props: { width: 200, height: 160, title: 'Container Frame' },
      });

      // Append test label chip into overlay slot of s1
      const slot = editor.getOverlaySlot(s1.id);
      if (slot) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'export-test-chip');
        text.setAttribute('x', '0');
        text.setAttribute('y', '0');
        text.setAttribute('fill', '#ffffff');
        text.textContent = 'CHIP_LABEL';
        slot.appendChild(text);
      }

      return { id1: s1.id, id2: s2.id, id3: s3.id };
    });

    // 2. Snapshot store before export
    const snapshotBefore = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      return JSON.stringify(editor.store.getSnapshot());
    });

    // 3. Export PNG (default view, chips on)
    const pngBase64 = await page.evaluate(async () => {
      const editor = (window as any).__od_debug__.editor;
      const blob: Blob = await editor.exportPNG({ chips: true });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    });

    const buffer = Buffer.from(pngBase64, 'base64');
    expect(buffer.length).toBeGreaterThan(100);

    // 4. Assert valid PNG header and dimensions
    const { validMagic, width, height } = parsePngHeader(buffer);
    expect(validMagic).toBe(true);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);

    // 5. Assert store is byte-for-byte untouched (zero mutation)
    const snapshotAfter = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      return JSON.stringify(editor.store.getSnapshot());
    });
    expect(snapshotAfter).toBe(snapshotBefore);

    // 6. Assert overlay invariant holds post-export
    const invariantCheck = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const wrapper = document.querySelector(`.od-shape[data-id="${id}"]`) as SVGGElement | null;
      const slot = editor.getOverlaySlot(id);
      if (!wrapper || !slot) return { error: 'Element missing' };
      const wRect = wrapper.getBoundingClientRect();
      return {
        isLastChild: wrapper.lastElementChild === slot,
        hasNoTransform: slot.getAttribute('transform') === null,
        chipPresent: slot.querySelector('.export-test-chip') !== null,
      };
    }, id1);

    expect(invariantCheck.isLastChild).toBe(true);
    expect(invariantCheck.hasNoTransform).toBe(true);
    expect(invariantCheck.chipPresent).toBe(true);
  });

  test('chips-on vs chips-off produce different bytes and overlay restored intact', async ({ page }) => {
    // 1. Create a scene with a prominent chip overlay
    const shapeId = await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      const s = editor.createShape({
        type: 'rect',
        x: 100,
        y: 100,
        props: { width: 200, height: 120, fill: '#1e293b' },
      });
      const slot = editor.getOverlaySlot(s.id);
      if (slot) {
        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        badge.setAttribute('class', 'large-test-chip');
        badge.setAttribute('x', '10');
        badge.setAttribute('y', '10');
        badge.setAttribute('width', '100');
        badge.setAttribute('height', '50');
        badge.setAttribute('fill', '#ef4444');
        slot.appendChild(badge);
      }
      return s.id;
    });

    // 2. Export with chips
    const base64WithChips = await page.evaluate(async () => {
      const editor = (window as any).__od_debug__.editor;
      const blob: Blob = await editor.exportPNG({ chips: true });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    });

    // 3. Export without chips
    const base64WithoutChips = await page.evaluate(async () => {
      const editor = (window as any).__od_debug__.editor;
      const blob: Blob = await editor.exportPNG({ chips: false });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    });

    const bufWith = Buffer.from(base64WithChips, 'base64');
    const bufWithout = Buffer.from(base64WithoutChips, 'base64');

    expect(parsePngHeader(bufWith).validMagic).toBe(true);
    expect(parsePngHeader(bufWithout).validMagic).toBe(true);

    // Byte contents must differ because the red chip was present in one and hidden in the other
    expect(base64WithChips).not.toBe(base64WithoutChips);

    // Verify overlay element is restored and fully visible in DOM
    const isChipVisible = await page.evaluate((id) => {
      const editor = (window as any).__od_debug__.editor;
      const slot = editor.getOverlaySlot(id);
      const chip = slot?.querySelector('.large-test-chip') as SVGElement | null;
      return chip !== null && chip.style.display !== 'none';
    }, shapeId);
    expect(isChipVisible).toBe(true);
  });

  test('camera mode content exports tight bounding box around shapes', async ({ page }) => {
    await page.evaluate(() => {
      const editor = (window as any).__od_debug__.editor;
      // Shape positioned far from origin
      editor.createShape({
        type: 'rect',
        x: 500,
        y: 400,
        props: { width: 100, height: 100, fill: '#10b981' },
      });
    });

    const pngBase64 = await page.evaluate(async () => {
      const editor = (window as any).__od_debug__.editor;
      const blob: Blob = await editor.exportPNG({ camera: 'content' });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    });

    const buffer = Buffer.from(pngBase64, 'base64');
    const { validMagic, width, height } = parsePngHeader(buffer);

    expect(validMagic).toBe(true);
    // Width and height should tightly bound the 100x100 shape + 24px padding on each side = ~148px
    expect(width).toBe(148);
    expect(height).toBe(148);
  });
});
