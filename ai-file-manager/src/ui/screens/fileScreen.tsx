import { useState, useEffect } from "react";
import { File, FileText } from "lucide-react";

interface FileItem {
  id: number;
  name: string;
  type: "image" | "pdf" | "excel" | "doc";
  src?: string;
  size?: string;
  date?: string;
  path?: string;
}

const mockFiles: FileItem[] = [
  {
    id: 1,
    name: "Beach.png",
    type: "image",
    src: "/mock-images/beach.jpg",
    size: "2.3 MB",
    date: "2025-10-12",
    path: "/home/user/Pictures/Trips/Beach.png",
  },
  {
    id: 2,
    name: "Mountains.png",
    type: "image",
    src: "/mock-images/mountains.png",
    size: "3.1 MB",
    date: "2025-10-13",
    path: "/home/user/Pictures/Trips/Mountains.png",
  },
  {
    id: 3,
    name: "HotelBooking.pdf",
    type: "pdf",
    size: "1.2 MB",
    date: "2025-10-10",
    path: "/home/user/Documents/Trips/HotelBooking.pdf",
  },
  {
    id: 4,
    name: "Expenses.xlsx",
    type: "excel",
    size: "0.8 MB",
    date: "2025-10-09",
    path: "/home/user/Documents/Trips/Expenses.xlsx",
  },
  {
    id: 5,
    name: "TripNotes.docx",
    type: "doc",
    size: "0.5 MB",
    date: "2025-10-11",
    path: "/home/user/Documents/Trips/TripNotes.docx",
  },
  {
    id: 6,
    name: "Sunset.png",
    type: "image",
    src: "/mock-images/sunset.jpeg",
    size: "1.9 MB",
    date: "2025-10-14",
    path: "/home/user/Pictures/Trips/Sunset.png",
  },
  {
    id: 7,
    name: "Itinerary.pdf",
    type: "pdf",
    size: "0.7 MB",
    date: "2025-10-12",
    path: "/home/user/Documents/Trips/Itinerary.pdf",
  },
  {
    id: 8,
    name: "PackingList.xlsx",
    type: "excel",
    size: "0.9 MB",
    date: "2025-10-13",
    path: "/home/user/Documents/Trips/PackingList.xlsx",
  },
];

export default function FilesScreen() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("AI is processing your request...");

  const getFileIcon = (type: string) => {
    if (type === "pdf") return <File className="text-red-500" size={36} />;
    if (type === "excel") return <File className="text-green-500" size={36} />;
    if (type === "doc") return <File className="text-blue-500" size={36} />;
    return <FileText size={36} />;
  };

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setFiles([]);
      setMessage("AI is processing your request...");
      await new Promise((res) => setTimeout(res, 1500)); // simulate thinking
      setFiles(mockFiles);
      setMessage("Here are the files related to your last week's trip 📁");
      setLoading(false);
    };
    fetchFiles();
  }, []);

  return (
    <div className="flex h-full w-full bg-zinc-950 text-gray-200">
      {/* Left: Files Section */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="text-gray-300 text-lg font-medium mb-6 animate-fadeIn">
          💬 {message}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Files Grid */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-auto">
            {files.map((file, idx) => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`flex flex-col items-center p-2 rounded-lg cursor-pointer hover:bg-zinc-800 transition 
                  transform duration-300 ease-out opacity-0 scale-90 animate-appear`}
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "forwards" }}
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
                <div className="text-sm text-center truncate w-full mt-1">{file.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Preview & Metadata */}
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
                <div className="w-full h-64 flex items-center justify-center bg-zinc-800 rounded text-gray-200">
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
                  <p><strong>Path:</strong> <span className="text-gray-500">{selectedFile.path}</span></p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Select a file to preview its details.</div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes appear {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-appear {
            animation: appear 300ms forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 600ms ease-in-out;
          }
        `}
      </style>
    </div>
  );
}
