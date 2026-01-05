import { useEffect, useRef } from "react";
import { LogLine } from "./logLine";
import { useLogger } from "./useLogger";

export default function TerminalLogger() {
  const logs = useLogger();
  const containerRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);

  // Auto-scroll unless user is hovering
  useEffect(() => {
    if (!isPaused.current && containerRef.current) {
      containerRef.current.scrollTop =
        containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full w-full bg-[#0b0e14] border-l border-[#1f2937] p-3">
      {/* OUTER TERMINAL BOX */}
      <div
        className="
          relative h-full
          border border-[#2a3342]
          bg-linear-to-b from-[#0d1117] to-[#0b0e14]
          font-mono text-xs text-[#c9d1d9]
        "
      >
        {/* TERMINAL LABEL (breaks the border) */}
        <div
          className="
            absolute -top-2 left-4
            px-2
            bg-[#0d1117]
            text-[#9ca3af]
            tracking-wider
            text-[10px]
          "
        >
          TERMINAL
        </div>

        {/* LOG SCROLL AREA */}
        <div
          ref={containerRef}
          onMouseEnter={() => (isPaused.current = true)}
          onMouseLeave={() => (isPaused.current = false)}
          className="h-full overflow-auto px-4 py-4 space-y-0.5 no-scrollbar"
        >
          {logs.map((log, i) => (
            <LogLine key={i} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}
