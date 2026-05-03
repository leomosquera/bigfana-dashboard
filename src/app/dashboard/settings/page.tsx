"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Shield,
  Bell,
  Plug,
  Palette,
  Building2,
  ChevronRight,
  Check,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { cn } from "@/lib/utils";

type Section = "club" | "account" | "security" | "notifications" | "integrations" | "appearance";

const sections: { id: Section; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "club",          label: "Perfil del Club",      icon: Building2 },
  { id: "account",       label: "Cuenta",               icon: User },
  { id: "security",      label: "Seguridad",            icon: Shield },
  { id: "notifications", label: "Notificaciones",       icon: Bell },
  { id: "integrations",  label: "Integraciones",        icon: Plug },
  { id: "appearance",    label: "Apariencia",           icon: Palette },
];

const integrations = [
  { name: "Ticketera PRO", desc: "Sincronización de ventas y asistencia", connected: true, icon: "🎫" },
  { name: "Stripe", desc: "Pagos y suscripciones premium", connected: true, icon: "💳" },
  { name: "Mailchimp", desc: "Email marketing automatizado", connected: true, icon: "📧" },
  { name: "Google Analytics", desc: "Tracking de comportamiento web", connected: false, icon: "📊" },
  { name: "Slack", desc: "Alertas y notificaciones internas", connected: true, icon: "💬" },
  { name: "WhatsApp Business", desc: "Comunicación directa con fans", connected: false, icon: "📱" },
];

function ClubSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF2D55] to-[#FF6B6B] flex items-center justify-center text-2xl font-black text-white shrink-0 glow-brand-sm">
          RC
        </div>
        <div className="flex-1">
          <p className="text-base font-bold text-[#F0F0F8]">River Club</p>
          <p className="text-sm text-[#55556A]">club@riverclub.com · Buenos Aires, Argentina</p>
          <p className="text-xs text-[#FF2D55] mt-1">Plan Enterprise · Activo hasta Jun 2027</p>
        </div>
        <button className="h-8 px-4 rounded-xl border border-white/[0.08] text-xs text-[#8888AA] hover:text-[#F0F0F8] transition-colors">
          Editar logo
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Nombre del club", value: "River Club", type: "text" },
          { label: "País / Liga", value: "Argentina · Primera División", type: "text" },
          { label: "Sitio web", value: "https://riverclub.com.ar", type: "text" },
          { label: "Estadio", value: "El Monumental", type: "text" },
          { label: "Capacidad", value: "84,567", type: "text" },
          { label: "Temporada activa", value: "2025/2026", type: "text" },
        ].map((f) => (
          <div key={f.label} className="space-y-1.5">
            <label className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wider">{f.label}</label>
            <input
              type={f.type}
              defaultValue={f.value}
              className="w-full h-10 px-3 rounded-xl bg-[#141420] border border-white/[0.06] text-sm text-[#F0F0F8] outline-none focus:border-[#FF2D55]/40 transition-colors"
            />
          </div>
        ))}
      </div>
      <button className="h-9 px-5 rounded-xl bg-[#FF2D55] text-white text-sm font-semibold hover:bg-[#CC1F3F] transition-colors">
        Guardar cambios
      </button>
    </div>
  );
}

function IntegrationsSection() {
  return (
    <div className="space-y-3">
      {integrations.map((int, i) => (
        <motion.div
          key={int.name}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.10] transition-colors"
        >
          <span className="text-2xl shrink-0">{int.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#F0F0F8]">{int.name}</p>
            <p className="text-xs text-[#55556A]">{int.desc}</p>
          </div>
          {int.connected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00D4A8]/10 border border-[#00D4A8]/20">
              <Check size={11} className="text-[#00D4A8]" />
              <span className="text-[10px] font-semibold text-[#00D4A8]">Conectado</span>
            </div>
          ) : (
            <button className="px-3 py-1.5 rounded-lg bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[10px] font-semibold text-[#FF2D55] hover:bg-[#FF2D55]/15 transition-colors">
              Conectar
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function GenericSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FF2D55]/10 border border-[#FF2D55]/15 flex items-center justify-center mb-4">
        <Settings size={22} className="text-[#FF2D55]" />
      </div>
      <h3 className="text-sm font-bold text-[#F0F0F8] mb-2">{title}</h3>
      <p className="text-xs text-[#55556A] max-w-xs leading-relaxed">{description}</p>
      <button className="mt-5 h-8 px-5 rounded-xl bg-[#FF2D55]/10 border border-[#FF2D55]/20 text-[#FF2D55] text-xs font-semibold hover:bg-[#FF2D55]/15 transition-colors">
        Configurar →
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<Section>("club");

  const genericContent: Partial<Record<Section, { title: string; description: string }>> = {
    account: {
      title: "Configuración de cuenta",
      description: "Gestioná los datos del administrador, contraseña, sesiones activas y preferencias de idioma.",
    },
    security: {
      title: "Seguridad y accesos",
      description: "Activá autenticación de dos factores, revisá el log de accesos y gestioná los roles del equipo.",
    },
    notifications: {
      title: "Preferencias de notificación",
      description: "Elegí qué alertas recibir, con qué frecuencia y por qué canal: email, Slack, WhatsApp o webhook.",
    },
    appearance: {
      title: "Apariencia del dashboard",
      description: "Personalizá el tema, colores del club, idioma y densidad de información del panel de control.",
    },
  };

  return (
    <PageShell
      title="Configuración"
      subtitle="Perfil del club, integraciones, seguridad y preferencias del sistema BigFana"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-4"
      >
        {/* Nav sidebar */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-3 space-y-0.5 lg:col-span-1 h-fit">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                active === s.id
                  ? "bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20"
                  : "text-[#8888AA] hover:text-[#F0F0F8] hover:bg-white/[0.03]"
              )}
            >
              <s.icon size={15} />
              <span className="text-sm font-medium flex-1">{s.label}</span>
              <ChevronRight size={12} className="opacity-40" />
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-base font-bold text-[#F0F0F8] mb-1">
              {sections.find((s) => s.id === active)?.label}
            </h2>
            <p className="text-xs text-[#55556A] mb-6">
              {active === "club" && "Información general, identidad del club y datos de la organización"}
              {active === "account" && "Datos personales del administrador y configuración de sesión"}
              {active === "security" && "Autenticación, roles de equipo y auditoría de accesos"}
              {active === "notifications" && "Canales y preferencias de alertas del sistema"}
              {active === "integrations" && "Plataformas conectadas y APIs externas"}
              {active === "appearance" && "Personalización visual del dashboard"}
            </p>
            {active === "club" && <ClubSection />}
            {active === "integrations" && <IntegrationsSection />}
            {genericContent[active] && (
              <GenericSection
                title={genericContent[active]!.title}
                description={genericContent[active]!.description}
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </PageShell>
  );
}
