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
  capabilities: {
    text: {
      canEditText: () => true,
      getText: (shape) => shape.props.text ?? '',
      setText: (shape, newText) => {
        const lines = newText.split('\n');
        const maxLen = Math.max(...lines.map((l) => l.length), 1);
        const fontSize = 14;
        const width = Math.max(200, Math.round(maxLen * fontSize * 0.65 + 32));
        const height = Math.max(160, Math.round(lines.length * fontSize * 1.4 + 40));
        return {
          props: {
            ...shape.props,
            text: newText,
            width,
            height,
          },
        };
      },
    },
  },
};
