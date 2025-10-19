import { useState } from "react";
import { Send, ChevronUp, ChevronDown } from "lucide-react";

export default function FloatingTextBar() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      {/* Floating text bar */}
      <div
        className={`w-[90vw] max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg flex items-center gap-3 p-3 transition-all duration-300 ${
          open ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        }`}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your command or message..."
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
  );
}
