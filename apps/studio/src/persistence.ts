import type { Snapshot, ShapeRecord } from '@open-draw/schema';

export const CURRENT_DOCUMENT_VERSION = 1;
export const STORAGE_KEY = 'opendraw_studio_doc_v1';

export class CorruptDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorruptDocumentError';
  }
}

export type MigrationStep = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Pure migration table mapping version numbers to transformation functions.
 * Future format changes add a pure step here: v1 -> v2, v2 -> v3, etc.
 */
export const MIGRATION_TABLE: Record<number, MigrationStep> = {
  // v1 is current canonical version; no prior migrations required
};

export interface MigrationResult {
  readonly snapshot: Snapshot;
  readonly migratedFrom: number;
  readonly warnings: readonly string[];
}

/**
 * Pure migration runner: validates and migrates any JSON document to current version.
 */
export function migrateDocument(data: unknown): MigrationResult {
  if (!data || typeof data !== 'object') {
    throw new CorruptDocumentError('Document data is null or not a valid JSON object');
  }

  const raw = { ...(data as Record<string, unknown>) };
  const rawVersion = raw['version'];

  if (typeof rawVersion !== 'number' || !Number.isFinite(rawVersion)) {
    throw new CorruptDocumentError('Document is missing a valid numeric "version" field');
  }

  const warnings: string[] = [];

  // Unknown future version guard (§1.3 edge case)
  if (rawVersion > CURRENT_DOCUMENT_VERSION) {
    warnings.push(`Document version ${rawVersion} is newer than current app version ${CURRENT_DOCUMENT_VERSION}. Best-effort load.`);
    return {
      snapshot: sanitizeSnapshot(raw),
      migratedFrom: rawVersion,
      warnings,
    };
  }

  // Apply sequential migrations
  let currentVersion = rawVersion;
  let currentDoc = raw;

  while (currentVersion < CURRENT_DOCUMENT_VERSION) {
    const step = MIGRATION_TABLE[currentVersion];
    if (step) {
      currentDoc = step(currentDoc);
    }
    currentVersion++;
  }

  return {
    snapshot: sanitizeSnapshot(currentDoc),
    migratedFrom: rawVersion,
    warnings,
  };
}

function sanitizeSnapshot(doc: Record<string, unknown>): Snapshot {
  const shapes = Array.isArray(doc['shapes']) ? (doc['shapes'] as ShapeRecord[]) : [];
  const camera = (doc['camera'] && typeof doc['camera'] === 'object')
    ? (doc['camera'] as Snapshot['camera'])
    : { x: 0, y: 0, zoom: 1 };
  const meta = (doc['meta'] && typeof doc['meta'] === 'object')
    ? (doc['meta'] as Record<string, unknown>)
    : undefined;

  return {
    version: CURRENT_DOCUMENT_VERSION,
    shapes,
    camera,
    meta,
  };
}

/**
 * Debounced autosave manager to ensure smooth, non-blocking localStorage persistence.
 */
export class AutosaveManager {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly delayMs: number;

  constructor(delayMs = 300) {
    this.delayMs = delayMs;
  }

  schedule(getSnapshot: () => Snapshot): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      try {
        const snap = getSnapshot();
        const storage = typeof localStorage !== 'undefined' ? localStorage : null;
        storage?.setItem(STORAGE_KEY, JSON.stringify(snap));
      } catch (err) {
        console.warn('Autosave to localStorage failed:', err);
      }
    }, this.delayMs);
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  load(): Snapshot | null {
    try {
      const storage = typeof localStorage !== 'undefined' ? localStorage : null;
      const raw = storage?.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return migrateDocument(parsed).snapshot;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      const storage = typeof localStorage !== 'undefined' ? localStorage : null;
      storage?.removeItem(STORAGE_KEY);
    } catch {
      // Ignored in headless/unsupported environments
    }
  }
}

