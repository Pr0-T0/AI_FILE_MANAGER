import { useState } from "react";
import { Send, ChevronUp, ChevronDown, Folder, Settings, User } from "lucide-react";

export default function MainLayout() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <div className="h-screen w-screen bg-zinc-950 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-6">
        <div className="text-blue-500 font-bold text-xl">A</div>
        <button className="p-2 rounded-lg hover:bg-zinc-800">
          <Folder size={22} />
        </button>
        <button className="p-2 rounded-lg hover:bg-zinc-800">
          <User size={22} />
        </button>
        <button className="mt-auto p-2 rounded-lg hover:bg-zinc-800 mb-4">
          <Settings size={22} />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center relative">
        <div className="text-gray-500 text-lg">Main Content Area</div>

        {/* Floating Chat Section */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
          {/* Expanding text bar */}
          <div
            className={`w-[90vw] max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg flex items-center gap-3 p-3 transition-all duration-300 ${
              open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
            }`}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a command, ask AI, or manage files..."
              className="flex-1 resize-none bg-transparent text-gray-200 px-3 py-2 rounded-md outline-none h-16 max-h-32 overflow-y-auto"
            />
            <button
              onClick={() => {
                console.log("Submitted:", text);
                setText("");
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center justify-center h-12 transition"
            >
              <Send size={18} />
            </button>
          </div>

          {/* Circle button */}
          <button
            onClick={() => setOpen(!open)}
            className="mt-3 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-gray-200 flex items-center justify-center shadow-lg transition"
          >
            {open ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
          </button>
        </div>
      </main>
    </div>
  );
}
