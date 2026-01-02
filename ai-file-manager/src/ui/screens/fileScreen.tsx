import { useState, useEffect } from "react";
import { File, FileText, Folder } from "lucide-react";

interface FileItem {
  id: number;
  name: string;
  type: "image" | "pdf" | "excel" | "doc" | "folder";
  src?: string;
  size?: string;
  date?: string;
  path?: string;
}

interface AIResult {
  kind: "files" | "aggregate" | "conversation";
  items?: any[];
  message?: string;
}

export default function FilesScreen({ aiResult }: { aiResult: AIResult | null }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [message, setMessage] = useState("");

  /* ----------------------- helpers ----------------------- */

  const getFileIcon = (type: string) => {
    if (type === "folder") return <Folder className="text-yellow-400" size={36} />;
    if (type === "pdf") return <File className="text-red-500" size={36} />;
    if (type === "excel") return <File className="text-green-500" size={36} />;
    if (type === "doc") return <File className="text-blue-500" size={36} />;
    return <FileText size={36} />;
  };

  const mapAIItemToFileItem = (item: any, index: number): FileItem => {
    const ext = item.extension?.toLowerCase();

    let type: FileItem["type"] = "doc";

    if (item.type === "folder") type = "folder";
    else if (["png", "jpg", "jpeg", "webp"].includes(ext)) type = "image";
    else if (ext === "pdf") type = "pdf";
    else if (["xls", "xlsx"].includes(ext)) type = "excel";
    else if (["doc", "docx"].includes(ext)) type = "doc";

    return {
      id: index,
      name: item.name,
      type,
      path: item.path,
      size: item.size
        ? `${(item.size / 1024 / 1024).toFixed(2)} MB`
        : undefined,
      date: item.created_at,
      // src: type === "image" ? `file://${item.path}` : undefined,
      src:
        type === "image"
          ? `file:///${encodeURI(item.path)}`
          : undefined,

    };
  };

  /* ----------------------- react to AI ----------------------- */

  useEffect(() => {
    if (!aiResult) return;

    setMessage(aiResult.message ?? "");

    if (aiResult.kind === "files" && Array.isArray(aiResult.items)) {
      setFiles(aiResult.items.map(mapAIItemToFileItem));
      setSelectedFile(null);
    } else {
      setFiles([]);
    }
  }, [aiResult]);

  /* ----------------------- UI ----------------------- */

  return (
    <div className="flex h-full w-full bg-zinc-950 text-gray-200">
      {/* LEFT: FILE GRID */}
      <div className="flex-1 p-6 overflow-y-auto custom-scroll">
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
                onClick={() => setSelectedFile(file)}
                className="flex flex-col items-center p-2 rounded-lg cursor-pointer hover:bg-zinc-800 transition opacity-0 scale-90 animate-appear"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "forwards" }}
              >
                {file.type === "image" && file.src ? (
                  <img
                    src={file.src}
                    alt={file.name}
                    className="w-full h-40 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-zinc-700 rounded">
                    {getFileIcon(file.type)}
                  </div>
                )}

                <div className="text-sm text-center truncate w-full mt-1">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: PREVIEW */}
      <div className="w-1/4 p-6 border-l border-zinc-800">
        <div className="sticky top-0">
          {selectedFile ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Preview</h2>

              {selectedFile.type === "image" && selectedFile.src ? (
                <img
                  src={selectedFile.src}
                  alt={selectedFile.name}
                  className="w-full max-h-96 object-contain rounded shadow"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-zinc-800 rounded">
                  Preview not available
                </div>
              )}

              <h3 className="text-md font-semibold mt-4">Metadata</h3>
              <div className="text-gray-400 text-sm space-y-1">
                <p><strong>Name:</strong> {selectedFile.name}</p>
                <p><strong>Type:</strong> {selectedFile.type}</p>
                {selectedFile.size && <p><strong>Size:</strong> {selectedFile.size}</p>}
                {selectedFile.date && <p><strong>Date:</strong> {selectedFile.date}</p>}
                {selectedFile.path && (
                  <p>
                    <strong>Path:</strong>{" "}
                    <span className="text-gray-500 break-all">
                      {selectedFile.path}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              Select a file or folder to preview details
            </div>
          )}
        </div>
      </div>

      {/* styles */}
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
