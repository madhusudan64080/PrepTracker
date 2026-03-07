// frontend/components/layout/AppShell.tsx

"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { uiStore } from "@/store/uiStore";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export default function AppShell({ children }: { children: ReactNode }) {
  const { sidebarCollapsed } = uiStore();

  // FIX: flush offline queue whenever connectivity returns
  useOfflineSync();

  return (
    <div className="min-h-screen flex bg-[#08080f]">
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      <main className="flex-1 overflow-auto pb-16 lg:pb-0">
        {children}
      </main>

      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
