import type { Snapshot } from '@open-draw/schema';

const STORAGE_KEY = 'opendraw_playground_v2';

/**
 * Save current canvas snapshot to browser localStorage.
 */
export function saveToLocalStorage(snapshot: Snapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('Failed to save OpenDraw snapshot to localStorage:', err);
  }
}

/**
 * Load saved canvas snapshot from browser localStorage.
 */
export function loadFromLocalStorage(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.version === 'number' && Array.isArray(parsed.shapes)) {
      return parsed as Snapshot;
    }
  } catch (err) {
    console.warn('Failed to load OpenDraw snapshot from localStorage:', err);
  }
  return null;
}

/**
 * Clear saved snapshot from localStorage.
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear OpenDraw snapshot from localStorage:', err);
  }
}

/**
 * Download a Blob (such as exported PNG) as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export canvas snapshot as a JSON file download.
 */
export function exportSnapshotJSON(snapshot: Snapshot, filename = 'wireframe.opendraw.json'): void {
  const jsonStr = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/**
 * Read and parse an OpenDraw JSON snapshot file.
 */
export async function importSnapshotJSON(file: File): Promise<Snapshot> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed.version !== 'number' || !Array.isArray(parsed.shapes)) {
    throw new Error('Invalid OpenDraw snapshot format: missing version or shapes array');
  }
  return parsed as Snapshot;
}
