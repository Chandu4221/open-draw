import { vi } from "vitest";
import type { Point } from "@open-draw/canvas";

export class MockDomNode {
  readonly tagName: string;
  readonly style: Record<string, string> = {};
  readonly attributes: Record<string, string> = {};
  readonly children: MockDomNode[] = [];
  innerHTML = "";
  listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName;
  }

  setAttribute(name: string, val: string): void {
    this.attributes[name] = val;
  }

  appendChild(child: MockDomNode): void {
    this.children.push(child);
  }

  removeChild(child: MockDomNode): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
  }

  contains(child: MockDomNode): boolean {
    return this.children.includes(child);
  }

  querySelector<T extends MockDomNode>(selector: string): T | null {
    const className = selector.replace(/^\./, "");
    for (const child of this.children) {
      if (child.attributes["class"] === className) return child as unknown as T;
      const found = child.querySelector<T>(selector);
      if (found !== null) return found;
    }
    return null;
  }

  getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
    return { left: 0, top: 0, width: 800, height: 600 };
  }

  addEventListener(event: string, fn: (...args: unknown[]) => void): void {
    this.listeners[event] = this.listeners[event] ?? [];
    this.listeners[event]!.push(fn);
  }

  removeEventListener(event: string, fn: (...args: unknown[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]!.filter((f) => f !== fn);
    }
  }

  dispatchEvent(event: { type: string; [k: string]: unknown }): void {
    const handlers = this.listeners[event.type];
    if (handlers) {
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  setPointerCapture(): void {}
  releasePointerCapture(): void {}
  hasPointerCapture(): boolean {
    return false;
  }
}

export function dispatchPointer(node: MockDomNode, type: string, point: Point, button = 0): void {
  node.dispatchEvent({
    type,
    pointerId: 1,
    pointerType: "mouse",
    button,
    clientX: point.x,
    clientY: point.y,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    preventDefault: () => {},
    stopPropagation: () => {},
  });
}

export function setupMockDomEnvironment(): {
  readonly container: MockDomNode;
  readonly restore: () => void;
} {
  const originalDocument = (globalThis as unknown as { document?: unknown }).document;
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;

  const mockDoc = {
    createElementNS: (_ns: string, tag: string) => new MockDomNode(tag),
    createElement: (tag: string) => new MockDomNode(tag),
    body: new MockDomNode("body"),
  };
  const mockWin = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  (globalThis as unknown as { document: unknown }).document = mockDoc;
  (globalThis as unknown as { window: unknown }).window = mockWin;

  const container = new MockDomNode("div");

  const restore = () => {
    (globalThis as unknown as { document: unknown }).document = originalDocument;
    (globalThis as unknown as { window: unknown }).window = originalWindow;
  };

  return { container, restore };
}
