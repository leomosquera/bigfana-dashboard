"use client";

import { motion } from "framer-motion";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Users,
  DollarSign,
  X,
} from "lucide-react";
import { PageShell, PlaceholderCard } from "@/components/ui/PageShell";

type AlertSeverity = "critical" | "warning" | "success" | "info";

const alertsData: {
  id: number;
  severity: AlertSeverity;
  title: string;
  description: string;
  time: string;
  category: string;
  read: boolean;
}[] = [
  {
    id: 1,
    severity: "success",
    title: "Revenue superó meta mensual",
    description: "El revenue de Mayo 2026 alcanzó $2.84M, superando la meta de $2.5M en un 13.6%.",
    time: "hace 12 min",
    category: "Revenue",
    read: false,
  },
  {
    id: 2,
    severity: "critical",
    title: "1,150 fans en riesgo de churn",
    description: "El modelo predictivo detectó un grupo de fans sin actividad > 60 días con alta probabilidad de abandono.",
    time: "hace 1h",
    category: "Retención",
    read: false,
  },
  {
    id: 3,
    severity: "warning",
    title: "Contrato Pepsi vence en 30 días",
    description: "El acuerdo de sponsoreo con Pepsi Co. vence el 31 de agosto. Se recomienda iniciar negociación.",
    time: "hace 3h",
    category: "Sponsors",
    read: false,
  },
  {
    id: 4,
    severity: "success",
    title: "Campaña Nike · Meta alcanzada",
    description: "La campaña Champions League Q3 superó 48M de impresiones. Conversión: 4.8%.",
    time: "hace 5h",
    category: "Campañas",
    read: true,
  },
  {
    id: 5,
    severity: "info",
    title: "1,200 nuevos fans registrados hoy",
    description: "El registro diario superó el promedio mensual. Pico de ingreso entre 18h y 21h.",
    time: "hace 6h",
    category: "Fans",
    read: true,
  },
  {
    id: 6,
    severity: "warning",
    title: "Engagement bajó 4% esta semana",
    description: "La semana sin partidos impactó el engagement. Se recomienda activar contenido alternativo.",
    time: "hace 1d",
    category: "Engagement",
    read: true,
  },
  {
    id: 7,
    severity: "info",
    title: "Nuevo récord: 890 upgrades a VIP",
    description: "La campaña de upgrade de temporada superó el récord previo con 890 nuevos fans VIP este mes.",
    time: "hace 2d",
    category: "Gamificación",
    read: true,
  },
];

const severityConfig: Record<AlertSeverity, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  critical: { icon: AlertTriangle, color: "text-[#FF2D55]", bg: "bg-[#FF2D55]/10",    border: "border-[#FF2D55]/20",    label: "Crítico" },
  warning:  { icon: TrendingDown,  color: "text-amber-400",  bg: "bg-amber-500/10",    border: "border-amber-500/20",    label: "Atención" },
  success:  { icon: CheckCircle,   color: "text-[#00D4A8]",  bg: "bg-[#00D4A8]/10",   border: "border-[#00D4A8]/20",   label: "Positivo" },
  info:     { icon: Info,          color: "text-blue-400",   bg: "bg-blue-500/10",     border: "border-blue-500/20",    label: "Info" },
};

const unread = alertsData.filter((a) => !a.read).length;

