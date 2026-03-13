import type { PipelineStatus } from "../graph/types";

const STATUS_CONFIG: Record<PipelineStatus, { label: string; color: string; pulse: boolean }> = {
  idle: { label: "Idle", color: "bg-gray-400", pulse: false },
  listening: { label: "Listening", color: "bg-red-500", pulse: true },
  processing: { label: "Processing", color: "bg-yellow-500", pulse: true },
};

interface Props {
  status: PipelineStatus;
}

export default function StatusIndicator({ status }: Props) {
  const { label, color, pulse } = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`inline-block h-3 w-3 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`} />
      <span className="font-medium">{label}</span>
    </div>
  );
}
