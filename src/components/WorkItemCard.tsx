import { useState } from "react";
import type { WorkItem, WorkItemType } from "../graph/types";

interface Props {
  item: WorkItem;
  onClose: () => void;
  onSave: (updated: Partial<WorkItem>) => void;
}

export default function WorkItemCard({ item, onClose, onSave }: Props) {
  const [title, setTitle] = useState(item.title);
  const [type, setType] = useState<WorkItemType>(item.type);
  const [description, setDescription] = useState(item.description ?? "");
  const [status, setStatus] = useState(item.status ?? "new");
  const [priority, setPriority] = useState(item.priority?.toString() ?? "");
  const [assignee, setAssignee] = useState(item.assignee ?? "");
  const [tags, setTags] = useState(item.tags?.join(", ") ?? "");

  function handleSave() {
    onSave({
      title,
      type,
      description: description || undefined,
      status: status as WorkItem["status"],
      priority: priority ? parseInt(priority, 10) : undefined,
      assignee: assignee || undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    });
    onClose();
  }

  return (
    <div className="absolute right-4 top-4 z-10 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Edit Work Item</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
      </div>
      <label className="mb-2 block text-sm">
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm" />
      </label>
      <label className="mb-2 block text-sm">
        Type
        <select value={type} onChange={(e) => setType(e.target.value as WorkItemType)} className="mt-1 block w-full rounded border px-2 py-1 text-sm">
          <option value="epic">Epic</option>
          <option value="feature">Feature</option>
          <option value="story">Story</option>
          <option value="task">Task</option>
        </select>
      </label>
      <label className="mb-2 block text-sm">
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm">
          <option value="new">New</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      <label className="mb-2 block text-sm">
        Priority (1=highest)
        <input type="number" min="1" max="4" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm" />
      </label>
      <label className="mb-2 block text-sm">
        Assignee
        <input value={assignee} onChange={(e) => setAssignee(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm" />
      </label>
      <label className="mb-2 block text-sm">
        Tags (comma-separated)
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Big Rock, Q3, Backend" className="mt-1 block w-full rounded border px-2 py-1 text-sm" />
      </label>
      <label className="mb-2 block text-sm">
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded border px-2 py-1 text-sm" rows={3} />
      </label>
      <button onClick={handleSave} className="mt-2 w-full rounded bg-blue-600 py-1 text-sm text-white hover:bg-blue-700">
        Save
      </button>
    </div>
  );
}
