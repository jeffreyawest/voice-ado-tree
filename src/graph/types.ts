export type WorkItemType = "epic" | "feature" | "story" | "task";

export interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  description?: string;
  parentId?: string; // ID of parent work item
  status?: "new" | "active" | "resolved" | "closed";
  priority?: number; // 1 = highest
  assignee?: string;
  tags?: string[];
}

export interface WorkItemTree {
  items: WorkItem[];
  lastUpdated: string; // ISO timestamp
}

export type PipelineStatus = "idle" | "listening" | "processing";
