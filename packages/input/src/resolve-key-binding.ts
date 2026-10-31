// Pure function resolving keyboard event descriptor to a registered action (R-008, R-011).
import type { ActionId } from "./actions";
import { DEFAULT_KEY_BINDINGS, type KeyBindings, type KeyboardEventDescriptor } from "./keyboard";

export function resolveKeyBinding(
  event: KeyboardEventDescriptor,
  bindings: KeyBindings = DEFAULT_KEY_BINDINGS,
): ActionId | undefined {
  const isCtrlOrMeta = Boolean(event.ctrlKey || event.metaKey);
  const isShift = Boolean(event.shiftKey);
  const isAlt = Boolean(event.altKey);

  for (const binding of bindings) {
    if (binding.code !== event.code) {
      continue;
    }
    if (Boolean(binding.ctrlOrMeta) !== isCtrlOrMeta) {
      continue;
    }
    if (Boolean(binding.shiftKey) !== isShift) {
      continue;
    }
    if (Boolean(binding.altKey) !== isAlt) {
      continue;
    }
    return binding.action;
  }

  return undefined;
}
