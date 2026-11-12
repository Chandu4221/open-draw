import type { PlatformProfile, SemanticDefinition } from "@open-draw/contracts";

export const CATEGORY_TITLES: Record<string, string> = {
  layout: "Layout & Structure",
  navigation: "Navigation",
  marketing: "Marketing & Landing",
  ecommerce: "E-Commerce",
  auth: "Authentication & Account",
  interactive: "Interactive Controls",
  forms: "Forms & Inputs",
  data: "Data & Visualization",
  content: "Content & Typography",
  feedback: "Feedback & Overlays",
  other: "Other Components",
};

export const CATEGORY_ORDER = [
  "layout",
  "navigation",
  "marketing",
  "ecommerce",
  "auth",
  "interactive",
  "forms",
  "data",
  "content",
  "feedback",
  "other",
] as const;

export interface SemanticGroup {
  readonly category: string;
  readonly title: string;
  readonly items: readonly SemanticDefinition[];
}

export function groupProfileSemantics(
  activeProfile: PlatformProfile | undefined,
): readonly SemanticGroup[] {
  if (!activeProfile) return [];
  const groups = new Map<string, SemanticDefinition[]>();
  const allDefs = Object.values(activeProfile.semantics)
    .filter((def) => def.id !== activeProfile.rootSemantic)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  for (const def of allDefs) {
    const cat = def.category ?? "other";
    const list = groups.get(cat);
    if (list) {
      list.push(def);
    } else {
      groups.set(cat, [def]);
    }
  }

  return CATEGORY_ORDER.filter((cat) => groups.has(cat)).map((cat) => ({
    category: cat,
    title: CATEGORY_TITLES[cat] ?? cat,
    items: groups.get(cat) ?? [],
  }));
}

const RECENT_STORAGE_KEY = "open-draw:recent-semantics";
const MAX_RECENT = 5;

function getLocalStorage(): Storage | undefined {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      return (globalThis as unknown as { localStorage: Storage }).localStorage;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function getStorageKey(profileId?: string): string {
  return profileId ? `${RECENT_STORAGE_KEY}:${profileId}` : RECENT_STORAGE_KEY;
}

export function loadRecentSemanticTags(profileId?: string): readonly string[] {
  try {
    const storage = getLocalStorage();
    if (!storage) return [];
    const raw = storage.getItem(getStorageKey(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecentSemanticTag(tag: string, profileId?: string): void {
  if (!tag) return;
  try {
    const storage = getLocalStorage();
    if (!storage) return;
    const existing = loadRecentSemanticTags(profileId).filter((t) => t !== tag);
    const updated = [tag, ...existing].slice(0, MAX_RECENT);
    storage.setItem(getStorageKey(profileId), JSON.stringify(updated));
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export function resolveRecentDefinitions(
  activeProfile: PlatformProfile | undefined,
  recentTags: readonly string[],
): readonly SemanticDefinition[] {
  if (!activeProfile) return [];
  return recentTags
    .map((tag) => activeProfile.semantics[tag])
    .filter((def): def is SemanticDefinition => Boolean(def));
}

export interface FlatSemanticOption {
  readonly id: string;
  readonly displayName: string;
  readonly category?: string | undefined;
}

export function filterSemanticDefinitions(
  allDefs: readonly SemanticDefinition[],
  query: string,
): readonly SemanticDefinition[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];
  return allDefs
    .filter(
      (d) =>
        d.displayName.toLowerCase().includes(clean) ||
        d.id.toLowerCase().includes(clean) ||
        Boolean(d.category && d.category.toLowerCase().includes(clean)),
    )
    .sort((a, b) => {
      const aStarts =
        a.displayName.toLowerCase().startsWith(clean) || a.id.toLowerCase().startsWith(clean);
      const bStarts =
        b.displayName.toLowerCase().startsWith(clean) || b.id.toLowerCase().startsWith(clean);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
}

export interface BuildFlatSemanticOptionsArgs {
  readonly placeholder: string;
  readonly query: string;
  readonly recentDefs: readonly SemanticDefinition[];
  readonly groupedSemantics: readonly SemanticGroup[];
  readonly filteredMatches: readonly SemanticDefinition[];
  readonly selectedTag: string;
  readonly activeProfile: PlatformProfile | undefined;
}

export function buildFlatSemanticOptions(
  args: BuildFlatSemanticOptionsArgs,
): readonly FlatSemanticOption[] {
  const {
    placeholder,
    query,
    recentDefs,
    groupedSemantics,
    filteredMatches,
    selectedTag,
    activeProfile,
  } = args;
  const list: FlatSemanticOption[] = [{ id: "", displayName: placeholder }];
  const clean = query.trim().toLowerCase();

  if (!clean) {
    for (const def of recentDefs) {
      list.push({ id: def.id, displayName: def.displayName });
    }
    if (selectedTag && !activeProfile?.semantics[selectedTag]) {
      list.push({ id: selectedTag, displayName: `[Foreign] ${selectedTag}` });
    }
    for (const group of groupedSemantics) {
      for (const item of group.items) {
        list.push({
          id: item.id,
          displayName: item.displayName,
          category: group.title,
        });
      }
    }
  } else {
    for (const item of filteredMatches) {
      list.push({
        id: item.id,
        displayName: item.displayName,
        ...(item.category ? { category: item.category } : {}),
      });
    }
  }

  return list;
}

export function getNextHighlightedIndex(current: number, total: number, delta: 1 | -1): number {
  if (total <= 0) return 0;
  return (current + delta + total) % total;
}
