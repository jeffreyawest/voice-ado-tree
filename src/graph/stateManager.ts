import { v4 as uuid } from "uuid";
import type { WorkItemTree, WorkItem, WorkItemType } from "./types";
import { loadTree, saveTree, clearPersistedTree } from "./persistence";

interface LLMWorkItem {
  title: string;
  type: WorkItemType;
  parent_title?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: number | null;
  assignee?: string | null;
  tags?: string[] | null;
}

function emptyTree(): WorkItemTree {
  return { items: [], lastUpdated: new Date().toISOString() };
}

export function createStateManager(onChange: (tree: WorkItemTree) => void) {
  let tree: WorkItemTree = loadTree() ?? emptyTree();
  const undoStack: WorkItemTree[] = [];

  function emit() {
    tree.lastUpdated = new Date().toISOString();
    saveTree(tree);
    onChange(structuredClone(tree));
  }

  function snapshot() {
    undoStack.push(structuredClone(tree));
  }

  return {
    getTree: () => structuredClone(tree),

    /** Replace the entire tree from LLM output */
    replaceTree(llmItems: LLMWorkItem[]) {
      snapshot();

      // Build items with UUIDs, resolving parent_title to parentId
      const items: WorkItem[] = [];
      const titleToId = new Map<string, string>();

      // First pass: assign IDs
      for (const li of llmItems) {
        const id = uuid();
        titleToId.set(li.title.toLowerCase().trim(), id);
        items.push({
          id,
          title: li.title,
          type: li.type,
          description: li.description ?? undefined,
          parentId: undefined, // resolved in second pass
          status: (li.status as WorkItem["status"]) ?? "new",
          priority: li.priority ?? undefined,
          assignee: li.assignee ?? undefined,
          tags: li.tags?.length ? li.tags : undefined,
        });
      }

      // Second pass: resolve parent references
      for (let i = 0; i < llmItems.length; i++) {
        const parentTitle = llmItems[i].parent_title;
        if (parentTitle) {
          const parentId = titleToId.get(parentTitle.toLowerCase().trim());
          if (parentId) items[i].parentId = parentId;
        }
      }

      tree = { items, lastUpdated: new Date().toISOString() };
      emit();
    },

    undo() {
      const prev = undoStack.pop();
      if (!prev) return;
      tree = prev;
      emit();
    },

    clear() {
      snapshot();
      tree = emptyTree();
      clearPersistedTree();
      emit();
    },

    init() {
      onChange(structuredClone(tree));
    },
  };
}

export type StateManager = ReturnType<typeof createStateManager>;
