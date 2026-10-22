/**
 * @open-draw/canvas
 * DOM Canvas engine — every shape a real SVG/DOM element.
 */

export * from './store/index.js';
export * from './camera.js';
export * from './editor.js';
export * from './renderer.js';
export * from './registry.js';
export * from './shapes/rect/index.js';
export * from './shapes/ellipse/index.js';
export * from './shapes/note/index.js';
export * from './shapes/image/index.js';
export * from './shapes/text/index.js';
export * from './shapes/frame/index.js';
export * from './shapes/arrow/index.js';
export * from './shapes/ink/index.js';
export * from './shapes/group/index.js';
export * from './capabilities/text-editing/index.js';
export * from './capabilities/clipping/index.js';
export * from './capabilities/connector/index.js';
export * from './selection/index.js';
export * from './input/index.js';
export * from './eraser/index.js';

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
