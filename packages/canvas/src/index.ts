/**
 * @open-draw/canvas
 * DOM Canvas engine — every shape a real SVG/DOM element.
 */

// DELIBERATE BITMAP VIOLATION FOR RED PROOF:
// DOM Canvas forbids getContext in render paths.
export function illegalBitmapHelper(c: HTMLCanvasElement) {
  return c.getContext('2d');
}

export interface CanvasEngineOptions {
  readonly readonly?: boolean;
}

export class DOMCanvasEngine {
  readonly options: CanvasEngineOptions;

  constructor(options: CanvasEngineOptions = {}) {
    this.options = options;
  }

  isReady(): boolean {
    return true;
  }
}
