import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface FloatingTextBarProps {
  onAICommand: (response: string) => void;
}

export default function FloatingTextBar({ onAICommand }: FloatingTextBarProps) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const prompt = text.trim();
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setText("");
    console.log("Sending to Gemini:", prompt);

    try {
      // @ts-ignore
      const result = await window.electron.sendQuery(prompt);
      console.log("Gemini Response:", result);
      onAICommand(result);
    } catch (err: any) {
      console.error("Error from Gemini:", err);
      onAICommand(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for async Gemini events (optional)
  useEffect(() => {
    const handleResponse = (text: string) => {
      console.log("Gemini async response:", text);
      onAICommand(text);
    };

    const handleError = (error: string) => {
      console.error("Gemini async error:", error);
      onAICommand(`Error: ${error}`);
    };

    // @ts-ignore
    window.electron.onGeminiResponse(handleResponse);
    // @ts-ignore
    window.electron.onGeminiError(handleError);

    return () => {
      // Cleanup listeners when component unmounts
      // @ts-ignore
      window.electron.onGeminiResponse(() => {});
      // @ts-ignore
      window.electron.onGeminiError(() => {});
    };
  }, [onAICommand]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [text]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center w-[90vw] max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-lg gap-2 p-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isLoading ? "Thinking..." : "Ask LINC something..."}
        className="flex-1 resize-none bg-transparent text-gray-200 px-2 py-1 rounded-md outline-none overflow-y-auto text-sm"
        disabled={isLoading}
      />
      <button
        onClick={handleSend}
        className={`${
          isLoading ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-500"
        } text-white px-3 py-1.5 rounded-lg flex items-center justify-center h-10 transition`}
        disabled={isLoading}
      >
        <Send size={16} />
      </button>
    </div>
  );
}
