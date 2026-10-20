import type { ShapeDefinition } from '../../registry.js';
import type { NoteProps } from './defs.js';
import { noteGeometry } from './geometry.js';
import { renderNote, updateNote } from './render.js';

export * from './defs.js';
export * from './geometry.js';
export * from './render.js';

export const noteDefinition: ShapeDefinition<NoteProps> = {
  type: 'note',
  defaultProps(): NoteProps {
    return {
      width: 200,
      height: 160,
      color: '#fef08a',
      text: '',
    };
  },
  geometry: noteGeometry,
  render: renderNote,
  update: updateNote,
};
