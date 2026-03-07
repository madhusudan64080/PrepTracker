// frontend/components/layout/Sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  Target,
  Code2,
  FolderKanban,
  BarChart3,
  Mic,
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { uiStore } from "@/store/uiStore";

interface Props {
  collapsed: boolean;
}

const links = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/subjects", icon: BookOpen, label: "Subjects" },
  { path: "/revision", icon: RefreshCw, label: "Revision" },
  { path: "/goals", icon: Target, label: "Goals" },
  { path: "/coding", icon: Code2, label: "Coding" },
  { path: "/projects", icon: FolderKanban, label: "Projects" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/interview", icon: Mic, label: "Interview" }
];

export default function Sidebar({ collapsed }: Props) {
  const pathname = usePathname();
  const { toggleTheme, theme } = uiStore();

  return (
    <aside className="w-[240px] h-screen border-r border-white/10 bg-[#08080f] flex flex-col">
      <div className="p-5 flex items-center gap-2">
        <div className="bg-indigo-500 w-8 h-8 rounded flex items-center justify-center font-bold">
          PT
        </div>
        <span className="font-semibold">PrepTrack</span>
      </div>

      <nav className="flex-1 px-3">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.path;

          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition ${
                active
                  ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500"
                  : "hover:bg-white/5 text-[#94a3b8]"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-white/10 rounded"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="p-2 hover:bg-white/10 rounded">
          <Settings size={18} />
        </button>
      </div>
    </aside>
  );
}