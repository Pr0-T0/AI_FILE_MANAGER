import { useEffect, useState } from "react";

type Settings = {
  scan: {
    roots: string[];
    exclude: string[];
  };
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [scanning, setScanning] = useState(false);

  // ---------------- Load settings on mount ----------------
  useEffect(() => {
    // @ts-ignore
    window.settingsAPI.get().then((data: Settings) => {
      setSettings(data);
    });
  }, []);

  // ---------------- Add folder ----------------
  const addFolder = async () => {
    if (!settings) return;

    // @ts-ignore
    const folder = await window.settingsAPI.pickFolder();
    if (!folder || settings.scan.roots.includes(folder)) return;

    const updated: Settings = {
      ...settings,
      scan: {
        ...settings.scan,
        roots: [...settings.scan.roots, folder],
      },
    };

    setSettings(updated);
    // @ts-ignore
    window.settingsAPI.set(updated);
  };

  // ---------------- Remove folder ----------------
  const removeFolder = (folder: string) => {
    if (!settings) return;

    const updated: Settings = {
      ...settings,
      scan: {
        ...settings.scan,
        roots: settings.scan.roots.filter((f) => f !== folder),
      },
    };

    setSettings(updated);
    // @ts-ignore
    window.settingsAPI.set(updated);
  };

  // ---------------- Manual rescan ----------------
  const handleRescan = async () => {
    if (scanning) return;

    setScanning(true);
    try {
      // @ts-ignore
      await window.rescanAPI.rescan();
      console.log("Rescan completed");
    } catch (err) {
      console.error("Rescan failed", err);
    } finally {
      setScanning(false);
    }
  };

  // ---------------- Loading state ----------------
  if (!settings) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400">
        Loading settings…
      </div>
    );
  }

  // ---------------- UI ----------------
  return (
    <div className="h-full w-full p-6 text-gray-200">
      <h1 className="text-xl font-semibold mb-4">Settings</h1>

      <div className="bg-zinc-900 rounded-lg p-4 max-w-xl">
        <h2 className="text-lg font-medium mb-3">Indexed Folders</h2>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {settings.scan.roots.length === 0 && (
            <div className="text-sm text-gray-500">
              No folders selected.
            </div>
          )}

          {settings.scan.roots.map((folder) => (
            <div
              key={folder}
              className="flex items-center justify-between bg-zinc-800 px-3 py-2 rounded"
            >
              <span className="truncate text-sm">{folder}</span>
              <button
                onClick={() => removeFolder(folder)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add Folder */}
        <button
          onClick={addFolder}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
        >
          + Add Folder
        </button>

        {/* Re-scan */}
        <button
          onClick={handleRescan}
          disabled={scanning}
          className="mt-3 ml-3 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 rounded text-sm"
        >
          {scanning ? "Re-indexing…" : "Re-scan files"}
        </button>
      </div>
    </div>
  );
}
