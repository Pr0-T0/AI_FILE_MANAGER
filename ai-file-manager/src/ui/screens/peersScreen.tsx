import { useState, useEffect } from "react";
import { Monitor, Laptop, Smartphone, Users, PlusCircle, Wifi } from "lucide-react";

interface PeerDevice {
  id: number;
  name: string;
  type: "laptop" | "phone" | "desktop";
  status: "connected" | "available";
  ip: string;
}

interface PeerGroup {
  id: number;
  name: string;
  members: PeerDevice[];
}

// Mock Data
const mockDevices: PeerDevice[] = [
  { id: 1, name: "Sarath-PC", type: "desktop", status: "connected", ip: "192.168.0.10" },
  { id: 2, name: "Laptop-Office", type: "laptop", status: "available", ip: "192.168.0.12" },
  { id: 3, name: "Pixel-7", type: "phone", status: "connected", ip: "192.168.0.14" },
  { id: 4, name: "Workstation", type: "desktop", status: "available", ip: "192.168.0.20" },
  { id: 5, name: "Home-Laptop", type: "laptop", status: "connected", ip: "192.168.0.21" },
];

const mockGroups: PeerGroup[] = [
  {
    id: 1,
    name: "Trip Share",
    members: [
      { id: 1, name: "Sarath-PC", type: "desktop", status: "connected", ip: "192.168.0.10" },
      { id: 3, name: "Pixel-7", type: "phone", status: "connected", ip: "192.168.0.14" },
    ],
  },
  {
    id: 2,
    name: "Work Sync",
    members: [
      { id: 2, name: "Laptop-Office", type: "laptop", status: "available", ip: "192.168.0.12" },
      { id: 4, name: "Workstation", type: "desktop", status: "available", ip: "192.168.0.20" },
    ],
  },
  {
    id: 3,
    name: "Home Devices",
    members: [
      { id: 5, name: "Home-Laptop", type: "laptop", status: "connected", ip: "192.168.0.21" },
      { id: 1, name: "Sarath-PC", type: "desktop", status: "connected", ip: "192.168.0.10" },
    ],
  },
];

export default function PeersScreen() {
  const [devices, setDevices] = useState<PeerDevice[]>([]);
  const [groups, setGroups] = useState<PeerGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeers = async () => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800)); // simulate AI scanning delay
      setDevices(mockDevices);
      setGroups(mockGroups);
      setLoading(false);
    };
    fetchPeers();
  }, []);

  const getDeviceIcon = (type: string) => {
    if (type === "desktop") return <Monitor size={18} />;
    if (type === "laptop") return <Laptop size={18} />;
    return <Smartphone size={18} />;
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950 text-gray-200 p-6 overflow-y-auto">
      <h1 className="text-xl font-semibold mb-6">🔗 Connected Peers & Groups</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Devices Section */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Wifi size={18} /> Available Devices
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              {devices.map((device, idx) => (
                <div
                  key={device.id}
                  className={`flex items-center gap-3 bg-zinc-900 border rounded-xl px-4 py-3 w-fit
                    ${device.status === "connected" ? "border-green-600" : "border-zinc-800 hover:border-blue-500"} 
                    transition-all duration-300 transform opacity-0 scale-95 animate-appear`}
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
          </section>

          {/* Groups Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={18} /> Peer Groups
              </h2>
              <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm text-white">
                <PlusCircle size={16} /> Create Group
              </button>
            </div>

            {/* Group Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group, idx) => (
                <div
                  key={group.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-blue-500 transition-all duration-300 transform opacity-0 scale-95 animate-appear"
                  style={{ animationDelay: `${idx * 150}ms`, animationFillMode: "forwards" }}
                >
                  <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
                    <Users size={16} className="text-blue-500" /> {group.name}
                  </h3>

                  {/* Member grid inside each group */}
                  <div className="grid grid-cols-2 gap-3">
                    {group.members.map((member, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center bg-zinc-800 rounded-xl p-3 text-center"
                      >
                        <div className="p-2 bg-zinc-700 rounded-lg mb-1">
                          {getDeviceIcon(member.type)}
                        </div>
                        <span className="text-xs truncate w-full">{member.name}</span>
                        <span
                          className={`text-[10px] ${
                            member.status === "connected" ? "text-green-500" : "text-gray-400"
                          }`}
                        >
                          {member.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
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
