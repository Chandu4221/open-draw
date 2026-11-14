import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import type {
  CanvasController,
  Document,
  Editor,
  MachineState,
  Point,
  ShapeId,
} from "@open-draw/canvas";
import { attachCanvasHoverListeners, pickHoveredShape, useCanvasHover } from "./use-canvas-hover";

interface MockEditorWithControls extends Editor {
  readonly setMachineState: (st: Partial<MachineState>) => void;
  readonly listeners: Record<string, ((e: Event) => void)[]>;
}

function createMockEditor(): MockEditorWithControls {
  const listeners: Record<string, ((e: Event) => void)[]> = {};
  const svg = {
    getBoundingClientRect: () => ({
      left: 10,
      top: 20,
      width: 800,
      height: 600,
      right: 810,
      bottom: 620,
      x: 10,
      y: 20,
      toJSON: () => {},
    }),
    addEventListener: vi.fn((event: string, fn: EventListenerOrEventListenerObject) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(fn as (e: Event) => void);
    }),
    removeEventListener: vi.fn((event: string, fn: EventListenerOrEventListenerObject) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((f) => f !== fn);
      }
    }),
  } as unknown as SVGSVGElement;

  let machineState: MachineState = {
    stateId: "idle",
    activeShapeId: null,
    activeHandleId: null,
    drawOrigin: null,
  };

  const canvas: Partial<CanvasController> = {
    getMachineState: () => machineState,
    screenToWorld: vi.fn((pt: Point) => ({ x: pt.x * 2, y: pt.y * 2 })),
    pickShape: vi.fn((_doc: Document, world: Point) => {
      if (world.x === 100 && world.y === 100) return "s-hit-1" as ShapeId;
      return null;
    }),
  };

  const mockDoc: Document = { schema: { version: 1 }, shapes: {} };

  const editor: Partial<Editor> = {
    svg,
    canvas: canvas as CanvasController,
    getDocument: () => mockDoc,
    render: vi.fn(),
  };

  return Object.assign(editor, {
    setMachineState: (st: Partial<MachineState>) => {
      machineState = { ...machineState, ...st };
    },
    listeners,
  }) as MockEditorWithControls;
}

describe("pickHoveredShape", () => {
  it("translates client coordinates to world and picks shape when idle", () => {
    const editor = createMockEditor();
    // clientX = 60, clientY = 70 -> screen = { x: 50, y: 50 } -> world = { x: 100, y: 100 } -> hit "s-hit-1"
    const hit = pickHoveredShape(editor, { x: 60, y: 70 });
    expect(hit).toBe("s-hit-1");
  });

  it("returns null when no shape is hit at world coordinates", () => {
    const editor = createMockEditor();
    const hit = pickHoveredShape(editor, { x: 200, y: 200 });
    expect(hit).toBeNull();
  });

  it("returns null when machine state is not idle (R-018)", () => {
    const editor = createMockEditor();
    editor.setMachineState({ stateId: "dragging-shape" });
    const hit = pickHoveredShape(editor, { x: 60, y: 70 });
    expect(hit).toBeNull();
  });
});

describe("attachCanvasHoverListeners", () => {
  it("attaches pointermove and pointerleave listeners to svg and forwards picked shapes", () => {
    const editor = createMockEditor();
    const onHover = vi.fn();

    const detach = attachCanvasHoverListeners({ editor, onHover });
    const listeners = editor.listeners;

    const moveHandlers = listeners.pointermove;
    const leaveHandlers = listeners.pointerleave;

    expect(moveHandlers).toBeDefined();
    expect(leaveHandlers).toBeDefined();
    expect(moveHandlers).toHaveLength(1);
    expect(leaveHandlers).toHaveLength(1);

    const onMove = moveHandlers?.[0];
    const onLeave = leaveHandlers?.[0];

    expect(onMove).toBeDefined();
    expect(onLeave).toBeDefined();

    // Simulate pointermove hit
    const pointerMoveEvent = {
      clientX: 60,
      clientY: 70,
    } as unknown as PointerEvent;
    onMove?.(pointerMoveEvent);
    expect(onHover).toHaveBeenCalledWith("s-hit-1");

    // Simulate pointerleave
    onLeave?.({} as Event);
    expect(onHover).toHaveBeenCalledWith(null);

    // Detach removes listeners
    detach();
    expect(editor.svg.removeEventListener).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(editor.svg.removeEventListener).toHaveBeenCalledWith(
      "pointerleave",
      expect.any(Function),
    );
  });
});

describe("useCanvasHover", () => {
  it("initializes with null hover state and renders in component", () => {
    const editor = createMockEditor();
    const editorRef = { current: editor };

    function HoverConsumer(): React.JSX.Element {
      const { hoveredShapeId } = useCanvasHover({ editor, editorRef });
      return <div data-hovered={hoveredShapeId ?? "none"} />;
    }

    const html = renderToString(<HoverConsumer />);
    expect(html).toContain('data-hovered="none"');
  });
});
