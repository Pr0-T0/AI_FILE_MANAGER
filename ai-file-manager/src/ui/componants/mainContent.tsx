import FilesScreen from "../screens/fileScreen";
import Overview from "../screens/overView";
import PeersScreen from "../screens/peersScreen";
import SettingsScreen from "../screens/settingsScreen";


interface MainContentProps {
  currentView: "overview"|"files" | "peers" | "settings";
}

export default function MainContent({ currentView }: MainContentProps) {
  const renderScreen = () => {
    switch (currentView) {
      case "files":
        return <FilesScreen />;
      case "peers":
        return <PeersScreen />;
      case "settings":
        return <SettingsScreen />;
      case "overview":
        return <Overview/>
      default:
        return <FilesScreen />;
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-start items-center relative overflow-auto p-6">
      {renderScreen()}
    </main>
  );
}
