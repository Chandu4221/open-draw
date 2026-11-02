// Pure function determining whether a keyboard event should be handled (R-008, R-011).
// Framework-free, contains zero DOM types.
import type { KeyboardEventDescriptor } from "./keyboard";

export function shouldHandleKeyEvent(
  event: KeyboardEventDescriptor,
  isEditableTarget?: boolean,
): boolean {
  if (isEditableTarget ?? event.isEditableTarget) {
    return false;
  }
  return true;
}
