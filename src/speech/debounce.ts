const DEFAULT_INTERVAL_MS = 3000;

export function createDebounceGate(onTrigger: (text: string) => void, intervalMs = DEFAULT_INTERVAL_MS) {
  let finalizedSegments: string[] = [];
  let latestInterim: string = "";
  let lastSentText: string = "";
  let timer: ReturnType<typeof setInterval> | null = null;

  function buildFullTranscript(): string {
    const parts = [...finalizedSegments];
    if (latestInterim) parts.push(latestInterim);
    return parts.join(" ");
  }

  function flush() {
    const text = buildFullTranscript();
    if (!text || text === lastSentText) return; // nothing new
    lastSentText = text;
    onTrigger(text);
  }

  function startInterval() {
    if (timer) return;
    timer = setInterval(flush, intervalMs);
  }

  function stopInterval() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  return {
    /** Call when a finalized speech segment arrives */
    push(segment: string) {
      finalizedSegments.push(segment);
      latestInterim = "";
    },

    /** Call with interim (partial) text so it gets included in the next flush */
    pushInterim(text: string) {
      latestInterim = text;
    },

    /** Force flush any pending text (e.g. on stop) */
    flush() {
      stopInterval();
      flush();
    },

    /** Clear everything */
    clear() {
      stopInterval();
      finalizedSegments = [];
      latestInterim = "";
      lastSentText = "";
    },

    /** Start the periodic timer (call when listening begins) */
    start() {
      startInterval();
    },

    /** Stop the periodic timer */
    stop() {
      stopInterval();
    },
  };
}
