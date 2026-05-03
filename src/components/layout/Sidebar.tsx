"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Handshake,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Gamepad2,
  Bell,
  PieChart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",                  label: "Dashboard",     icon: LayoutDashboard, section: "main" },
  { href: "/dashboard/fans",             label: "Fans",          icon: Users,           section: "main" },
  { href: "/dashboard/segments",         label: "Segmentos",     icon: PieChart,        section: "main" },
  { href: "/dashboard/sponsors",         label: "Sponsors",      icon: Handshake,       section: "main" },
  { href: "/dashboard/campaigns",        label: "Campañas",      icon: Zap,             section: "main" },
  { href: "/dashboard/gamification",     label: "Gamificación",  icon: Gamepad2,        section: "main" },
  { href: "/dashboard/analytics",        label: "Analytics",     icon: BarChart3,       section: "analytics" },
  { href: "/dashboard/alerts",           label: "Alertas",       icon: Bell,            section: "system" },
  { href: "/dashboard/settings",         label: "Configuración", icon: Settings,        section: "system" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-full bg-[#0D0D14] border-r border-white/[0.06] overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-[#FF2D55] flex items-center justify-center shrink-0 glow-brand-sm">
          <span className="text-white font-black text-sm">BF</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-bold text-[#F0F0F8] whitespace-nowrap">BigFana</p>
              <p className="text-[10px] text-[#55556A] whitespace-nowrap">Fan Intelligence</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {["main", "analytics", "system"].map((section) => {
          const sectionItems = navItems.filter((i) => i.section === section);
          return (
            <div key={section}>
              {section !== "main" && (
                <div className="mt-4 mb-2 px-2">
                  {!collapsed && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#55556A]">
                      {section === "analytics" ? "Reportes" : "Sistema"}
                    </p>
                  )}
                  {collapsed && <div className="h-px bg-white/[0.05] my-2" />}
                </div>
              )}
              {sectionItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      `
                        relative
                        flex
                        items-center
                    
                        rounded-xl
                    
                        transition-all
                        duration-200
                    
                        group
                      `,
                    
                      collapsed
                        ? `
                            w-10
                            h-10
                    
                            mx-auto
                    
                            justify-center
                    
                            p-0
                          `
                        : `
                            h-10
                    
                            gap-3
                            px-3
                    
                            justify-start
                          `,
                    
                      isActive
                        ? "text-[#FF2D55]"
                        : "text-[#8888AA] hover:text-[#F0F0F8] hover:bg-white/[0.04]"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl  bg-[#FF2D55]/10 border border-[#FF2D55]/20 shadow-[0_0_18px_rgba(255,45,85,0.16)]"
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      />
                    )}
                    <item.icon
                      size={18}
                      className={cn(
                        `
                          relative
                          z-10
                          shrink-0
                        `,

                        collapsed ? "mx-auto" : "",

                        isActive
                          ? "text-[#FF2D55]"
                          : "text-current"
                      )}
                    />
                    <motion.span
                      animate={{
                        opacity: collapsed ? 0 : 1,
                        width: collapsed ? 0 : "auto",
                        marginLeft: collapsed ? 0 : 0,
                      }}
                      transition={{
                        duration: 0.18,
                      }}
                      className="
                        overflow-hidden
                        whitespace-nowrap

                        text-sm
                        font-medium

                        relative
                        z-10
                      "
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/[0.06] p-3">
        <div className={cn("flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer", collapsed && "justify-center")}>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF2D55] to-[#FF6B6B] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">RC</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs font-semibold text-[#F0F0F8] whitespace-nowrap">River Club</p>
                <p className="text-[10px] text-[#55556A] whitespace-nowrap">Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
