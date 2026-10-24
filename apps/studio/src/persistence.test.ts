import { describe, it, expect, beforeEach } from 'vitest';
import {
  migrateDocument,
  CorruptDocumentError,
  CURRENT_DOCUMENT_VERSION,
  AutosaveManager,
  STORAGE_KEY,
} from './persistence.js';
import type { Snapshot } from '@open-draw/schema';

const memoryStore = new Map<string, string>();
const mockStorage = {
  getItem: (k: string) => memoryStore.get(k) ?? null,
  setItem: (k: string, v: string) => { memoryStore.set(k, v); },
  removeItem: (k: string) => { memoryStore.delete(k); },
  clear: () => { memoryStore.clear(); },
  key: (i: number) => Array.from(memoryStore.keys())[i] ?? null,
  length: 0,
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    configurable: true,
    writable: true,
  });
}

describe('Studio Persistence & Migration Engine (§1.3)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a valid v1 document without modification or warnings', () => {
    const v1Doc: Snapshot = {
      version: 1,
      shapes: [
        {
          id: 'shape-1',
          type: 'rect',
          x: 10,
          y: 20,
          rotation: 0,
          props: { width: 100, height: 80, fill: '#3b82f6' },
          meta: { semantic: { type: 'card', name: 'User Card' } },
        },
      ],
      camera: { x: 50, y: 50, zoom: 1.5 },
    };

    const res = migrateDocument(v1Doc);
    expect(res.snapshot.version).toBe(CURRENT_DOCUMENT_VERSION);
    expect(res.snapshot.shapes).toHaveLength(1);
    expect(res.snapshot.shapes[0]!.id).toBe('shape-1');
    expect(res.snapshot.camera?.zoom).toBe(1.5);
    expect(res.warnings).toHaveLength(0);
    expect(res.migratedFrom).toBe(1);
  });

  it('throws CorruptDocumentError on null, non-object, or corrupt input', () => {
    expect(() => migrateDocument(null)).toThrow(CorruptDocumentError);
    expect(() => migrateDocument(undefined)).toThrow(CorruptDocumentError);
    expect(() => migrateDocument('not-json')).toThrow(CorruptDocumentError);
    expect(() => migrateDocument(12345)).toThrow(CorruptDocumentError);
  });

  it('throws CorruptDocumentError when version field is missing or non-numeric', () => {
    expect(() => migrateDocument({})).toThrow(CorruptDocumentError);
    expect(() => migrateDocument({ version: 'v1', shapes: [] })).toThrow(CorruptDocumentError);
    expect(() => migrateDocument({ shapes: [] })).toThrow(CorruptDocumentError);
  });

  it('handles unknown future versions gracefully with explicit warning', () => {
    const futureDoc = {
      version: 99,
      shapes: [
        {
          id: 'future-shape',
          type: 'rect',
          x: 0,
          y: 0,
          rotation: 0,
          props: { width: 50, height: 50 },
          meta: {},
        },
      ],
      camera: { x: 0, y: 0, zoom: 1 },
    };

    const res = migrateDocument(futureDoc);
    expect(res.snapshot.shapes).toHaveLength(1);
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]).toContain('Document version 99 is newer than current app version');
  });

  it('AutosaveManager persists debounced snapshot to localStorage', async () => {
    const manager = new AutosaveManager(10);
    const mockSnap: Snapshot = {
      version: 1,
      shapes: [],
      camera: { x: 0, y: 0, zoom: 1 },
    };

    manager.schedule(() => mockSnap);

    // Immediate check before debounce fires
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // Wait for timer
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    const loaded = manager.load();
    expect(loaded).not.toBeNull();
    expect(loaded?.version).toBe(1);
  });
});
