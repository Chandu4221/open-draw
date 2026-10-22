import { describe, expect, it } from 'vitest';
import { CanvasEditor } from '../editor.js';
import { KeyboardDispatcher } from './keyboard.js';

function sendKey(
  target: EventTarget,
  key: string,
  mods: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}
) {
  const ev = Object.assign(new Event('keydown'), {
    key,
    ctrlKey: mods.ctrl ?? false,
    shiftKey: mods.shift ?? false,
    altKey: mods.alt ?? false,
    metaKey: mods.meta ?? false,
    preventDefault: () => {},
  });
  target.dispatchEvent(ev);
}

describe('Keyboard Module & Commands', () => {
  it('nudges selected shapes with 500ms undo-merge', () => {
    const editor = new CanvasEditor();
    const target = new EventTarget();
    const dispatcher = new KeyboardDispatcher(editor);
    dispatcher.attach(target as any);

    const s1 = editor.createShape({ type: 'rect', x: 100, y: 100, props: { width: 50, height: 50 } });
    editor.selectShape(s1.id);

    // 5 rapid arrow presses in same direction
    for (let i = 0; i < 5; i++) {
      sendKey(target, 'ArrowRight');
    }

    const moved = editor.store.getShape(s1.id);
    expect(moved?.x).toBe(105);

    // Single undo reverts all 5 merged nudges
    expect(editor.canUndo()).toBe(true);
    editor.undo();
    const undone = editor.store.getShape(s1.id);
    expect(undone?.x).toBe(100);

    dispatcher.detach();
  });

  it('nudges 10px when Shift is held', () => {
    const editor = new CanvasEditor();
    const target = new EventTarget();
    const dispatcher = new KeyboardDispatcher(editor);
    dispatcher.attach(target as any);

    const s = editor.createShape({ type: 'rect', x: 50, y: 50, props: { width: 50, height: 50 } });
    editor.selectShape(s.id);

    sendKey(target, 'ArrowDown', { shift: true });
    const moved = editor.store.getShape(s.id);
    expect(moved?.y).toBe(60);

    dispatcher.detach();
  });

  it('deletes selected shapes on Delete / Backspace in one transaction', () => {
    const editor = new CanvasEditor();
    const target = new EventTarget();
    const dispatcher = new KeyboardDispatcher(editor);
    dispatcher.attach(target as any);

    const s1 = editor.createShape({ type: 'rect', x: 10, y: 10, props: { width: 10, height: 10 } });
    const s2 = editor.createShape({ type: 'rect', x: 20, y: 20, props: { width: 10, height: 10 } });
    editor.setSelection([s1.id, s2.id]);

    sendKey(target, 'Delete');
    expect(editor.store.getShape(s1.id)).toBeUndefined();
    expect(editor.store.getShape(s2.id)).toBeUndefined();
    expect(editor.selection).toEqual([]);

    editor.undo();
    expect(editor.store.getShape(s1.id)).toBeDefined();
    expect(editor.store.getShape(s2.id)).toBeDefined();

    dispatcher.detach();
  });

  it('duplicates selected shapes with +10, +10 offset on Mod+D', () => {
    const editor = new CanvasEditor();
    const target = new EventTarget();
    const dispatcher = new KeyboardDispatcher(editor);
    dispatcher.attach(target as any);

    const s1 = editor.createShape({ type: 'rect', x: 100, y: 100, props: { width: 50, height: 50 } });
    editor.selectShape(s1.id);

    sendKey(target, 'd', { ctrl: true });
    expect(editor.selection.length).toBe(1);
    const dupeId = editor.selection[0]!;
    expect(dupeId).not.toBe(s1.id);

    const dupe = editor.store.getShape(dupeId);
    expect(dupe?.x).toBe(110);
    expect(dupe?.y).toBe(110);

    dispatcher.detach();
  });

  it('supports clipboard copy and paste with +10, +10 offset', () => {
    const editor = new CanvasEditor();
    const target = new EventTarget();
    const dispatcher = new KeyboardDispatcher(editor);
    dispatcher.attach(target as any);

    const s = editor.createShape({ type: 'rect', x: 50, y: 50, props: { width: 20, height: 20 } });
    editor.selectShape(s.id);

    sendKey(target, 'c', { ctrl: true });
    sendKey(target, 'v', { ctrl: true });

    expect(editor.selection.length).toBe(1);
    const pastedId = editor.selection[0]!;
    expect(pastedId).not.toBe(s.id);
    const pasted = editor.store.getShape(pastedId);
    expect(pasted?.x).toBe(60);
    expect(pasted?.y).toBe(60);

    dispatcher.detach();
  });

  it('switches active tool on single-key shortcuts', () => {
    const editor = new CanvasEditor();
    const target = new EventTarget();
    const dispatcher = new KeyboardDispatcher(editor);
    dispatcher.attach(target as any);

    sendKey(target, 'r');
    expect(editor.getTool()).toBe('rect');

    sendKey(target, 'o');
    expect(editor.getTool()).toBe('ellipse');

    sendKey(target, 'v');
    expect(editor.getTool()).toBe('select');

    dispatcher.detach();
  });

  it('suspends shortcuts when editing mode is active', () => {
    const editor = new CanvasEditor();
    const target = new EventTarget();
    const dispatcher = new KeyboardDispatcher(editor);
    dispatcher.attach(target as any);

    editor.mode = 'editing';
    sendKey(target, 'r');
    expect(editor.getTool()).toBe('select');

    dispatcher.detach();
  });

  it('does not intercept Space or Enter when editing mode is active', () => {
    const editor = new CanvasEditor();
    const target = new EventTarget();
    const dispatcher = new KeyboardDispatcher(editor);
    dispatcher.attach(target as any);

    editor.mode = 'editing';
    let spacePrevented = false;
    let enterPrevented = false;

    target.dispatchEvent(
      Object.assign(new Event('keydown'), {
        key: ' ',
        preventDefault: () => { spacePrevented = true; },
      })
    );
    target.dispatchEvent(
      Object.assign(new Event('keydown'), {
        key: 'Enter',
        preventDefault: () => { enterPrevented = true; },
      })
    );

    expect(spacePrevented).toBe(false);
    expect(enterPrevented).toBe(false);

    dispatcher.detach();
  });
});

