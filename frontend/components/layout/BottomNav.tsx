// frontend/components/layout/BottomNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  RefreshCw,
  Code2,
  BarChart3
} from "lucide-react";

const tabs = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/subjects", icon: BookOpen, label: "Subjects" },
  { path: "/revision", icon: RefreshCw, label: "Revision" },
  { path: "/coding", icon: Code2, label: "Coding" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#08080f] border-t border-white/10 flex justify-around py-2 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.path;

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex flex-col items-center text-xs ${
              active ? "text-indigo-400" : "text-[#94a3b8]"
            }`}
          >
            <Icon size={20} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}