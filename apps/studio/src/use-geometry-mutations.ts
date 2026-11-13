import type { BoundingBox } from "@open-draw/canvas";
import { COMMANDS, type Command, type Shape } from "@open-draw/canvas";

export interface GeometryMutationsProps {
  readonly selectedShape: Shape | undefined;
  readonly commit: (commands: readonly Command[]) => void;
  readonly render: () => void;
}

export interface GeometryMutations {
  readonly handleSetBoundingBox: (box: BoundingBox) => void;
}

export function useGeometryMutations(props: GeometryMutationsProps): GeometryMutations {
  const { selectedShape, commit, render } = props;

  function handleSetBoundingBox(boundingBox: BoundingBox): void {
    if (!selectedShape) return;
    commit([
      {
        type: COMMANDS.setShapeBoundingBox,
        id: selectedShape.id,
        boundingBox,
      },
    ]);
    render();
  }

  return {
    handleSetBoundingBox,
  };
}
