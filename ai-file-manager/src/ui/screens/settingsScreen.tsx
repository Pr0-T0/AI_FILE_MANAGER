import { useState } from "react";
import { Sun, Moon, Image, List, Settings, Bell } from "lucide-react";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [thumbnailView, setThumbnailView] = useState(true);
  const [autoAI, setAutoAI] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="p-6 bg-zinc-950 text-gray-200 h-full overflow-y-auto">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Settings size={24} /> Settings
      </h1>

      {/* Theme */}
      <div className="flex items-center justify-between mb-4 p-4 bg-zinc-900 rounded-lg">
        <div className="flex items-center gap-2">
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
          <span>Dark Mode</span>
        </div>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
          className="toggle"
        />
      </div>

      {/* File View */}
      <div className="flex items-center justify-between mb-4 p-4 bg-zinc-900 rounded-lg">
        <div className="flex items-center gap-2">
          {thumbnailView ? <Image size={20} /> : <List size={20} />}
          <span>Thumbnail View</span>
        </div>
        <input
          type="checkbox"
          checked={thumbnailView}
          onChange={() => setThumbnailView(!thumbnailView)}
          className="toggle"
        />
      </div>

      {/* AI Auto-Suggestions */}
      <div className="flex items-center justify-between mb-4 p-4 bg-zinc-900 rounded-lg">
        <div className="flex items-center gap-2">
          <Settings size={20} />
          <span>AI Auto-Suggestions</span>
        </div>
        <input
          type="checkbox"
          checked={autoAI}
          onChange={() => setAutoAI(!autoAI)}
          className="toggle"
        />
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between mb-4 p-4 bg-zinc-900 rounded-lg">
        <div className="flex items-center gap-2">
          <Bell size={20} />
          <span>Notifications</span>
        </div>
        <input
          type="checkbox"
          checked={notifications}
          onChange={() => setNotifications(!notifications)}
          className="toggle"
        />
      </div>

      {/* Quick reset button */}
      <button
        className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg transition"
        onClick={() => {
          setDarkMode(true);
          setThumbnailView(true);
          setAutoAI(true);
          setNotifications(true);
        }}
      >
        Reset to Default
      </button>
    </div>
  );
}
