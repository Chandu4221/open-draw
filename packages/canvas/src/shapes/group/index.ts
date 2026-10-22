import type { ShapeDefinition } from '../../registry.js';
import type { GroupProps } from './defs.js';
import { groupGeometry } from './geometry.js';
import { renderGroup, updateGroup } from './render.js';

export * from './defs.js';
export * from './geometry.js';
export * from './render.js';

export const groupDefinition: ShapeDefinition<GroupProps> = {
  type: 'group',
  defaultProps(): GroupProps {
    return {};
  },
  geometry: groupGeometry,
  render: renderGroup,
  update: updateGroup,
  capabilities: {
    group: {
      isGroup: true,
      getMembers(shape) {
        return (shape.props?.memberIds as readonly string[]) ?? [];
      },
    },
  },
};
