import { useState, useEffect } from "react";
import { Monitor, Laptop, Smartphone, Wifi } from "lucide-react";

interface LanDevice {
  deviceId: string;
  name: string;
  platform: string;
  address: string;
  uptime: number;
  lastSeen: number;
}

interface PeerDevice {
  id: string;
  name: string;
  type: "desktop" | "laptop" | "phone";
  status: "connected";
  ip: string;
}

export default function PeersScreen() {
  const [devices, setDevices] = useState<PeerDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPeers = async () => {
      try {
        // @ts-ignore
        const lanDevices: LanDevice[] = await window.lanAPI.getDevices();

        if (!mounted) return;

        const mapped: PeerDevice[] = lanDevices.map((d) => ({
          id: d.deviceId,
          name: d.name ?? "Unknown",
          type: mapPlatformToType(d.platform),
          status: "connected",
          ip: d.address,
        }));

        setDevices(mapped);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load LAN devices", err);
      }
    };

    fetchPeers();
    const interval = setInterval(fetchPeers, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getDeviceIcon = (type: string) => {
    if (type === "desktop") return <Monitor size={18} />;
    if (type === "laptop") return <Laptop size={18} />;
    return <Smartphone size={18} />;
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-gray-200 p-6 overflow-y-auto">
      <h1 className="text-xl font-semibold mb-6">Connected Peers</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wifi size={18} /> Online Devices
            </h2>
          </div>

          {devices.length === 0 ? (
            <div className="text-gray-400 text-sm">No devices detected on LAN</div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {devices.map((device, idx) => (
                <div
                  key={device.id}
                  className="flex items-center gap-3 bg-zinc-900 border border-green-600 rounded-xl px-4 py-3 w-fit
                    transition-all duration-300 transform opacity-0 scale-95 animate-appear"
                  style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "forwards" }}
                >
                  <div className="p-2 bg-zinc-800 rounded-lg text-gray-300">
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{device.name}</div>
                    <div className="text-xs text-gray-400">{device.ip}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <style>
        {`
          @keyframes appear {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-appear {
            animation: appear 300ms forwards;
          }
        `}
      </style>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function mapPlatformToType(platform: string): "desktop" | "laptop" | "phone" {
  if (!platform) return "desktop";

  if (platform === "android" || platform === "ios") return "phone";

  // linux / win32 / darwin → desktop (safe default)
  return "desktop";
}
