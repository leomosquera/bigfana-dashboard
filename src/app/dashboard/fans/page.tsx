"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Download,
  Users,
  TrendingUp,
  Star,
  Activity,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fans, fanSegments, engagementRadar, fanSpendTrend } from "@/lib/mock-data";
import { StatCard, Card } from "@/components/ui/Card";
import { Badge, LevelBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EngagementBar } from "@/components/ui/EngagementBar";
import { formatNumber, formatCurrency } from "@/lib/utils";
import type { FanLevel } from "@/lib/mock-data";

const levels: (FanLevel | "All")[] = ["All", "Ultra VIP", "Premium", "Core", "Casual"];

const segmentStats = [
  { label: "Total Fans", value: "147.8K", icon: <Users size={18} />, change: 12.7, period: "vs mes anterior", formatted: "147.8K", accent: false },
  { label: "Fan VIP Elite", value: "8.75K", icon: <Star size={18} />, change: 8.4, period: "top tier", formatted: "8.75K", accent: true },
  { label: "Engagement Prom.", value: "73.4%", icon: <Activity size={18} />, change: 5.1, period: "promedio global", formatted: "73.4%", accent: false },
  { label: "Gasto Promedio", value: "$124", icon: <TrendingUp size={18} />, change: 9.3, period: "por fan activo", formatted: "$124", accent: false },
];

export default function FansPage() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<FanLevel | "All">("All");
  const [selected, setSelected] = useState(fans[0]);

  const filtered = fans.filter((f) => {
    const matchSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "All" || f.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-[#F0F0F8]">Fans</h1>
          <p className="text-sm text-[#55556A] mt-0.5">
            {formatNumber(147832)} fans registrados · {formatNumber(42100)} premium activos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#8888AA] hover:text-[#F0F0F8] flex items-center gap-1.5 transition-colors">
            <Filter size={12} />
            Filtros
          </button>
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#8888AA] hover:text-[#F0F0F8] flex items-center gap-1.5 transition-colors">
            <Download size={12} />
            Exportar
          </button>
          <button className="h-8 px-4 rounded-lg bg-[#FF2D55] text-white text-xs font-semibold hover:bg-[#CC1F3F] transition-colors">
            Nuevo segmento
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {segmentStats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            change={s.change}
            period={s.period}
            icon={s.icon}
            accent={s.accent}
          />
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Engagement radar */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Engagement por Dimensión</h3>
            <p className="text-xs text-[#55556A] mt-0.5">
              <span className="text-[#FF2D55]">■</span> Ultra VIP ·{" "}
              <span className="text-[#3B82F6]">■</span> Core Fan
            </p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={engagementRadar}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#55556A", fontSize: 11 }} />
                <Radar
                  name="Ultra VIP"
                  dataKey="A"
                  stroke="#FF2D55"
                  fill="#FF2D55"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
                <Radar
                  name="Core"
                  dataKey="B"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Spend trend */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Gasto por Segmento</h3>
            <p className="text-xs text-[#55556A] mt-0.5">Promedio mensual en USD</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fanSpendTrend} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#55556A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#55556A", fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                <Tooltip
                  contentStyle={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}
                  labelStyle={{ color: "#55556A", fontSize: 12 }}
                  itemStyle={{ color: "#F0F0F8", fontSize: 12 }}
                />
                <Bar dataKey="vip" name="Ultra VIP" fill="#FF2D55" radius={[3, 3, 0, 0]} />
                <Bar dataKey="premium" name="Premium" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="core" name="Core" fill="#8888AA" radius={[3, 3, 0, 0]} />
                <Bar dataKey="casual" name="Casual" fill="#242436" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Main content: Table + Detail */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-4"
      >
        {/* Fan Table */}
        <div className="xl:col-span-2">
          <Card className="overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-2 flex-1">
                <Search size={13} className="text-[#55556A]" />
                <input
                  type="text"
                  placeholder="Buscar fan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-[#F0F0F8] placeholder:text-[#55556A] outline-none"
                />
              </div>
              <div className="flex items-center gap-1">
                {levels.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevelFilter(l)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      levelFilter === l
                        ? "bg-[#FF2D55]/15 text-[#FF2D55] border border-[#FF2D55]/25"
                        : "text-[#55556A] hover:text-[#8888AA]"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {["Fan", "Nivel", "Segmento", "Gasto", "Engagement", "Partidos", "Última actividad"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#55556A]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {filtered.map((fan, i) => (
                    <motion.tr
                      key={fan.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      onClick={() => setSelected(fan)}
                      className={`cursor-pointer transition-colors ${
                        selected.id === fan.id
                          ? "bg-[#FF2D55]/[0.06]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={fan.name.split(" ").map((n) => n[0]).join("")} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-[#F0F0F8]">{fan.name}</p>
                            <p className="text-[10px] text-[#55556A]">{fan.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <LevelBadge level={fan.level} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#8888AA]">{fan.segment}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-[#F0F0F8]">{formatCurrency(fan.spend)}</span>
                      </td>
                      <td className="px-4 py-3 w-32">
                        <EngagementBar value={fan.engagement} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#8888AA]">{fan.matches}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-[#55556A]">{fan.lastActive}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Fan Detail Panel */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar
              initials={selected.name.split(" ").map((n) => n[0]).join("")}
              size="lg"
              color="brand"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-[#F0F0F8]">{selected.name}</h3>
              <p className="text-xs text-[#55556A] truncate">{selected.email}</p>
            </div>
            <LevelBadge level={selected.level} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Gasto Total", value: formatCurrency(selected.spend) },
              { label: "Engagement", value: `${selected.engagement}%` },
              { label: "Partidos", value: `${selected.matches}` },
              { label: "Ciudad", value: selected.location },
            ].map((s) => (
              <div key={s.label} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-[10px] text-[#55556A]">{s.label}</p>
                <p className="text-sm font-bold text-[#F0F0F8] mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Engagement bar */}
          <div className="space-y-2">
            <p className="text-xs text-[#55556A]">Engagement Score</p>
            <EngagementBar value={selected.engagement} />
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <p className="text-xs text-[#55556A]">Badges</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.badges.map((b) => (
                <Badge key={b} variant="ghost" className="text-[10px]">
                  {b}
                </Badge>
              ))}
            </div>
          </div>

          {/* Segment & join date */}
          <div className="pt-3 border-t border-white/[0.05] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#55556A]">Segmento</span>
              <span className="text-[#F0F0F8] font-medium">{selected.segment}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#55556A]">Fan desde</span>
              <span className="text-[#F0F0F8] font-medium">
                {new Date(selected.joinDate).toLocaleDateString("es-AR", {
                  year: "numeric",
                  month: "short",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#55556A]">Última actividad</span>
              <span className="text-[#F0F0F8] font-medium">{selected.lastActive}</span>
            </div>
          </div>

          <button className="w-full h-8 rounded-xl bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] text-xs font-semibold hover:bg-[#FF2D55]/15 transition-colors">
            Ver perfil completo →
          </button>
        </Card>
      </motion.div>
    </div>
  );
}
