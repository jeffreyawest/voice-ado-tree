import { useEffect, useRef } from "react";
import StatusIndicator from "./StatusIndicator";
import type { PipelineStatus } from "../graph/types";

interface TranscriptEntry {
  text: string;
  timestamp: string;
}

interface Props {
  status: PipelineStatus;
  interimText: string;
  entries: TranscriptEntry[];
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  onUndo: () => void;
  onClear: () => void;
  onExport: () => void;
}

export default function TranscriptPanel({
  status,
  interimText,
  entries,
  isListening,
  onStart,
  onStop,
  onUndo,
  onClear,
  onExport,
}: Props) {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries, interimText]);

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold">Meeting Transcript</h2>
        <StatusIndicator status={status} />
      </div>

      {/* Controls */}
      <div className="flex gap-2 border-b border-gray-200 px-4 py-2">
        {isListening ? (
          <button onClick={onStop} className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">
            Stop
          </button>
        ) : (
          <button onClick={onStart} className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700">
            Start
          </button>
        )}
        <button onClick={onUndo} className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300">
          Undo
        </button>
        <button onClick={onClear} className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300">
          Clear
        </button>
        <button onClick={onExport} className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300">
          Export
        </button>
      </div>

      {/* Transcript log — continuous append */}
      <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3">
        {entries.map((entry, i) => (
          <div key={i} className="mb-1 inline">
            <span className="text-xs text-gray-400 mr-1">[{entry.timestamp}]</span>
            <span className="text-sm text-gray-900">{entry.text} </span>
          </div>
        ))}
        {interimText && (
          <span className="text-sm italic text-gray-400">{interimText}</span>
        )}
        {entries.length === 0 && !interimText && (
          <p className="text-sm text-gray-400">Press Start and begin discussing work items. The tree will update every 5 seconds.</p>
        )}
      </div>
    </div>
  );
}

export type { TranscriptEntry };
