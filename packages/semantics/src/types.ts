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
    allowedChildren: ['section', 'nav', 'card', 'heading', 'text', 'image', 'button', 'annotation', 'row'],
    defaultRole: 'region',
  },
  section: {
    id: 'section',
    label: 'Section',
    description: 'Major vertical slice of a page layout',
    isContainer: true,
    allowedParents: ['page'],
    allowedChildren: ['column', 'card', 'heading', 'text', 'button', 'image', 'nav', 'annotation', 'row'],
    defaultRole: 'region',
  },
  column: {
    id: 'column',
    label: 'Column',
    description: 'Horizontal layout container inside a section',
    isContainer: true,
    allowedParents: ['section', 'row'],
    allowedChildren: ['card', 'heading', 'text', 'button', 'image', 'annotation', 'row'],
    defaultRole: 'group',
  },
  card: {
    id: 'card',
    label: 'Card',
    description: 'Surface container grouping related content and actions',
    isContainer: true,
    allowedParents: ['page', 'section', 'column', 'row'],
    allowedChildren: ['heading', 'text', 'button', 'image', 'annotation', 'row'],
    defaultRole: 'article',
  },
  row: {
    id: 'row',
    label: 'Row',
    description: 'Horizontal flex layout container',
    isContainer: true,
    allowedParents: ['page', 'section', 'column', 'card'],
    allowedChildren: ['card', 'heading', 'text', 'button', 'image', 'annotation', 'row', 'column'],
    defaultRole: 'group',
  },
  nav: {
    id: 'nav',
    label: 'Navigation',
    description: 'Navigation bar or header container',
    isContainer: true,
    allowedParents: ['page', 'section'],
    allowedChildren: ['button', 'text', 'image', 'row'],
    defaultRole: 'navigation',
  },
  heading: {
    id: 'heading',
    label: 'Heading',
    description: 'Structural title or header text',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'row'],
    allowedChildren: [],
    defaultRole: 'heading',
  },
  text: {
    id: 'text',
    label: 'Text',
    description: 'Body paragraph or informational copy',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'row'],
    allowedChildren: [],
    defaultRole: 'paragraph',
  },
  button: {
    id: 'button',
    label: 'Button',
    description: 'Interactive button or call-to-action',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'row'],
    allowedChildren: [],
    defaultRole: 'button',
  },
  image: {
    id: 'image',
    label: 'Image',
    description: 'Graphic illustration, photo, or visual asset',
    isContainer: false,
    allowedParents: ['page', 'section', 'column', 'card', 'nav', 'row'],
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
