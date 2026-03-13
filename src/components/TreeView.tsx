import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { WorkItemTree, WorkItem } from "../graph/types";
import WorkItemCard from "./WorkItemCard";

interface Props {
  tree: WorkItemTree;
  onUpdateItem: (id: string, fields: Partial<WorkItem>) => void;
}

const NODE_H = 52;
const H_PAD = 24;
const V_GAP = 12;
const INDENT = 28;
const ICON_SIZE = 16;

const TYPE_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  epic: { bg: "#dbeafe", border: "#3b82f6", icon: "#2563eb" },     // blue
  feature: { bg: "#fce7f3", border: "#ec4899", icon: "#db2777" },   // pink
  story: { bg: "#d1fae5", border: "#10b981", icon: "#059669" },     // green
  task: { bg: "#fef3c7", border: "#f59e0b", icon: "#d97706" },      // amber
};

const TYPE_ICONS: Record<string, string> = {
  epic: "\u26A1",   // lightning bolt
  feature: "\u2B50", // star
  story: "\u{1F4D6}", // book
  task: "\u2611",   // checkbox
};

interface TreeNode {
  item: WorkItem;
  children: TreeNode[];
  depth: number;
}

function buildHierarchy(items: WorkItem[]): TreeNode[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const childrenMap = new Map<string | undefined, WorkItem[]>();

  for (const item of items) {
    const key = item.parentId ?? "__root__";
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(item);
  }

  function build(parentId: string | undefined, depth: number): TreeNode[] {
    const key = parentId ?? "__root__";
    const children = childrenMap.get(key) ?? [];
    return children.map((item) => ({
      item,
      children: build(item.id, depth + 1),
      depth,
    }));
  }

  // Sort: epics first, then features, then stories, then tasks
  const typeOrder = { epic: 0, feature: 1, story: 2, task: 3 };
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    nodes.sort((a, b) => (typeOrder[a.item.type] ?? 4) - (typeOrder[b.item.type] ?? 4));
    for (const n of nodes) sortNodes(n.children);
    return nodes;
  }

  return sortNodes(build(undefined, 0));
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenTree(node.children));
  }
  return result;
}

