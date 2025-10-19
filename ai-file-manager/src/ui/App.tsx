import { useState } from "react";
import Sidebar from "./componants/sideBar";
import MainContent from "./componants/mainContent";
import FloatingTextBar from "./componants/floatingTextBar";


function App() {
  // Possible views: 'files', 'peers', 'settings'
  const [currentView, setCurrentView] = useState<"overview"|"files" | "peers" | "settings">("files");

  // Function to update current view based on AI instructions
  const handleAIInstruction = (instruction: string) => {
    switch (instruction) {
      case "showFiles":
        setCurrentView("files");
        break;
      case "showPeers":
        setCurrentView("peers");
        break;
      case "openSettings":
        setCurrentView("settings");
        break;
      default:
        setCurrentView("files");
    }
  };

  return (
    <div className="h-screen w-screen flex bg-zinc-950 text-gray-200 overflow-hidden">
      <Sidebar setCurrentView={setCurrentView} />
      <MainContent currentView={currentView} />
      <FloatingTextBar onAICommand={handleAIInstruction} />
    </div>
  );
}

export default App;
