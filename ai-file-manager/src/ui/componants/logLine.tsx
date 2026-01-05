import type { LogEntry } from "./useLogger";


export function LogLine({ log }: { log: LogEntry }) {
  return (
    <div className="whitespace-pre-wrap leading-5">
      <span className="text-[#565f89]">
        {formatTime(log.timestamp)}
      </span>{" "}
      <span className={levelColor(log.level)}>
        [{log.level.toUpperCase()}]
      </span>{" "}
      <span>{log.message}</span>
      {log.meta && (
        <pre className="ml-6 text-[#9aa5ce]">
          {JSON.stringify(log.meta, null, 2)}
        </pre>
      )}
    </div>
  );
}

function formatTime(ts: string) {
  return ts.split("T")[1].slice(0, 8);
}

function levelColor(level: string) {
  switch (level) {
    case "error":
      return "text-red-400";
    case "warn":
      return "text-yellow-400";
    case "debug":
      return "text-blue-400";
    default:
      return "text-green-400";
  }
}
