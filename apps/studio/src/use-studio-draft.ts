// Studio draft persistence: localStorage auto-save + beforeunload warning (Audit v4 Finding D2).
import { useEffect } from "react";
import {
  createDocument,
  parseDocument,
  serializeDocument,
  type Document,
} from "@open-draw/document";

export const DRAFT_STORAGE_KEY = "opendraw:studio:draft";

function getLocalStorage(): Storage | undefined {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    // Storage access may be blocked
  }
  return undefined;
}

export function loadInitialDocument(): Document {
  try {
    const storage = getLocalStorage();
    if (storage) {
      const saved = storage.getItem(DRAFT_STORAGE_KEY);
      if (saved !== null && saved.trim().length > 0) {
        return parseDocument(saved);
      }
    }
  } catch {
    // Ignore corrupted drafts and fall back to empty document
  }
  return createDocument([]);
}

export function saveDraftDocument(doc: Document): void {
  try {
    const storage = getLocalStorage();
    if (storage) {
      if (Object.keys(doc.shapes).length > 0) {
        storage.setItem(DRAFT_STORAGE_KEY, serializeDocument(doc));
      } else {
        storage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  } catch {
    // Ignore localStorage quota or private-browsing access errors
  }
}

export function clearDraftDocument(): void {
  try {
    const storage = getLocalStorage();
    if (storage) {
      storage.removeItem(DRAFT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function useStudioDraft(documentRef: React.MutableRefObject<Document>): void {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      if (Object.keys(documentRef.current.shapes).length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [documentRef]);
}
