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
    <div
      ref={containerRef}
      onMouseEnter={() => (isPaused.current = true)}
      onMouseLeave={() => (isPaused.current = false)}
      className="h-full w-full bg-[#0b0e14] text-[#c0caf5] 
                 font-mono text-xs overflow-auto 
                 border border-[#1f2335] rounded-md p-2"
    >
      {logs.map((log, i) => (
        <LogLine key={i} log={log} />
      ))}
    </div>
  );
}
