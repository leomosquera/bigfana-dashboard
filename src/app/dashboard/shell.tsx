"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

/**
 * Client-side dashboard shell.
 *
 * Holds the sidebar collapsed state and renders the full app chrome
 * (Sidebar + Header + scrollable main area). Kept as a client component
 * so useState works, while the parent layout.tsx can be a server component
 * that performs auth and org checks before rendering this shell.
 */
export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#06060A]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