export default function AlertsPage() {
  return (
    <PageShell
      title="Alertas"
      subtitle="Centro de notificaciones inteligentes — anomalías, oportunidades y eventos críticos en tiempo real"
      actions={
        <>
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#8888AA] hover:text-[#F0F0F8] transition-colors">
            Marcar todo como leído
          </button>
          <button className="h-8 px-4 rounded-lg bg-[#FF2D55] text-white text-xs font-semibold hover:bg-[#CC1F3F] transition-colors">
            Configurar alertas
          </button>
        </>
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<Bell size={18} />}
          title="Sin leer"
          description="Alertas nuevas que requieren tu atención o revisión."
          metric={`${unread}`}
          metricLabel="alertas sin leer"
          accent={unread > 0}
          badge={unread > 0 ? "Nuevo" : undefined}
          delay={0.05}
        />
        <PlaceholderCard
          icon={<AlertTriangle size={18} />}
          title="Alertas críticas"
          description="Situaciones de alto impacto que requieren acción inmediata."
          metric="1"
          metricLabel="acción requerida"
          delay={0.1}
        />
        <PlaceholderCard
          icon={<CheckCircle size={18} />}
          title="Resueltas este mes"
          description="Alertas cerradas y acciones tomadas con resultado positivo."
          metric="24"
          metricLabel="issues resueltos"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alert feed */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#F0F0F8]">Feed de alertas</h3>
                <p className="text-xs text-[#55556A] mt-0.5">{alertsData.length} alertas · últimas 48 horas</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4A8] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#00D4A8]">Tiempo real</span>
              </div>
            </div>

            <div className="divide-y divide-white/[0.03]">
              {alertsData.map((alert, i) => {
                const cfg = severityConfig[alert.severity];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.25 + i * 0.05 }}
                    className={`flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer group ${
                      !alert.read ? "bg-white/[0.015]" : "hover:bg-white/[0.01]"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                      <Icon size={15} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!alert.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D55] shrink-0" />
                        )}
                        <p className={`text-sm font-semibold truncate ${alert.read ? "text-[#8888AA]" : "text-[#F0F0F8]"}`}>
                          {alert.title}
                        </p>
                      </div>
                      <p className="text-xs text-[#55556A] leading-relaxed">{alert.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border}`}
                          style={{ color: cfg.color.replace("text-", "") }}
                        >
                          <span className={cfg.color}>{cfg.label}</span>
                        </span>
                        <span className="text-[10px] text-[#55556A]">{alert.category}</span>
                        <span className="text-[10px] text-[#55556A]">·</span>
                        <span className="text-[10px] text-[#55556A]">{alert.time}</span>
                      </div>
                    </div>
                    <button className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[#55556A] hover:text-[#F0F0F8] hover:bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-all">
                      <X size={13} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Config panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6">
            <h3 className="text-sm font-semibold text-[#F0F0F8] mb-4">Tipos de alerta activos</h3>
            <div className="space-y-3">
              {[
                { label: "Revenue", icon: DollarSign, active: true, color: "#FF2D55" },
                { label: "Fans & Retención", icon: Users, active: true, color: "#3B82F6" },
                { label: "Sponsors", icon: Zap, active: true, color: "#F59E0B" },
                { label: "Engagement", icon: TrendingUp, active: true, color: "#00D4A8" },
                { label: "Campañas", icon: Bell, active: false, color: "#8888AA" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <item.icon size={13} style={{ color: item.active ? item.color : "#55556A" }} />
                    <span className={`text-xs ${item.active ? "text-[#F0F0F8]" : "text-[#55556A]"}`}>{item.label}</span>
                  </div>
                  <div
                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                      item.active ? "bg-[#FF2D55]" : "bg-white/[0.08]"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.active ? "right-0.5" : "left-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6">
            <h3 className="text-sm font-semibold text-[#F0F0F8] mb-3">Canales de notificación</h3>
            <div className="space-y-2.5">
              {[
                { ch: "Email", val: "admin@riverclub.com", active: true },
                { ch: "Slack", val: "#bigfana-alerts", active: true },
                { ch: "WhatsApp", val: "+54 9 11 XXXX", active: false },
                { ch: "Webhook", val: "api.club.com/hook", active: true },
              ].map((c) => (
                <div key={c.ch} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#F0F0F8]">{c.ch}</p>
                    <p className="text-[10px] text-[#55556A]">{c.val}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.active ? "bg-[#00D4A8]/10 text-[#00D4A8] border border-[#00D4A8]/20" : "bg-white/[0.04] text-[#55556A] border border-white/[0.06]"}`}>
                    {c.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
