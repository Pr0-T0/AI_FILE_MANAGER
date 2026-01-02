import { useState } from "react";
import Sidebar from "./componants/sideBar";
import MainContent from "./componants/mainContent";
import FloatingTextBar from "./componants/floatingTextBar";
import FilesScreen from "./screens/fileScreen";

function App() {
  const [currentView, setCurrentView] = useState<
    "overview" | "files" | "peers" | "settings"
  >("overview");

  // STORE AI RESULT
  const [aiResult, setAIResult] = useState<any>(null);

  // THIS is the correct handler
  const handleAIOutput = (response: any) => {
    console.log("[AI RESULT]", response);
    setAIResult(response);

    // Optional: auto-switch to files view
    if (response?.kind === "files") {
      setCurrentView("files");
    }
  };

  return (
    <div className="h-screen w-screen flex bg-zinc-950 text-gray-200 overflow-hidden">
      <Sidebar setCurrentView={setCurrentView} />

      {/* MAIN AREA */}
      <div className="flex-1 relative">
        {currentView === "files" ? (
          <FilesScreen aiResult={aiResult} />
        ) : (
          <MainContent currentView={currentView} />
        )}
      </div>

      <FloatingTextBar onAICommand={handleAIOutput} />
    </div>
  );
}

export default App;
