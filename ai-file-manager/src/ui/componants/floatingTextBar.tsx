import { useState, useRef, useEffect } from "react";
import { Send, ChevronUp, ChevronDown } from "lucide-react";

interface FloatingTextBarProps {
  onAICommand: (instruction: string) => void;
}

export default function FloatingTextBar({ onAICommand }: FloatingTextBarProps) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    console.log("User Input:", text);
    const aiInstruction = mockAI(text);
    onAICommand(aiInstruction);
    setText("");
    setOpen(false); // auto-close after sending
  };

  const mockAI = (input: string) => {
    if (input.includes("files")) return "showFiles";
    if (input.includes("peers")) return "showPeers";
    if (input.includes("settings")) return "openSettings";
    return "showFiles";
  };

  // Adjust textarea height dynamically
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px"; // reset height
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // px, max height
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [text]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
      {/* Sliding Text Bar */}
      <div
        className={`w-[90vw] max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg flex items-center gap-2 p-2 mb-3 transition-all duration-300
        ${open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"}`}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 resize-none bg-transparent text-gray-200 px-2 py-1 rounded-md outline-none overflow-y-auto text-sm"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center justify-center h-10"
        >
          <Send size={16} />
        </button>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white shadow-lg transition-transform duration-300"
      >
        {open ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
      </button>
    </div>
  );
}
