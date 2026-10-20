/**
 * @open-draw/canvas
 * DOM Canvas engine — every shape a real SVG/DOM element.
 */

export * from './store.js';
export * from './camera.js';

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