export default function TreeView({ tree, onUpdateItem }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (tree.items.length === 0) {
      svg
        .append("text")
        .attr("x", "50%")
        .attr("y", "50%")
        .attr("text-anchor", "middle")
        .attr("fill", "#9ca3af")
        .attr("font-size", "14px")
        .text("Work items will appear here as you speak.");
      return;
    }

    const hierarchy = buildHierarchy(tree.items);
    const flat = flattenTree(hierarchy);

    const PAD = 40;
    const totalHeight = flat.length * (NODE_H + V_GAP) + PAD * 2;
    const maxDepth = Math.max(...flat.map((n) => n.depth));
    const totalWidth = Math.max(600, (maxDepth + 1) * INDENT + 400 + PAD * 2);

    svg.attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`);

    const container = svg.append("g");

    // Zoom & pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => container.attr("transform", event.transform));
    svg.call(zoom);

    // Build a map of item positions for drawing connector lines
    const positions = new Map<string, { x: number; y: number }>();

    flat.forEach((node, i) => {
      const x = PAD + node.depth * INDENT;
      const y = PAD + i * (NODE_H + V_GAP);
      positions.set(node.item.id, { x, y });
    });

    // Draw connector lines (parent → child)
    for (const node of flat) {
      if (!node.item.parentId) continue;
      const parentPos = positions.get(node.item.parentId);
      const childPos = positions.get(node.item.id);
      if (!parentPos || !childPos) continue;

      // L-shaped connector: vertical from parent, then horizontal to child
      const midX = parentPos.x + 10;
      const startY = parentPos.y + NODE_H;
      const endY = childPos.y + NODE_H / 2;

      container
        .append("path")
        .attr("d", `M ${midX} ${startY} L ${midX} ${endY} L ${childPos.x} ${endY}`)
        .attr("fill", "none")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 1.5);
    }

    // Draw nodes
    for (const node of flat) {
      const pos = positions.get(node.item.id)!;
      const colors = TYPE_COLORS[node.item.type] ?? TYPE_COLORS.task;
      const icon = TYPE_ICONS[node.item.type] ?? "";

      // Calculate text width for node sizing
      const nodeWidth = Math.max(200, node.item.title.length * 8 + H_PAD * 2 + ICON_SIZE + 8);

      const group = container
        .append("g")
        .attr("transform", `translate(${pos.x}, ${pos.y})`)
        .attr("cursor", "pointer")
        .on("click", () => setSelectedItem(node.item));

      // Background rect
      group
        .append("rect")
        .attr("width", nodeWidth)
        .attr("height", NODE_H)
        .attr("rx", 6)
        .attr("fill", colors.bg)
        .attr("stroke", colors.border)
        .attr("stroke-width", 1.5);

      // Type icon
      group
        .append("text")
        .attr("x", 10)
        .attr("y", NODE_H / 2 + 5)
        .attr("font-size", "14px")
        .text(icon);

      // Type label (small)
      group
        .append("text")
        .attr("x", 10 + ICON_SIZE + 4)
        .attr("y", NODE_H / 2 - 4)
        .attr("fill", colors.icon)
        .attr("font-size", "9px")
        .attr("font-weight", "600")
        .attr("text-transform", "uppercase")
        .text(node.item.type.toUpperCase());

      // Title
      group
        .append("text")
        .attr("x", 10 + ICON_SIZE + 4)
        .attr("y", NODE_H / 2 + 10)
        .attr("fill", "#1e293b")
        .attr("font-size", "12px")
        .attr("font-weight", "500")
        .text(node.item.title);

      // Status badge (if not "new")
      if (node.item.status && node.item.status !== "new") {
        const statusColors: Record<string, string> = {
          active: "#3b82f6",
          resolved: "#10b981",
          closed: "#6b7280",
        };
        group
          .append("text")
          .attr("x", nodeWidth - 8)
          .attr("y", NODE_H / 2 + 4)
          .attr("text-anchor", "end")
          .attr("fill", statusColors[node.item.status] ?? "#6b7280")
          .attr("font-size", "9px")
          .attr("font-weight", "600")
          .text(node.item.status.toUpperCase());
      }

      // Assignee (if set)
      if (node.item.assignee) {
        group
          .append("text")
          .attr("x", nodeWidth - 8)
          .attr("y", NODE_H / 2 - 6)
          .attr("text-anchor", "end")
          .attr("fill", "#64748b")
          .attr("font-size", "9px")
          .text(node.item.assignee);
      }

      // Tags (rendered as small pills below the title)
      if (node.item.tags && node.item.tags.length > 0) {
        let tagX = 10 + ICON_SIZE + 4;
        const tagY = NODE_H - 10;
        for (const tag of node.item.tags) {
          const tagWidth = tag.length * 5.5 + 10;
          group
            .append("rect")
            .attr("x", tagX)
            .attr("y", tagY - 8)
            .attr("width", tagWidth)
            .attr("height", 12)
            .attr("rx", 6)
            .attr("fill", "#e2e8f0")
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 0.5);
          group
            .append("text")
            .attr("x", tagX + tagWidth / 2)
            .attr("y", tagY)
            .attr("text-anchor", "middle")
            .attr("fill", "#475569")
            .attr("font-size", "7px")
            .attr("font-weight", "500")
            .text(tag);
          tagX += tagWidth + 4;
        }
      }
    }
  }, [tree]);

  return (
    <div className="relative h-full w-full bg-gray-50">
      <svg ref={svgRef} className="h-full w-full" />
      {selectedItem && (
        <WorkItemCard
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={(fields) => {
            onUpdateItem(selectedItem.id, fields);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
