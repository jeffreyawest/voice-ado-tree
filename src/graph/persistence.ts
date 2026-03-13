import type { WorkItemTree } from "./types";

const STORAGE_KEY = "voice-tree-state";

export function loadTree(): WorkItemTree | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Guard against stale data from old format (persons/relationships)
    if (!Array.isArray(parsed.items)) return null;
    return parsed as WorkItemTree;
  } catch {
    return null;
  }
}

export function saveTree(tree: WorkItemTree): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
}

export function clearPersistedTree(): void {
  localStorage.removeItem(STORAGE_KEY);
}
