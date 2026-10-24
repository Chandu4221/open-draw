import type { ShapeDefinition } from '../../registry.js';
import type { TextProps } from './defs.js';
import { textGeometry } from './geometry.js';
import { renderText, updateText } from './render.js';

export * from './defs.js';
export * from './geometry.js';
export * from './render.js';

export const textDefinition: ShapeDefinition<TextProps> = {
  type: 'text',
  defaultProps(): TextProps {
    return {
      text: 'Text',
      fontSize: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: '#1e293b',
      width: 100,
      height: 30,
    };
  },
  geometry: textGeometry,
  render: renderText,
  update: updateText,
  capabilities: {
    text: {
      canEditText: () => true,
      getText: (shape) => shape.props.text,
      setText: (shape, newText) => {
        const lines = newText.split('\n');
        const maxLen = Math.max(...lines.map((l) => l.length), 1);
        const fontSize = shape.props.fontSize ?? 16;
        const width = Math.max(60, Math.round(maxLen * fontSize * 0.65 + 16));
        const height = Math.max(30, Math.round(lines.length * fontSize * 1.35 + 8));
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
