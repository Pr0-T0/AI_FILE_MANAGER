import { useState, useEffect } from "react";
import { File, FileText, Folder } from "lucide-react";

// Types

interface FileItem {
  id: string;
  name: string;

  type: "file" | "folder";
  file_type: "image" | "pdf" | "doc" | "excel" | "folder" | "other";

  path: string;

  src?: string;
  size?: string;
  date?: string;
}

interface AIResult {
  kind: "files" | "aggregate" | "conversation";
  items?: any[];
  message?: string;
}

// Component

export default function FilesScreen({
  aiResult,
}: {
  aiResult: AIResult | null;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [message, setMessage] = useState("");

  // Helpers

  const getFileIcon = (fileType: FileItem["file_type"]) => {
    if (fileType === "folder")
      return <Folder className="text-yellow-400" size={36} />;
    if (fileType === "pdf")
      return <File className="text-red-500" size={36} />;
    if (fileType === "excel")
      return <File className="text-green-500" size={36} />;
    if (fileType === "doc")
      return <File className="text-blue-500" size={36} />;
    return <FileText size={36} />;
  };

  const mapAIItemToFileItem = (item: any): FileItem => ({
    id: item.id,
    name: item.name,
    type: item.type,
    file_type: item.file_type,
    path: item.path,
    size: item.size
      ? `${(item.size / 1024 / 1024).toFixed(2)} MB`
      : undefined,
    date: item.modified_at,
    src:
      item.file_type === "image"
        // @ts-ignore
        ? window.fsAPI.toFileURL(item.path)
        : undefined,
  });

  // React to AI result

  useEffect(() => {
    if (!aiResult) return;

    setMessage(aiResult.message ?? "");

    if (aiResult.kind === "files" && Array.isArray(aiResult.items)) {
      setFiles(aiResult.items.map(mapAIItemToFileItem));
    } else {
      setFiles([]);
    }
  }, [aiResult]);

  // UI

  return (
    <div className="h-full w-full bg-zinc-950 text-gray-200 p-6 overflow-y-auto custom-scroll">
      <div className="text-gray-300 text-lg font-medium mb-6 animate-fadeIn">
        💬 {message || "Ask the AI to find files"}
      </div>

      {files.length === 0 && (
        <div className="text-gray-500 mt-12 text-center">
          No files to display
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, idx) => (
            <div
              key={file.id}
              className="flex flex-col items-center p-2 rounded-lg cursor-pointer
                         hover:bg-zinc-800 transition opacity-0 scale-90 animate-appear"
              style={{
                animationDelay: `${idx * 80}ms`,
                animationFillMode: "forwards",
              }}
            >
              {file.file_type === "image" && file.src ? (
                <img
                  src={file.src}
                  alt={file.name}
                  className="w-full h-40 object-cover rounded"
                />
              ) : (
                <div className="w-full h-40 flex items-center justify-center bg-zinc-700 rounded">
                  {getFileIcon(file.file_type)}
                </div>
              )}

              <div className="text-sm text-center truncate w-full mt-1">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Styles */}
      <style>
        {`
          @keyframes appear {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-appear { animation: appear 260ms forwards; }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn { animation: fadeIn 400ms ease-in-out; }

          .custom-scroll::-webkit-scrollbar { width: 10px; }
          .custom-scroll::-webkit-scrollbar-track { background: #1f1f1f; }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 6px;
          }
        `}
      </style>
    </div>
  );
}
