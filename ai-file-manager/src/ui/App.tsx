import { useState } from "react";
import Sidebar from "./componants/sideBar";
import MainContent from "./componants/mainContent";
import FloatingTextBar from "./componants/floatingTextBar";
import FilesScreen from "./screens/fileScreen";
import TerminalLogger from "./componants/terminalLogger";

function App() {
  const [currentView, setCurrentView] = useState<
    "overview" | "files" | "peers" | "settings"
  >("overview");

  const [aiResult, setAIResult] = useState<any>(null);

  const handleAIOutput = (response: any) => {
    console.log("[AI RESULT]", response);
    setAIResult(response);

    if (response?.kind === "files") {
      setCurrentView("files");
    }
  };

  return (
    <div className="h-screen w-screen flex bg-zinc-950 text-gray-200 overflow-hidden">
      {/* LEFT SIDEBAR */}
      <Sidebar setCurrentView={setCurrentView} />

      {/* CENTER + RIGHT */}
      <div className="flex flex-1 overflow-hidden">
        {/* MAIN CONTENT (CENTER) */}
        <div className="flex-1 relative overflow-hidden">
          {currentView === "files" ? (
            <FilesScreen aiResult={aiResult} />
          ) : (
            <MainContent currentView={currentView} />
          )}
        </div>

        {/* RIGHT TERMINAL LOGGER */}
        <div className="w-95 border-l border-zinc-800 flex flex-col">
          <TerminalLogger />
        </div>
      </div>

      {/* FLOATING INPUT */}
      <FloatingTextBar onAICommand={handleAIOutput} />
    </div>
  );
}

export default App;
