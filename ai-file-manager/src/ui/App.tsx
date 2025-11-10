import { useState } from "react";
import Sidebar from "./componants/sideBar";
import MainContent from "./componants/mainContent";
import FloatingTextBar from "./componants/floatingTextBar";

function App() {
  // Possible views: 'overview', 'files', 'peers', 'settings'
  const [currentView, setCurrentView] = useState<"overview" | "files" | "peers" | "settings">("overview");

  // Handle only display output from AI (no navigation)
  const handleAIOutput = (response: string | any[]) => {
    console.log("AI output:", response);
    // You can later display this response in a message box or console area if needed.
  };

  return (
    <div className="h-screen w-screen flex bg-zinc-950 text-gray-200 overflow-hidden">
      <Sidebar setCurrentView={setCurrentView} />
      <MainContent currentView={currentView} />
      <FloatingTextBar onAICommand={handleAIOutput} />
    </div>
  );
}

export default App;
