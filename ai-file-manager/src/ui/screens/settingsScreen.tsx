import { useState, useEffect, useRef } from "react";

export default function ConsoleScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Custom log function
  const log = (message: string) => {
    setLogs((prev) => [...prev, message]);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Example usage: log something every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      log(`Debug log at ${new Date().toLocaleTimeString()}`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={consoleRef}
      className="h-full w-full bg-black text-green-400 font-mono p-4 overflow-y-auto"
    >
      {logs.map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
    </div>
  );
}
