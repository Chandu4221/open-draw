import { isRootId } from "@open-draw/canvas";
import type { ThemePalette } from "@open-draw/profiles";
import { COMMANDS, type Command, type Shape } from "@open-draw/canvas";

export interface RootThemeMutationsProps {
  readonly selectedShape: Shape | undefined;
  readonly rootShape: Shape | undefined;
  readonly commit: (commands: readonly Command[]) => void;
  readonly render: () => void;
}

export interface RootThemeMutations {
  readonly handleSetTheme: (theme: ThemePalette | undefined) => void;
  readonly handleSetDarkMode: (darkMode: boolean) => void;
}

export function useRootThemeMutations(props: RootThemeMutationsProps): RootThemeMutations {
  const { selectedShape, rootShape, commit, render } = props;

  function getTargetRoot(): Shape | undefined {
    return selectedShape && isRootId(selectedShape.parentId) ? selectedShape : rootShape;
  }

  function handleSetTheme(theme: ThemePalette | undefined): void {
    const targetRoot = getTargetRoot();
    if (!targetRoot) return;
    commit([{ type: COMMANDS.setRootTheme, id: targetRoot.id, theme: theme ? theme : null }]);
    render();
  }

  function handleSetDarkMode(darkMode: boolean): void {
    const targetRoot = getTargetRoot();
    if (!targetRoot) return;
    commit([{ type: COMMANDS.setRootDarkMode, id: targetRoot.id, darkMode }]);
    render();
  }

  return {
    handleSetTheme,
    handleSetDarkMode,
  };
}
