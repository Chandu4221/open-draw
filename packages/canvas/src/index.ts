/// @open-draw/canvas — public SDK contract surface (R-004, R-010, R-036, ADR-0008).
/// Pure interaction core and batteries-included visual canvas controller.

export {
  type Camera,
  DEFAULT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  panBy,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from "./camera";

export {
  type CanvasEvent,
  CANVAS_EVENTS,
  CONTROLLER_EVENTS,
  type ControllerEvent,
  type DoubleClickEvent,
  type KeyEscapeEvent,
  type PointerDownEvent,
  type PointerMoveEvent,
  type PointerUpEvent,
  type CanvasWheelEvent,
  type WheelEvent, // deprecated alias
} from "./events";

export { CanvasError, CANVAS_ERRORS, type CanvasErrorCode } from "./errors";

export {
  MIN_SHAPE_SIZE,
  flipHandle,
  normalizeBox,
  resizeBox,
  resizeBoxWithHandle,
  unionBoxes,
} from "./geometry";

export { type GestureKind, GESTURE_KINDS } from "./gestures";

export { type HandleId, HANDLES } from "./handles";

export {
  boxIntersectsBox,
  HANDLE_PICK_RADIUS_PX,
  pickHandle,
  pickShape,
  pickShapesInBox,
  pointInBox,
  resolveSelectionDrillDown,
} from "./hit-test";

export { INITIAL_MACHINE_STATE, type MachineState, transition } from "./machine";

export {
  createShapeKindRegistry,
  registerShapeKind,
  type ShapeHitTester,
  type ShapeKindRegistration,
  type ShapeKindRegistry,
  validateRegistration,
} from "./register-shape-kind";

export {
  clearSelection,
  EMPTY_SELECTION,
  isSelected,
  type Selection,
  selectMany,
  selectOne,
  selectedIds,
  singleSelected,
  toggleSelection,
} from "./selection";

export { type CanvasStateId, STATES } from "./states";

export { TOOLS, type ToolId } from "./tools";

export { type CanvasController, type CanvasOptions, createCanvas } from "./create-canvas";

export {
  createEditor,
  type Editor,
  type EditorOptions,
  type EditorOverlayContext,
  type SetDocumentOptions,
} from "./editor";

export { exportDocumentToSvg, type SvgExportOptions } from "./editor-export";

export { mountInlineTextEditor, type InlineTextEditorOptions } from "./editor-text";

export {
  createShapeIdGenerator,
  type ShapeIdGenerator,
  type ShapeIdSequence,
  type NestingMode,
} from "./editor-gestures";

export { DEFAULT_SHAPE_REGISTRATIONS } from "./default-shapes";

// Re-exported core contracts (ADR-0008 D1)
export {
  type BoundingBox,
  type CapabilityId,
  CAPABILITIES,
  type CustomShapeKind,
  type DeviceType,
  DEVICE_TYPES,
  type Point,
  type ShapeId,
  parseShapeId,
  ROOT_ID,
  isRootId,
  type ShapeKind,
  type BuiltinShapeKind,
  SHAPE_KINDS,
  SHAPE_KIND_LABELS,
  type StyleId,
  STYLE_PROFILES,
  type PlatformId,
  PLATFORMS,
} from "@open-draw/contracts";

// Re-exported document operations (ADR-0008 D1)
export {
  createDocument,
  type Document,
  type Shape,
  type PageShape,
  type SectionShape,
  type RectShape,
  type EllipseShape,
  type LineShape,
  type PenPathShape,
  type TextShape,
  type SerializedDocument,
  serializeDocument,
  parseDocument,
  createTransaction,
  applyTransaction,
  type Transaction,
  type TransactionResult,
  type Command,
  COMMANDS,
  type CommandId,
  shapeListInOrder,
  ancestorsOf,
  childrenOf,
  subtreeOf,
  absoluteBoundingBox,
  createPage,
  createSection,
  createRect,
  createEllipse,
  createLine,
  createPenPath,
  createText,
  createCustomShape,
} from "@open-draw/document";

// Re-exported built-in shapes (ADR-0008 D1)
export {
  RECT_KIND,
  RECT_CAPABILITIES,
  hitTestRect,
  ELLIPSE_KIND,
  ELLIPSE_CAPABILITIES,
  hitTestEllipse,
  LINE_KIND,
  LINE_CAPABILITIES,
  hitTestLine,
  PEN_PATH_KIND,
  PEN_PATH_CAPABILITIES,
  hitTestPenPath,
  TEXT_KIND,
  TEXT_CAPABILITIES,
  hitTestText,
  BUILTIN_SHAPE_CAPABILITIES,
} from "@open-draw/shapes";

// Re-exported SVG renderer (ADR-0008 D1)
export {
  documentToSvg,
  shapeToSvg,
  fallbackShapeToSvg,
  RENDER_STYLES,
  type RenderOptions,
  type ShapeSvgRenderer,
  type RendererFallbackEvent,
} from "@open-draw/renderer-svg";

// Re-exported input bindings (ADR-0008 D1)
export {
  resolveKeyBinding,
  ACTIONS,
  type ActionId,
  DEFAULT_KEY_BINDINGS,
  type KeyBinding,
  type KeyboardEventDescriptor,
  shouldHandleKeyEvent,
} from "@open-draw/input";
