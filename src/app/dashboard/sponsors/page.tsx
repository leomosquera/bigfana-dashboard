"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import { DollarSign, TrendingUp, Zap, Eye, Filter, Download, ChevronRight } from "lucide-react";
import { sponsors, sponsorRoiData, activationData } from "@/lib/mock-data";
import { StatCard, Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { PageShell } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

const kpis = [
  { label: "Inversión Total", value: "$4.29M", change: 22.4, period: "temporada 2025/26", icon: <DollarSign size={18} />, accent: true  },
  { label: "ROI Promedio",    value: "3.3x",   change: 8.7,  period: "retorno promedio",  icon: <TrendingUp size={18} />, accent: false },
  { label: "Activaciones",   value: "123",    change: 18.2, period: "temporada activa",  icon: <Zap size={18} />,        accent: false },
  { label: "Impresiones",    value: "164M",   change: 31.5, period: "alcance total",     icon: <Eye size={18} />,        accent: false },
];

function RoiTooltip({ active, payload }: { active?: boolean; payload?: { payload: { name: string; roi: number; investment: number; impressions: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#141420] border border-white/[0.08] rounded-xl p-3 text-xs">
      <p className="font-bold text-[#F0F0F8] mb-2">{d.name}</p>
      <div className="space-y-1 text-[#8888AA]">
        <p>ROI: <span className="text-[#00D4A8] font-semibold">{d.roi}x</span></p>
        <p>Inversión: <span className="text-[#F0F0F8] font-semibold">${d.investment}K</span></p>
        <p>Impresiones: <span className="text-[#F0F0F8] font-semibold">{d.impressions}M</span></p>
      </div>
    </div>
  );
}

type StatusFilter = "all" | "active" | "negotiating" | "renewing";
const statusLabels: Record<StatusFilter, string> = {
  all: "Todos", active: "Activo", negotiating: "Negociando", renewing: "Renovando",
};

export default function SponsorsPage() {
  const [selected,     setSelected]     = useState(sponsors[0]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered         = sponsors.filter((s) => statusFilter === "all" || s.status === statusFilter);
  const totalInvestment  = sponsors.reduce((s, sp) => s + sp.investment, 0);
  const avgRoi           = (sponsors.reduce((s, sp) => s + sp.roi, 0) / sponsors.length).toFixed(1);

  return (
    <PageShell
      title="Sponsors"
      subtitle={`${sponsors.length} sponsors activos · ${formatCurrency(totalInvestment)} en inversión · ROI promedio ${avgRoi}x`}
      actions={
        <>
          <Button intent="secondary" size="sm" leftIcon={<Filter size={12} />}>Filtros</Button>
          <Button intent="secondary" size="sm" leftIcon={<Download size={12} />}>Exportar</Button>
          <Button intent="primary"   size="sm">Nuevo sponsor</Button>
        </>
      }
    >

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} change={k.change} period={k.period} icon={k.icon} accent={k.accent} />
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* ROI por sponsor */}
        <Card className="p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#F0F0F8]">ROI por Sponsor</h3>
            <p className="text-xs text-[#55556A] mt-0.5">Retorno sobre inversión · temporada actual</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sponsorRoiData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fill: "#55556A", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}x`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#8888AA", fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<RoiTooltip />} />
                <Bar dataKey="roi" name="ROI" radius={[0, 4, 4, 0]}>
                  {sponsorRoiData.map((entry, i) => (
                    <rect key={i} fill={entry.roi >= 4 ? "#FF2D55" : entry.roi >= 3 ? "#3B82F6" : "#8888AA"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Activaciones */}
        <Card className="p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Activaciones por Canal</h3>
            <p className="text-xs text-[#55556A] mt-0.5">Digital · Física · En vivo</p>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activationData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad-digital"  x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF2D55" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF2D55" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="grad-physical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="grad-live"     x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00D4A8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00D4A8" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#55556A", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#55556A", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: "#141420", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}
                  labelStyle={{ color: "#55556A", fontSize: 12 }}
                  itemStyle={{ color: "#F0F0F8", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="digital"  name="Digital"  stroke="#FF2D55" strokeWidth={2} fill="url(#grad-digital)"  dot={false} />
                <Area type="monotone" dataKey="physical" name="Física"   stroke="#3B82F6" strokeWidth={2} fill="url(#grad-physical)" dot={false} />
                <Area type="monotone" dataKey="live"     name="En vivo"  stroke="#00D4A8" strokeWidth={2} fill="url(#grad-live)"     dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Sponsors Table + Detail */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-4"
      >
        {/* Table */}
        <div className="xl:col-span-2">
          <Card className="overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-4 border-b border-white/[0.05]">
              <span className="text-xs text-[#55556A] font-medium mr-1">Estado:</span>
              {(["all", "active", "negotiating", "renewing"] as const).map((s) => (
                <Button
                  key={s}
                  size="xs"
                  intent={statusFilter === s ? "outline" : "ghost"}
                  onClick={() => setStatusFilter(s)}
                >
                  {statusLabels[s]}
                </Button>
              ))}
            </div>

            {/* Cards grid */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((sponsor, i) => (
                <motion.div
                  key={sponsor.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  onClick={() => setSelected(sponsor)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer",
                    selected.id === sponsor.id
                      ? "border-[#FF2D55]/30 bg-[#FF2D55]/[0.05]"
                      : "border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10]"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#1C1C2A] border border-white/[0.06] flex items-center justify-center">
                        <span className="text-sm font-bold text-[#8888AA]">{sponsor.logo}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#F0F0F8]">{sponsor.name}</p>
                        <p className="text-[10px] text-[#55556A]">{sponsor.category}</p>
                      </div>
                    </div>
                    <StatusBadge status={sponsor.status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[10px] text-[#55556A]">Inversión</p>
                      <p className="text-xs font-bold text-[#F0F0F8]">{formatCurrency(sponsor.investment)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#55556A]">ROI</p>
                      <p className="text-xs font-bold text-[#00D4A8]">{sponsor.roi}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#55556A]">Impresiones</p>
                      <p className="text-xs font-bold text-[#F0F0F8]">{formatNumber(sponsor.impressions)}</p>
                    </div>
                  </div>

                  {/* Mini ROI bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B]"
                        style={{ width: `${(sponsor.roi / 5) * 100}%` }}
                      />
                    </div>
                    <ChevronRight size={12} className={selected.id === sponsor.id ? "text-[#FF2D55]" : "text-[#55556A]"} />
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sponsor Detail */}
        <Card className="p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1C1C2A] border border-white/[0.08] flex items-center justify-center">
              <span className="text-base font-black text-[#8888AA]">{selected.logo}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#F0F0F8]">{selected.name}</h3>
              <p className="text-xs text-[#55556A]">{selected.category}</p>
            </div>
          </div>

          <StatusBadge status={selected.status} />

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Inversión",    value: formatCurrency(selected.investment), highlight: false },
              { label: "ROI",          value: `${selected.roi}x`,                  highlight: true  },
              { label: "Impresiones",  value: formatNumber(selected.impressions),  highlight: false },
              { label: "Activaciones", value: `${selected.activations}`,           highlight: false },
              { label: "Campañas",     value: `${selected.campaigns}`,             highlight: false },
              { label: "Fin contrato", value: new Date(selected.contractEnd).toLocaleDateString("es-AR", { year: "numeric", month: "short" }), highlight: false },
            ].map((m) => (
              <div key={m.label} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                <p className="text-[10px] text-[#55556A]">{m.label}</p>
                <p className={cn("text-sm font-bold mt-0.5", m.highlight ? "text-[#00D4A8]" : "text-[#F0F0F8]")}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* ROI visual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#55556A]">ROI Score</p>
              <p className="text-xs font-bold text-[#00D4A8]">{selected.roi}x de 5x máx.</p>
            </div>
            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#00D4A8] to-[#3B82F6]"
                initial={{ width: 0 }}
                animate={{ width: `${(selected.roi / 5) * 100}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Activaciones breakdown */}
          <div className="space-y-2 pt-2 border-t border-white/[0.05]">
            <p className="text-xs text-[#55556A] mb-3">Activaciones por tipo</p>
            {[
              { label: "Digital", value: Math.round(selected.activations * 0.52), color: "#FF2D55" },
              { label: "Física",  value: Math.round(selected.activations * 0.32), color: "#3B82F6" },
              { label: "En vivo", value: Math.round(selected.activations * 0.16), color: "#00D4A8" },
            ].map((a) => (
              <div key={a.label} className="flex items-center gap-2">
                <span className="text-[10px] text-[#55556A] w-12">{a.label}</span>
                <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: a.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(a.value / selected.activations) * 100}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-[#8888AA] w-5 text-right">{a.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button intent="outline"    size="sm" className="flex-1">Ver campañas</Button>
            <Button intent="secondary"  size="sm" className="flex-1">Generar reporte</Button>
          </div>
        </Card>
      </motion.div>

    </PageShell>
  );
}
