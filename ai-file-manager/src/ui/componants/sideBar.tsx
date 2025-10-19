import { Folder, Users, Settings, Menu, Info } from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  setCurrentView: (view: "overview" | "files" | "peers" | "settings") => void;
}

export default function Sidebar({ setCurrentView }: SidebarProps) {
  const [open, setOpen] = useState(false);

  const menuItems = [
    {icon:<Info size={22}/>, label:"OverView", view: "overview"},
    { icon: <Folder size={22} />, label: "Files", view: "files" },
    { icon: <Users size={22} />, label: "Peers", view: "peers" },
    { icon: <Settings size={22} />, label: "Settings", view: "settings" }
  ];

  return (
    <aside
      className={`bg-zinc-900 border-r border-zinc-800 flex flex-col py-4 transition-all duration-300
        ${open ? "w-48" : "w-16"}`}
    >
      {/* Hamburger menu */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 m-2 rounded-lg hover:bg-zinc-800 flex justify-start items-center"
      >
        <Menu size={22} />
      </button>

      {/* Menu buttons */}
      <div className="flex flex-col mt-2 relative">
        {menuItems.map((item, idx) => (
          <div key={idx} className="relative group flex justify-center">
            <button
              onClick={() => setCurrentView(item.view as any)}
              className={`flex items-center gap-3 p-2 my-1 hover:bg-zinc-800 rounded-lg transition-all duration-300
                w-full ${open ? "justify-start pl-4" : "justify-center"}`}
            >
              {item.icon}
              {/* Label shows only when expanded */}
              <span
                className={`transition-all duration-300 whitespace-nowrap
                  ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
              >
                {item.label}
              </span>
            </button>

            {/* Tooltip on hover when collapsed */}
            {!open && (
              <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
