import type { WorkItemTree, WorkItemType } from "../graph/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

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

interface LLMResponse {
  items: LLMWorkItem[];
}

export async function extractWorkItems(
  tree: WorkItemTree,
  fullTranscript: string
): Promise<LLMWorkItem[]> {
  // Build readable tree for LLM context
  const currentItems = tree.items.map((item) => {
    const parent = item.parentId
      ? tree.items.find((i) => i.id === item.parentId)?.title ?? null
      : null;
    return {
      title: item.title,
      type: item.type,
      parent_title: parent,
      description: item.description ?? null,
      status: item.status ?? null,
      priority: item.priority ?? null,
      assignee: item.assignee ?? null,
      tags: item.tags?.length ? item.tags : null,
    };
  });

  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(JSON.stringify({ items: currentItems }), fullTranscript),
    }),
  });

  if (!res.ok) {
    throw new Error(`API proxy error: ${res.status} ${res.statusText}`);
  }

  const data: LLMResponse = await res.json();
  if (!data.items || !Array.isArray(data.items)) {
    throw new Error("LLM response missing items array");
  }
  return data.items;
}
