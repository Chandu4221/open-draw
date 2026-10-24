export interface SemanticTypeDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly isContainer: boolean;
  readonly allowedParents?: readonly string[];
  readonly allowedChildren?: readonly string[];
  readonly defaultRole?: string;
}

export interface ShapeSemanticMeta {
  readonly type?: string;
  readonly name?: string;
  readonly role?: string;
}

/**
 * Standard semantic vocabulary table defined as pure data per Phase 3 §1.
 */
export const SEMANTIC_TYPES: Readonly<Record<string, SemanticTypeDefinition>> = Object.freeze({
  page: {
    id: 'page',
    label: 'Page',
    description: 'Top-level screen or artboard container',
    isContainer: true,
    allowedParents: [],
    allowedChildren: ['section', 'nav', 'footer', 'card', 'heading', 'text', 'image', 'button', 'annotation', 'row', 'modal', 'alert', 'tabs', 'table', 'list', 'divider', 'input'],
    defaultRole: 'region',
  },
  section: {
    id: 'section',
    label: 'Section',
    description: 'Major vertical slice of a page layout',
    isContainer: true,
    allowedParents: ['page'],
    allowedChildren: ['column', 'card', 'heading', 'text', 'button', 'image', 'nav', 'footer', 'annotation', 'row', 'modal', 'alert', 'tabs', 'table', 'list', 'divider', 'input', 'badge'],
    defaultRole: 'region',
  },
  column: {
    id: 'column',
    label: 'Column',
    description: 'Horizontal layout container inside a section',
    isContainer: true,
    allowedParents: ['section', 'row', 'footer'],
    allowedChildren: ['card', 'heading', 'text', 'button', 'image', 'annotation', 'row', 'alert', 'tabs', 'list', 'divider', 'input', 'select', 'checkbox', 'toggle', 'badge', 'avatar'],
    defaultRole: 'group',
  },
  card: {
    id: 'card',
    label: 'Card',
    description: 'Surface container grouping related content and actions',
    isContainer: true,
    allowedParents: ['page', 'section', 'column', 'row', 'modal', 'alert'],
    allowedChildren: ['heading', 'text', 'button', 'image', 'annotation', 'row', 'alert', 'tabs', 'table', 'list', 'divider', 'input', 'select', 'checkbox', 'toggle', 'badge', 'avatar'],
    defaultRole: 'article',
  },
  row: {
    id: 'row',
    label: 'Row',
    description: 'Horizontal flex layout container',
    isContainer: true,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'footer', 'modal', 'alert', 'list', 'table'],
    allowedChildren: ['card', 'heading', 'text', 'button', 'image', 'annotation', 'row', 'column', 'badge', 'avatar', 'divider', 'input', 'select', 'checkbox', 'toggle', 'tooltip'],
    defaultRole: 'group',
  },
  nav: {
    id: 'nav',
    label: 'Navigation',
    description: 'Navigation bar or header container',
    isContainer: true,
    allowedParents: ['page', 'section'],
    allowedChildren: ['button', 'text', 'image', 'row', 'avatar', 'badge', 'divider', 'input'],
    defaultRole: 'navigation',
  },
  footer: {
    id: 'footer',
    label: 'Footer',
    description: 'Document or section footer container',
    isContainer: true,
    allowedParents: ['page', 'section'],
    allowedChildren: ['row', 'column', 'nav', 'text', 'heading', 'button', 'image', 'annotation', 'divider', 'list', 'badge', 'avatar'],
    defaultRole: 'contentinfo',
  },
  modal: {
    id: 'modal',
    label: 'Modal',
    description: 'Overlay dialog or sheet container',
    isContainer: true,
    allowedParents: ['page'],
    allowedChildren: ['card', 'heading', 'text', 'button', 'input', 'select', 'checkbox', 'toggle', 'row', 'column', 'divider', 'badge', 'list', 'tabs', 'alert'],
    defaultRole: 'dialog',
  },
  alert: {
    id: 'alert',
    label: 'Alert',
    description: 'Prominent contextual callout or notice banner',
    isContainer: true,
    allowedParents: ['page', 'section', 'column', 'card', 'modal'],
    allowedChildren: ['heading', 'text', 'button', 'row', 'badge', 'divider', 'checkbox'],
    defaultRole: 'alert',
  },
  tabs: {
    id: 'tabs',
    label: 'Tabs',
    description: 'Segmented navigation tab group',
    isContainer: true,
    allowedParents: ['page', 'section', 'card', 'row', 'modal'],
    allowedChildren: ['button', 'text', 'card', 'row', 'badge'],
    defaultRole: 'tablist',
  },
  table: {
    id: 'table',
    label: 'Table',
    description: 'Tabular data grid container',
    isContainer: true,
    allowedParents: ['page', 'section', 'card', 'modal'],
    allowedChildren: ['row', 'text', 'heading', 'badge', 'button', 'divider'],
    defaultRole: 'table',
  },
  list: {
    id: 'list',
    label: 'List',
    description: 'Vertical list of items or entries',
    isContainer: true,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'footer', 'modal'],
    allowedChildren: ['text', 'card', 'row', 'button', 'badge', 'divider', 'image', 'avatar'],
    defaultRole: 'list',
  },
  heading: {
    id: 'heading',
    label: 'Heading',
    description: 'Structural title or header text',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'footer', 'row', 'modal', 'alert', 'table'],
    allowedChildren: [],
    defaultRole: 'heading',
  },
  text: {
    id: 'text',
    label: 'Text',
    description: 'Body paragraph or informational copy',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'footer', 'row', 'modal', 'alert', 'tabs', 'table', 'list'],
    allowedChildren: [],
    defaultRole: 'paragraph',
  },
  button: {
    id: 'button',
    label: 'Button',
    description: 'Interactive button or call-to-action',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'footer', 'row', 'modal', 'alert', 'tabs', 'list'],
    allowedChildren: [],
    defaultRole: 'button',
  },
  input: {
    id: 'input',
    label: 'Input',
    description: 'Form text or data input field',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'modal', 'alert', 'nav'],
    allowedChildren: [],
    defaultRole: 'textbox',
  },
  select: {
    id: 'select',
    label: 'Select',
    description: 'Dropdown selection menu',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'modal'],
    allowedChildren: [],
    defaultRole: 'combobox',
  },
  checkbox: {
    id: 'checkbox',
    label: 'Checkbox',
    description: 'Binary choice check control',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'modal', 'alert'],
    allowedChildren: [],
    defaultRole: 'checkbox',
  },
  toggle: {
    id: 'toggle',
    label: 'Toggle',
    description: 'Binary switch toggle control',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'modal'],
    allowedChildren: [],
    defaultRole: 'switch',
  },
  badge: {
    id: 'badge',
    label: 'Badge',
    description: 'Status label or small count indicator',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'nav', 'footer', 'modal', 'alert', 'list', 'table', 'tabs'],
    allowedChildren: [],
    defaultRole: 'status',
  },
  avatar: {
    id: 'avatar',
    label: 'Avatar',
    description: 'User avatar or visual profile indicator',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'nav', 'footer', 'list'],
    allowedChildren: [],
    defaultRole: 'img',
  },
  divider: {
    id: 'divider',
    label: 'Divider',
    description: 'Visual separation line or boundary',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'nav', 'footer', 'modal', 'alert', 'list', 'table'],
    allowedChildren: [],
    defaultRole: 'separator',
  },
  tooltip: {
    id: 'tooltip',
    label: 'Tooltip',
    description: 'Contextual hover hint label',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'row', 'button', 'modal'],
    allowedChildren: [],
    defaultRole: 'tooltip',
  },
  image: {
    id: 'image',
    label: 'Image',
    description: 'Graphic illustration, photo, or visual asset',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'footer', 'row', 'modal', 'list'],
    allowedChildren: [],
    defaultRole: 'img',
  },
  annotation: {
    id: 'annotation',
    label: 'Annotation',
    description: 'Freehand sketch, markup note, or arrow connector',
    isContainer: false,
    allowedParents: undefined,
    allowedChildren: [],
    defaultRole: 'note',
  },
});

export function getSemanticType(id: string): SemanticTypeDefinition | undefined {
  return SEMANTIC_TYPES[id];
}

export function listSemanticTypes(): readonly SemanticTypeDefinition[] {
  return Object.values(SEMANTIC_TYPES);
}

/**
 * Validates the metadata namespace `semantic` when registered with CanvasStore.
 */
export function validateSemanticMeta(meta: unknown): boolean {
  if (typeof meta !== 'object' || meta === null) return false;
  const s = meta as Record<string, unknown>;
  if (s.type !== undefined && typeof s.type !== 'string') return false;
  if (s.name !== undefined && typeof s.name !== 'string') return false;
  if (s.role !== undefined && typeof s.role !== 'string') return false;
  return true;
}
