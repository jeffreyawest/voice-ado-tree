import { useCallback, useMemo, useRef, useState } from "react";
import TranscriptPanel from "./components/TranscriptPanel";
import type { TranscriptEntry } from "./components/TranscriptPanel";
import TreeView from "./components/TreeView";
import type { WorkItemTree, PipelineStatus, WorkItem } from "./graph/types";
import { createStateManager } from "./graph/stateManager";
import { createDebounceGate } from "./speech/debounce";
import { useSpeechRecognition } from "./speech/useSpeechRecognition";
import { extractWorkItems } from "./llm/extractEntities";

export default function App() {
  const [tree, setTree] = useState<WorkItemTree>({ items: [], lastUpdated: "" });
  const [status, setStatus] = useState<PipelineStatus>("idle");
  const [interimText, setInterimText] = useState("");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const queuedRef = useRef<string | null>(null);

  const stateManager = useMemo(() => {
    const sm = createStateManager(setTree);
    sm.init();
    return sm;
  }, []);

  const triggerLLM = useCallback(
    async (fullTranscript: string) => {
      if (inFlightRef.current) {
        // Store the latest full transcript (not appending — it's already the full thing)
        queuedRef.current = fullTranscript;
        return;
      }

      inFlightRef.current = true;
      setStatus("processing");

      try {
        const currentTree = stateManager.getTree();
        const items = await extractWorkItems(currentTree, fullTranscript);
        stateManager.replaceTree(items);
      } catch (err) {
        console.error("LLM extraction failed:", err);
        setError(err instanceof Error ? err.message : "LLM extraction failed");
      } finally {
        inFlightRef.current = false;
        const queued = queuedRef.current;
        queuedRef.current = null;
        if (queued) {
          triggerLLM(queued);
        } else {
          setStatus("idle");
        }
      }
    },
    [stateManager]
  );

  const debounceGate = useMemo(() => createDebounceGate(triggerLLM), [triggerLLM]);

  const speech = useSpeechRecognition({
    onInterim: useCallback((text: string) => {
      setInterimText(text);
      debounceGate.pushInterim(text);
    }, [debounceGate]),
    onFinalized: useCallback(
      (segment: string) => {
        setInterimText("");
        setEntries((prev) => [
          ...prev,
          { text: segment, timestamp: new Date().toLocaleTimeString() },
        ]);
        debounceGate.push(segment);
      },
      [debounceGate]
    ),
    onError: useCallback((err: string) => setError(err), []),
  });

  const handleStart = useCallback(() => {
    setError(null);
    speech.start();
    debounceGate.start();
    setStatus("listening");
  }, [speech, debounceGate]);

  const handleStop = useCallback(() => {
    speech.stop();
    debounceGate.flush();
    setStatus("idle");
  }, [speech, debounceGate]);

  const handleClear = useCallback(() => {
    if (window.confirm("Clear all work items and transcript?")) {
      stateManager.clear();
      debounceGate.clear();
      setEntries([]);
    }
  }, [stateManager, debounceGate]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(stateManager.getTree(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "work-items.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [stateManager]);

  const handleUpdateItem = useCallback(
    (_id: string, _fields: Partial<WorkItem>) => {
      // Manual edits not supported in full-replace mode
      // Could re-trigger LLM or do local edit
    },
    []
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left panel — 30% */}
      <div className="w-[30%] min-w-[280px]">
        <TranscriptPanel
          status={status}
          interimText={interimText}
          entries={entries}
          isListening={speech.isListening}
          onStart={handleStart}
          onStop={handleStop}
          onUndo={() => stateManager.undo()}
          onClear={handleClear}
          onExport={handleExport}
        />
      </div>

      {/* Right panel — 70% */}
      <div className="flex-1">
        <TreeView tree={tree} onUpdateItem={handleUpdateItem} />
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800 shadow">
          <button onClick={() => setError(null)} className="float-right ml-2 font-bold">&times;</button>
          {error}
        </div>
      )}
    </div>
  );
}
