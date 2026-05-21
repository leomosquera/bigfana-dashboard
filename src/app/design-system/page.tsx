"use client";

import { useState, useMemo } from "react";
import {
  Zap, Users, BarChart3, Bell, Search, Star, Heart,
  Plus, Trash2, Settings, ChevronRight, ArrowRight,
  CheckCircle2, AlertTriangle, Info, Loader2, Palette,
  Layers, Box, Layout, Cpu, RefreshCw,
  Shapes, Sparkles, Paintbrush,
  MoreHorizontal, Eye, Pencil, Download, Copy,
  ExternalLink, Share2, Flag, BookMarked,
  SlidersHorizontal, List, LayoutGrid,
  Calendar, Clock, Shield, Trophy, TrendingUp,
  DollarSign, Activity, Target, Globe,
  Tag, MapPin, Ticket,
  Table2, Send, BarChart2, MousePointerClick,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button }                            from "@/components/ui/Button";
import { Input }                             from "@/components/ui/Input";
import { Card, StatCard }                    from "@/components/ui/Card";
import { Avatar }                            from "@/components/ui/Avatar";
import { Badge, LevelBadge, StatusBadge }   from "@/components/ui/Badge";
import { EngagementBar }                     from "@/components/ui/EngagementBar";
import { PlaceholderCard, MiniStat, ComingSoonBanner } from "@/components/ui/PageShell";
import {
  SkeletonText, SkeletonAvatar,
  SkeletonCard, SkeletonTableRow, SkeletonChart,
} from "@/components/ui/Skeleton";
import { Tabs }                    from "@/components/ui/Tabs";

import { Select }      from "@/components/forms/Select";
import { Checkbox }    from "@/components/forms/Checkbox";
import { Combobox }    from "@/components/forms/Combobox";
import { MultiSelect } from "@/components/forms/MultiSelect";
import { Switch }      from "@/components/forms/Switch";
import { RadioGroup }  from "@/components/forms/Radio";
import { Textarea }    from "@/components/forms/Textarea";
import { DatePicker }  from "@/components/forms/DatePicker";
import { RangePicker } from "@/components/forms/RangePicker";
import { TimePicker }  from "@/components/forms/TimePicker";
import type { DateRange, TimeValue } from "@/lib/date-utils";

import { Modal }         from "@/components/feedback/Modal";
import { Drawer }        from "@/components/feedback/Drawer";
import { ToastProvider, useToast } from "@/components/feedback/Toast";
import { Popover }       from "@/components/ui/Popover";
import { DropdownMenu }  from "@/components/ui/DropdownMenu";

import { colors, radius, shadows, spacing } from "@/lib/design-system/tokens";
import { t as mt, fadeUpProps, fadeInProps, stagger, duration, hover as hoverPresets } from "@/lib/design-system/motion";
import { tenantPresets, applyTenantTheme } from "@/lib/design-system/theme";
import { Stack, Inline, Surface, Grid, Section } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/DataTable";
import type { ColumnDef } from "@/components/ui/DataTable";

// ─── Section helpers ──────────────────────────────────────────────────────────

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold text-[#F0F0F8]">{title}</h2>
      {description && (
        <p className="text-sm text-[#55556A] mt-1">{description}</p>
      )}
    </div>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-[#55556A] mb-3">
      {children}
    </h3>
  );
}

function DemoBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-white/[0.06] my-10" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function FoundationSection() {
  return (
    <div className="space-y-10">
      <SectionTitle
        title="Foundation"
        description="Design tokens that power every component in BigFana."
      />

      {/* Colors */}
      <div>
        <SubTitle>Color Tokens</SubTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { name: "brand",       hex: colors.brand,        label: "Brand" },
            { name: "brandDim",    hex: colors.brandDim,     label: "Brand Dim" },
            { name: "success",     hex: colors.success,      label: "Success" },
            { name: "warning",     hex: colors.warning,      label: "Warning" },
            { name: "info",        hex: colors.info,         label: "Info" },
            { name: "danger",      hex: colors.danger,       label: "Danger" },
            { name: "surface0",    hex: colors.surface0,     label: "Surface 0" },
            { name: "surface1",    hex: colors.surface1,     label: "Surface 1" },
            { name: "surface2",    hex: colors.surface2,     label: "Surface 2" },
            { name: "surface3",    hex: colors.surface3,     label: "Surface 3" },
            { name: "surface4",    hex: colors.surface4,     label: "Surface 4" },
            { name: "textPrimary", hex: colors.textPrimary,  label: "Text Primary" },
            { name: "textSecondary",hex: colors.textSecondary,label: "Text Secondary" },
            { name: "textMuted",   hex: colors.textMuted,    label: "Text Muted" },
          ].map((c) => (
            <div key={c.name} className="rounded-xl border border-white/[0.06] overflow-hidden">
              <div
                className="h-16 w-full"
                style={{ backgroundColor: c.hex }}
              />
              <div className="p-2.5 bg-[#0D0D14]">
                <p className="text-xs font-semibold text-[#F0F0F8]">{c.label}</p>
                <p className="text-[10px] text-[#55556A] font-mono mt-0.5">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Typography */}
      <div>
        <SubTitle>Type Scale</SubTitle>
        <DemoBox>
          <div className="space-y-4">
            {[
              { label: "Display",  size: "text-5xl",   weight: "font-black",    sample: "48px / black" },
              { label: "4xl",      size: "text-4xl",   weight: "font-bold",     sample: "36px / bold" },
              { label: "3xl",      size: "text-3xl",   weight: "font-bold",     sample: "30px / bold" },
              { label: "2xl",      size: "text-2xl",   weight: "font-semibold", sample: "24px / semibold" },
              { label: "xl",       size: "text-xl",    weight: "font-semibold", sample: "18px / semibold" },
              { label: "lg",       size: "text-lg",    weight: "font-medium",   sample: "16px / medium" },
              { label: "base",     size: "text-base",  weight: "font-normal",   sample: "14px / regular" },
              { label: "sm",       size: "text-sm",    weight: "font-normal",   sample: "13px / regular" },
              { label: "xs",       size: "text-xs",    weight: "font-medium",   sample: "12px / medium" },
            ].map((t) => (
              <div key={t.label} className="flex items-baseline justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-baseline gap-4 min-w-0">
                  <span className="text-[10px] font-mono text-[#55556A] w-12 shrink-0">{t.label}</span>
                  <p className={cn(t.size, t.weight, "text-[#F0F0F8] truncate")}>
                    BigFana Fan Intelligence
                  </p>
                </div>
                <span className="text-[10px] text-[#55556A] shrink-0 font-mono">{t.sample}</span>
              </div>
            ))}
          </div>
        </DemoBox>
      </div>

      <Divider />

      {/* Spacing */}
      <div>
        <SubTitle>Spacing Scale</SubTitle>
        <DemoBox>
          <div className="flex flex-wrap gap-3 items-end">
            {Object.entries(spacing).map(([key, val]) => (
              <div key={key} className="flex flex-col items-center gap-2">
                <div
                  className="bg-[#FF2D55]/30 border border-[#FF2D55]/40 rounded"
                  style={{ width: val, height: val, minWidth: "4px", minHeight: "4px" }}
                />
                <span className="text-[9px] font-mono text-[#55556A]">{key}</span>
              </div>
            ))}
          </div>
        </DemoBox>
      </div>

      <Divider />

      {/* Radius */}
      <div>
        <SubTitle>Border Radius</SubTitle>
        <div className="flex flex-wrap gap-4">
          {Object.entries(radius).map(([key, val]) => (
            <div key={key} className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 bg-white/[0.06] border border-white/[0.1]"
                style={{ borderRadius: val }}
              />
              <span className="text-[10px] font-mono text-[#55556A]">{key}</span>
              <span className="text-[9px] text-[#55556A]/60">{val}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Shadows */}
      <div>
        <SubTitle>Shadows & Glow</SubTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "shadow-sm",   shadow: shadows.sm },
            { label: "shadow-md",   shadow: shadows.md },
            { label: "shadow-lg",   shadow: shadows.lg },
            { label: "shadow-xl",   shadow: shadows.xl },
            { label: "glow-brand",  shadow: shadows.brand },
            { label: "glow-success",shadow: shadows.success },
          ].map((s) => (
            <div
              key={s.label}
              className="h-20 rounded-2xl bg-[#141420] border border-white/[0.06] flex items-center justify-center"
              style={{ boxShadow: s.shadow }}
            >
              <span className="text-xs font-mono text-[#8888AA]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Motion Guidelines */}
      <div>
        <SubTitle>Motion Guidelines</SubTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Instant",  ms: "100ms",  use: "Hover states, micro" },
            { label: "Fast",     ms: "150ms",  use: "Dropdowns, tooltips" },
            { label: "Normal",   ms: "200ms",  use: "State transitions" },
            { label: "Slow",     ms: "300ms",  use: "Page, sidebar" },
            { label: "Enter",    ms: "350ms",  use: "Page sections" },
            { label: "Page",     ms: "400ms",  use: "Route changes" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-white/[0.06] p-4 bg-[#0D0D14]">
              <p className="text-lg font-black text-[#FF2D55]">{m.ms}</p>
              <p className="text-xs font-semibold text-[#F0F0F8] mt-1">{m.label}</p>
              <p className="text-[10px] text-[#55556A] mt-0.5">{m.use}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Components Section ───────────────────────────────────────────────────────

function ComponentsSection() {
  return (
    <div className="space-y-10">
      <SectionTitle
        title="Components"
        description="Core display and interaction primitives."
      />

      {/* Buttons */}
      <div>
        <SubTitle>Buttons — Intent</SubTitle>
        <DemoBox className="space-y-4">
          {(["primary", "secondary", "ghost", "outline", "success", "danger"] as const).map((intent) => (
            <div key={intent} className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#55556A] w-24 shrink-0 font-mono">{intent}</span>
              <Button intent={intent} size="xs">{intent}</Button>
              <Button intent={intent} size="sm">{intent}</Button>
              <Button intent={intent} size="md">{intent}</Button>
              <Button intent={intent} size="lg">{intent}</Button>
              <Button intent={intent} size="xl">{intent}</Button>
            </div>
          ))}
        </DemoBox>

        <div className="mt-3">
          <SubTitle>Buttons — States & Icons</SubTitle>
          <DemoBox className="flex flex-wrap gap-3">
            <Button intent="primary" leftIcon={<Zap size={14} />}>With icon</Button>
            <Button intent="secondary" rightIcon={<ArrowRight size={14} />}>Continue</Button>
            <Button intent="primary" loading>Loading...</Button>
            <Button intent="secondary" disabled>Disabled</Button>
            <Button intent="primary"   size="icon-sm"><Plus size={14} /></Button>
            <Button intent="secondary" size="icon-md"><Bell size={16} /></Button>
            <Button intent="ghost"     size="icon-md"><Settings size={16} /></Button>
            <Button intent="danger"    size="icon-md"><Trash2 size={16} /></Button>
          </DemoBox>
        </div>
      </div>

      <Divider />

      {/* Badges */}
      <div>
        <SubTitle>Badges</SubTitle>
        <DemoBox className="flex flex-wrap gap-2">
          <Badge variant="brand">Brand</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="ghost">Ghost</Badge>
          <Badge variant="vip"><Star size={10} /> Ultra VIP</Badge>
          <Badge variant="premium">Premium</Badge>
          <Badge variant="core">Core</Badge>
          <Badge variant="casual">Casual</Badge>
          <LevelBadge level="Ultra VIP" />
          <LevelBadge level="Premium" />
          <LevelBadge level="Core" />
          <StatusBadge status="active" />
          <StatusBadge status="negotiating" />
          <StatusBadge status="renewing" />
        </DemoBox>
      </div>

      <Divider />

      {/* Avatars */}
      <div>
        <SubTitle>Avatars</SubTitle>
        <DemoBox>
          <div className="flex items-end gap-6 flex-wrap">
            {(["sm", "md", "lg"] as const).map((size) => (
              <div key={size} className="flex items-end gap-3">
                <Avatar initials="RC" size={size} color="brand" />
                <Avatar initials="AB" size={size} color="auto" />
                <Avatar initials="CD" size={size} color="auto" />
                <Avatar initials="EF" size={size} color="auto" />
                <span className="text-[10px] text-[#55556A] mb-1 ml-1 font-mono">{size}</span>
              </div>
            ))}
          </div>
        </DemoBox>
      </div>

      <Divider />

      {/* Cards */}
      <div>
        <SubTitle>Cards</SubTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <p className="text-sm text-[#8888AA] mb-2">Base Card</p>
            <p className="text-xs text-[#55556A] leading-relaxed">
              Default surface. Rounded corners, subtle border, gradient overlay.
            </p>
          </Card>
          <Card glow className="p-5">
            <p className="text-sm text-[#8888AA] mb-2">Glow Card</p>
            <p className="text-xs text-[#55556A] leading-relaxed">
              Brand glow box-shadow for emphasis.
            </p>
          </Card>
          <Card hover className="p-5">
            <p className="text-sm text-[#8888AA] mb-2">Hover Card</p>
            <p className="text-xs text-[#55556A] leading-relaxed">
              Lift on hover. Use for clickable cards.
            </p>
          </Card>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Fans" value="124K" change={12.4} icon={<Users size={18} />} />
          <StatCard label="Revenue"    value="$2.8M" change={8.1}  icon={<BarChart3 size={18} />} accent />
          <StatCard label="Alerts"     value="3"     change={-2}   icon={<Bell size={18} />} />
          <StatCard label="Campaigns"  value="12"    change={0}    icon={<Zap size={18} />} />
        </div>
      </div>

      <Divider />

      {/* Tabs */}
      <div>
        <SubTitle>Tabs</SubTitle>
        <TabsDemo />
      </div>

      <Divider />

      {/* Engagement Bar */}
      <div>
        <SubTitle>Engagement Bar</SubTitle>
        <DemoBox className="space-y-4 max-w-sm">
          <EngagementBar value={92} />
          <EngagementBar value={74} />
          <EngagementBar value={55} />
          <EngagementBar value={30} />
        </DemoBox>
      </div>

      <Divider />

      {/* Pills / Status */}
      <div>
        <SubTitle>Status Pills</SubTitle>
        <DemoBox className="flex flex-wrap gap-3">
          {[
            { label: "Live",        color: "bg-[#00D4A8]/10 text-[#00D4A8] border-[#00D4A8]/20" },
            { label: "Processing",  color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
            { label: "Warning",     color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
            { label: "Error",       color: "bg-red-500/10 text-red-400 border-red-500/20" },
            { label: "Offline",     color: "bg-white/[0.05] text-[#8888AA] border-white/[0.06]" },
          ].map(({ label, color }) => (
            <div
              key={label}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold", color)}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", label === "Live" ? "animate-pulse bg-[#00D4A8]" : "bg-current")} />
              {label}
            </div>
          ))}
        </DemoBox>
      </div>

      <Divider />

      {/* Popover */}
      <div>
        <SubTitle>Popover</SubTitle>
        <PopoverDemo />
      </div>

      <Divider />

      {/* Dropdown Menu */}
      <div>
        <SubTitle>Dropdown Menu</SubTitle>
        <DropdownMenuDemo />
      </div>
    </div>
  );
}

// ─── Popover Demo ─────────────────────────────────────────────────────────────

function PopoverDemo() {
  return (
    <div className="flex flex-wrap gap-6 items-start">

      {/* Basic popover */}
      <DemoBox className="flex flex-col gap-4">
        <p className="text-[10px] font-mono text-[#55556A]">Basic — align=&quot;start&quot;</p>
        <Popover>
          <Popover.Trigger asChild>
            <Button intent="secondary" size="sm" leftIcon={<SlidersHorizontal size={13} />}>
              Filter options
            </Button>
          </Popover.Trigger>
          <Popover.Content align="start" className="w-64">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#F0F0F8] mb-2">Filter by status</p>
                <div className="space-y-1.5">
                  {["Active fans", "Premium tier", "Recent joiners", "Churned"].map((item) => (
                    <label key={item} className="flex items-center gap-2.5 cursor-pointer group">
                      <span className="w-4 h-4 rounded-md border border-white/[0.12] bg-white/[0.04] group-hover:border-[#FF2D55]/40 transition-colors flex items-center justify-center" />
                      <span className="text-sm text-[#C8C8E0]">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.06] flex gap-2">
                <Button intent="primary" size="sm" className="flex-1">Apply</Button>
                <Button intent="ghost"   size="sm">Reset</Button>
              </div>
            </div>
          </Popover.Content>
        </Popover>
      </DemoBox>

      {/* Info popover with close button */}
      <DemoBox className="flex flex-col gap-4">
        <p className="text-[10px] font-mono text-[#55556A]">With close button — align=&quot;center&quot;</p>
        <Popover>
          <Popover.Trigger asChild>
            <Button intent="secondary" size="sm" leftIcon={<Info size={13} />}>
              What is this?
            </Button>
          </Popover.Trigger>
          <Popover.Content align="center" showClose className="w-72">
            <div className="pr-4 space-y-2">
              <p className="text-sm font-semibold text-[#F0F0F8]">Fan Engagement Score</p>
              <p className="text-xs text-[#8888AA] leading-relaxed">
                A composite metric (0–100) combining match attendance, app activity,
                social interactions, and merchandise spend over the last 90 days.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs text-[#FF2D55] font-semibold">Read the docs</span>
                <ExternalLink size={11} className="text-[#FF2D55]" />
              </div>
            </div>
          </Popover.Content>
        </Popover>
      </DemoBox>

      {/* Calendar-style trigger */}
      <DemoBox className="flex flex-col gap-4">
        <p className="text-[10px] font-mono text-[#55556A]">Custom trigger — align=&quot;end&quot;</p>
        <Popover>
          <Popover.Trigger asChild>
            <button className={cn(
              "flex items-center gap-2 h-9 px-3 rounded-xl",
              "border border-white/[0.08] bg-white/[0.03]",
              "text-sm text-[#C8C8E0] hover:bg-white/[0.06] transition-colors"
            )}>
              <Calendar size={13} className="text-[#8888AA]" />
              May 2026
              <ChevronRight size={12} className="text-[#55556A] rotate-90" />
            </button>
          </Popover.Trigger>
          <Popover.Content align="end" className="w-56">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#55556A] pb-2">
                Jump to period
              </p>
              {["Q1 2026 — Jan–Mar", "Q2 2026 — Apr–Jun", "Q3 2026 — Jul–Sep", "Temporada 25/26"].map((p) => (
                <button
                  key={p}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-[#C8C8E0] hover:text-[#F0F0F8] hover:bg-white/[0.06] transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </Popover.Content>
        </Popover>
      </DemoBox>

    </div>
  );
}

// ─── DropdownMenu Demo ────────────────────────────────────────────────────────

function DropdownMenuDemo() {
  const [showLabels,  setShowLabels]  = useState(true);
  const [showAvatars, setShowAvatars] = useState(false);
  const [viewMode,    setViewMode]    = useState("list");

  return (
    <div className="flex flex-wrap gap-6 items-start">

      {/* Standard action menu */}
      <DemoBox className="flex flex-col gap-4">
        <p className="text-[10px] font-mono text-[#55556A]">Row action menu</p>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="w-7 h-7 rounded-full bg-[#FF2D55]/20 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-[#FF2D55]">RC</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#F0F0F8]">Rodrigo Castillo</p>
            <p className="text-[10px] text-[#55556A]">Ultra VIP · Buenos Aires</p>
          </div>
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button size="icon-sm" intent="ghost" aria-label="Row actions">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Label>Fan actions</DropdownMenu.Label>
              <DropdownMenu.Item icon={<Eye size={13} />}>View profile</DropdownMenu.Item>
              <DropdownMenu.Item icon={<Pencil size={13} />}>Edit details</DropdownMenu.Item>
              <DropdownMenu.Item icon={<Share2 size={13} />}>Share</DropdownMenu.Item>
              <DropdownMenu.Item icon={<Download size={13} />} shortcut="⌘E">Export data</DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item icon={<Flag size={13} />}>Flag for review</DropdownMenu.Item>
              <DropdownMenu.Item icon={<Trash2 size={13} />} variant="destructive">Remove fan</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
      </DemoBox>

      {/* Checkbox items */}
      <DemoBox className="flex flex-col gap-4">
        <p className="text-[10px] font-mono text-[#55556A]">Checkbox items — column visibility</p>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button intent="secondary" size="sm" leftIcon={<SlidersHorizontal size={13} />}>
              Columns
              <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FF2D55]/15 text-[#FF2D55]">
                2
              </span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="start">
            <DropdownMenu.Label>Toggle columns</DropdownMenu.Label>
            <DropdownMenu.CheckboxItem
              checked={showLabels}
              onCheckedChange={setShowLabels}
            >
              Show labels
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem
              checked={showAvatars}
              onCheckedChange={setShowAvatars}
            >
              Show avatars
            </DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem checked>Engagement score</DropdownMenu.CheckboxItem>
            <DropdownMenu.CheckboxItem checked>Last active</DropdownMenu.CheckboxItem>
          </DropdownMenu.Content>
        </DropdownMenu>
        <div className="text-[10px] text-[#55556A] font-mono">
          labels: {String(showLabels)} · avatars: {String(showAvatars)}
        </div>
      </DemoBox>

      {/* Radio group */}
      <DemoBox className="flex flex-col gap-4">
        <p className="text-[10px] font-mono text-[#55556A]">Radio group — view mode</p>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button intent="secondary" size="sm" leftIcon={viewMode === "list" ? <List size={13} /> : <LayoutGrid size={13} />}>
              {viewMode === "list" ? "List view" : "Grid view"}
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="start">
            <DropdownMenu.Label>View mode</DropdownMenu.Label>
            <DropdownMenu.RadioGroup value={viewMode} onValueChange={setViewMode}>
              <DropdownMenu.RadioItem value="list">
                <span className="flex items-center gap-2">
                  <List size={13} className="text-[#8888AA]" />
                  List view
                </span>
              </DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="grid">
                <span className="flex items-center gap-2">
                  <LayoutGrid size={13} className="text-[#8888AA]" />
                  Grid view
                </span>
              </DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu>
        <div className="text-[10px] text-[#55556A] font-mono">
          view: {viewMode}
        </div>
      </DemoBox>

      {/* Sub-menu */}
      <DemoBox className="flex flex-col gap-4">
        <p className="text-[10px] font-mono text-[#55556A]">Sub-menu — nested actions</p>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button intent="secondary" size="sm" leftIcon={<Settings size={13} />}>
              Settings
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="start">
            <DropdownMenu.Item icon={<Eye size={13} />}>View report</DropdownMenu.Item>
            <DropdownMenu.Item icon={<Copy size={13} />} shortcut="⌘C">Duplicate</DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger icon={<Download size={13} />}>
                Export as
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item>PDF report</DropdownMenu.Item>
                <DropdownMenu.Item>Excel (.xlsx)</DropdownMenu.Item>
                <DropdownMenu.Item>CSV</DropdownMenu.Item>
                <DropdownMenu.Item>JSON</DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger icon={<Share2 size={13} />}>
                Share with
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent>
                <DropdownMenu.Item icon={<BookMarked size={13} />}>Team members</DropdownMenu.Item>
                <DropdownMenu.Item icon={<ExternalLink size={13} />}>Public link</DropdownMenu.Item>
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
            <DropdownMenu.Separator />
            <DropdownMenu.Item icon={<Trash2 size={13} />} variant="destructive">Delete</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </DemoBox>

      {/* Card header menu — common pattern */}
      <DemoBox className="flex flex-col gap-4 w-full max-w-sm">
        <p className="text-[10px] font-mono text-[#55556A]">Card header menu — common usage</p>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <div>
              <p className="text-sm font-semibold text-[#F0F0F8]">Top Sponsors ROI</p>
              <p className="text-xs text-[#55556A] mt-0.5">Season 2025/26</p>
            </div>
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button size="icon-sm" intent="ghost" aria-label="Card options">
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item icon={<Download size={13} />} shortcut="⌘E">Export</DropdownMenu.Item>
                <DropdownMenu.Item icon={<Copy size={13} />}>Duplicate widget</DropdownMenu.Item>
                <DropdownMenu.Item icon={<ExternalLink size={13} />}>Open full report</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item icon={<Settings size={13} />}>Widget settings</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            {[
              { name: "SportsTech SA",    roi: "4.8×", color: "#00D4A8" },
              { name: "BancaPlus",        roi: "3.2×", color: "#3B82F6" },
              { name: "AeroVuelos",       roi: "2.9×", color: "#F59E0B" },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-[#C8C8E0]">{s.name}</span>
                </div>
                <span className="font-bold text-[#F0F0F8]">{s.roi}</span>
              </div>
            ))}
          </div>
        </div>
      </DemoBox>

    </div>
  );
}

function TabsDemo() {
  const [lineTab,  setLineTab]  = useState("overview");
  const [pillTab,  setPillTab]  = useState("all");

  const lineTabs = [
    { id: "overview",  label: "Overview" },
    { id: "analytics", label: "Analytics", badge: 3 },
    { id: "fans",      label: "Fans" },
    { id: "sponsors",  label: "Sponsors" },
    { id: "archived",  label: "Archived", disabled: true },
  ];

  const pillTabs = [
    { id: "all",    label: "All",    icon: <Layers size={12} /> },
    { id: "active", label: "Active", badge: 12 },
    { id: "draft",  label: "Draft" },
    { id: "paused", label: "Paused" },
  ];

  return (
    <div className="space-y-6">
      <DemoBox>
        <p className="text-[10px] font-mono text-[#55556A] mb-4">variant=&quot;line&quot;</p>
        <Tabs items={lineTabs} active={lineTab} onChange={setLineTab} />
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-[#55556A]">
          Active tab: <span className="text-[#F0F0F8] font-mono">{lineTab}</span>
        </div>
      </DemoBox>

      <DemoBox>
        <p className="text-[10px] font-mono text-[#55556A] mb-4">variant=&quot;pill&quot;</p>
        <Tabs items={pillTabs} active={pillTab} onChange={setPillTab} variant="pill" />
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-[#55556A]">
          Active tab: <span className="text-[#F0F0F8] font-mono">{pillTab}</span>
        </div>
      </DemoBox>
    </div>
  );
}

// ─── Forms Section ────────────────────────────────────────────────────────────

function FormsSection() {
  const [checkA,           setCheckA]           = useState(true);
  const [checkB,           setCheckB]           = useState(false);
  const [sw1,              setSw1]              = useState(true);
  const [sw2,              setSw2]              = useState(false);
  const [radio,            setRadio]            = useState("option1");
  const [comboSegment,     setComboSegment]     = useState<string | null>(null);
  const [comboClub,        setComboClub]        = useState<string | null>("river");
  const [comboMetric,      setComboMetric]      = useState<string | null>(null);
  const [multiTags,        setMultiTags]        = useState<string[]>(["season-ticket", "merch-buyer"]);
  const [multiKPIs,        setMultiKPIs]        = useState<string[]>([]);
  const [multiSegments,    setMultiSegments]    = useState<string[]>([]);

  return (
    <div className="space-y-10">
      <SectionTitle title="Forms" description="Inputs, selects, and form controls." />

      {/* Inputs */}
      <div>
        <SubTitle>Text Inputs</SubTitle>
        <DemoBox className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          <Input label="Default" placeholder="Enter value..." />
          <Input label="With icon" placeholder="Search..." leftIcon={<Search size={14} />} />
          <Input label="With right icon" placeholder="Email" rightIcon={<CheckCircle2 size={14} />} />
          <Input label="Helper text" placeholder="Username" helperText="Must be unique" />
          <Input label="Error state" placeholder="Email" errorText="Invalid email address" defaultValue="not-an-email" />
          <Input label="Disabled" placeholder="Can't edit" disabled defaultValue="Locked value" />
          <Input label="Small" placeholder="Small input" size="sm" />
          <Input label="Large" placeholder="Large input" size="lg" />
        </DemoBox>
      </div>

      <Divider />

      {/* Select */}
      <div>
        <SubTitle>Select</SubTitle>
        <DemoBox className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          <Select
            label="Sport"
            placeholder="Choose a sport..."
            options={[
              { value: "football", label: "Football" },
              { value: "basketball", label: "Basketball" },
              { value: "tennis", label: "Tennis" },
            ]}
          />
          <Select
            label="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "pending", label: "Pending" },
            ]}
            defaultValue="active"
          />
          <Select
            label="Error state"
            options={[{ value: "opt", label: "Option" }]}
            errorText="Required field"
          />
          <Select
            label="Disabled"
            options={[{ value: "opt", label: "Option" }]}
            disabled
            defaultValue="opt"
          />
        </DemoBox>
      </div>

      <Divider />

      {/* Textarea */}
      <div>
        <SubTitle>Textarea</SubTitle>
        <DemoBox className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          <Textarea
            label="Description"
            placeholder="Write a description..."
            helperText="Max 500 characters"
          />
          <Textarea
            label="Error state"
            placeholder="Notes"
            errorText="This field is required"
          />
        </DemoBox>
      </div>

      <Divider />

      {/* Checkboxes */}
      <div>
        <SubTitle>Checkboxes</SubTitle>
        <DemoBox className="flex flex-col gap-4 max-w-sm">
          <Checkbox
            label="Enable notifications"
            description="Receive real-time alerts about fan activity"
            checked={checkA}
            onChange={(e) => setCheckA(e.target.checked)}
          />
          <Checkbox
            label="Agree to terms"
            checked={checkB}
            onChange={(e) => setCheckB(e.target.checked)}
          />
          <Checkbox label="Indeterminate" indeterminate />
          <Checkbox label="Disabled (on)"  checked disabled />
          <Checkbox label="Disabled (off)" disabled />
          <Checkbox label="Small size" size="sm" />
        </DemoBox>
      </div>

      <Divider />

      {/* Switches */}
      <div>
        <SubTitle>Switches</SubTitle>
        <DemoBox className="flex flex-col gap-4 max-w-sm">
          <Switch
            label="Real-time sync"
            description="Sync fan data every 30 seconds"
            checked={sw1}
            onChange={(e) => setSw1(e.target.checked)}
          />
          <Switch
            label="Email alerts"
            checked={sw2}
            onChange={(e) => setSw2(e.target.checked)}
          />
          <Switch label="Small size" size="sm" defaultChecked />
          <Switch label="Disabled (on)"  checked disabled />
          <Switch label="Disabled (off)" disabled />
        </DemoBox>
      </div>

      <Divider />

      {/* Radio */}
      <div>
        <SubTitle>Radio Groups</SubTitle>
        <DemoBox className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          <RadioGroup
            name="plan"
            label="Subscription Plan"
            value={radio}
            onChange={setRadio}
            options={[
              { value: "option1", label: "Starter",     description: "Up to 10K fans" },
              { value: "option2", label: "Pro",          description: "Up to 100K fans" },
              { value: "option3", label: "Enterprise",  description: "Unlimited fans" },
              { value: "option4", label: "Legacy (unavailable)", disabled: true },
            ]}
          />
          <RadioGroup
            name="view"
            label="Display Mode"
            value="grid"
            onChange={() => {}}
            direction="horizontal"
            options={[
              { value: "grid",   label: "Grid" },
              { value: "list",   label: "List" },
              { value: "table",  label: "Table" },
            ]}
          />
        </DemoBox>
      </div>

      <Divider />

      {/* Combobox */}
      <div>
        <SubTitle>Combobox — Searchable Select</SubTitle>
        <ComboboxDemos
          comboSegment={comboSegment}     setComboSegment={setComboSegment}
          comboClub={comboClub}           setComboClub={setComboClub}
          comboMetric={comboMetric}       setComboMetric={setComboMetric}
        />
      </div>

      <Divider />

      {/* MultiSelect */}
      <div>
        <SubTitle>MultiSelect — Multi-value Picker</SubTitle>
        <MultiSelectDemos
          multiTags={multiTags}           setMultiTags={setMultiTags}
          multiKPIs={multiKPIs}           setMultiKPIs={setMultiKPIs}
          multiSegments={multiSegments}   setMultiSegments={setMultiSegments}
        />
      </div>
    </div>
  );
}

// ─── Combobox demos ───────────────────────────────────────────────────────────

const fanSegmentOptions = [
  { value: "ultra-vip",   label: "Ultra VIP",    icon: <Trophy size={13} />,    description: "8,750 fans · $4,850 avg LTV" },
  { value: "premium",     label: "Premium",      icon: <TrendingUp size={13} />, description: "31,200 fans · $920 avg LTV" },
  { value: "core",        label: "Core Fan",     icon: <Users size={13} />,      description: "62,100 fans · $280 avg LTV" },
  { value: "casual",      label: "Casual",       icon: <Activity size={13} />,   description: "45,780 fans · $45 avg LTV" },
  { value: "churned",     label: "Churned",      description: "12,320 fans · at risk", disabled: false },
  { value: "new",         label: "New (30d)",    description: "3,890 fans · joining" },
];

const clubOptions = [
  {
    group: "Liga Argentina",
    options: [
      { value: "river",   label: "Toluca FC",    icon: <Shield size={13} />, description: "Toluca · 4M fans" },
      { value: "boca",    label: "América",   icon: <Shield size={13} />, description: "Ciudad de México · 18.4M fans" },
      { value: "racing",  label: "Atlas",    icon: <Shield size={13} />, description: "Guadalajara · 1.6M fans" },
      { value: "sanlo",   label: "Monterrey",    icon: <Shield size={13} />, description: "Guadalupe · 2.8M fans" },
    ],
  },
  {
    group: "Liga Española",
    options: [
      { value: "real",    label: "Real Madrid",    icon: <Trophy size={13} />, description: "Madrid · 340M fans worldwide" },
      { value: "barca",   label: "FC Barcelona",   icon: <Trophy size={13} />, description: "Barcelona · 310M fans worldwide" },
      { value: "atleti",  label: "Atlético Madrid", description: "Madrid · 72M fans worldwide", disabled: true },
    ],
  },
  {
    group: "Premier League",
    options: [
      { value: "mancity", label: "Manchester City", description: "Manchester · 145M fans worldwide" },
      { value: "arsenal", label: "Arsenal",         description: "London · 90M fans worldwide" },
      { value: "chelsea", label: "Chelsea",         description: "London · 78M fans worldwide" },
    ],
  },
];

const kpiMetricOptions = [
  { value: "revenue",      label: "Revenue Total",      icon: <DollarSign size={13} />, description: "Acumulado en el período" },
  { value: "active-fans",  label: "Fans Activos",       icon: <Users size={13} />,      description: "Últimos 30 días" },
  { value: "engagement",   label: "Engagement Rate",    icon: <Activity size={13} />,   description: "Promedio ponderado" },
  { value: "tickets",      label: "Tickets Vendidos",   icon: <Ticket size={13} />,     description: "Total temporada" },
  { value: "avg-spend",    label: "Gasto Promedio",     icon: <TrendingUp size={13} />, description: "Por fan activo" },
  { value: "churn",        label: "Churn Rate",         icon: <Target size={13} />,     description: "Mensual" },
  { value: "nps",          label: "NPS del hincha",     icon: <Star size={13} />,       description: "Net Promoter Score" },
  { value: "geo-reach",    label: "Alcance Geográfico", icon: <Globe size={13} />,      description: "Países activos" },
];

interface ComboboxDemosProps {
  comboSegment: string | null;     setComboSegment: (v: string | null) => void;
  comboClub:    string | null;     setComboClub:    (v: string | null) => void;
  comboMetric:  string | null;     setComboMetric:  (v: string | null) => void;
}

function ComboboxDemos({
  comboSegment, setComboSegment,
  comboClub,    setComboClub,
  comboMetric,  setComboMetric,
}: ComboboxDemosProps) {
  const [isLoading, setIsLoading] = useState(false);

  function simulateLoad() {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  }

  return (
    <div className="space-y-6">

      {/* Row 1 — basic + clearable + sized */}
      <DemoBox className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Combobox
          label="Fan Segment"
          value={comboSegment}
          onChange={setComboSegment}
          options={fanSegmentOptions}
          placeholder="Select segment…"
          searchPlaceholder="Search segments…"
          clearable
          helperText="Filter fans by engagement tier"
        />
        <Combobox
          label="Size — sm"
          value={comboSegment}
          onChange={setComboSegment}
          options={fanSegmentOptions}
          placeholder="Compact select…"
          size="sm"
          clearable
        />
        <Combobox
          label="Size — lg"
          value={comboSegment}
          onChange={setComboSegment}
          options={fanSegmentOptions}
          placeholder="Large select…"
          size="lg"
          clearable
        />
      </DemoBox>

      {/* Row 2 — grouped options */}
      <DemoBox className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        <Combobox
          label="Club / Tenant"
          value={comboClub}
          onChange={setComboClub}
          options={clubOptions}
          placeholder="Select club…"
          searchPlaceholder="Search clubs…"
          clearable
          helperText="Grouped by league"
        />
        <Combobox
          label="KPI Metric"
          value={comboMetric}
          onChange={setComboMetric}
          options={kpiMetricOptions}
          placeholder="Choose metric…"
          searchPlaceholder="Search metrics…"
          clearable
          helperText="For custom report header"
        />
      </DemoBox>

      {/* Row 3 — states */}
      <DemoBox className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <div>
          <Combobox
            label="Loading state"
            value={null}
            onChange={() => {}}
            options={fanSegmentOptions}
            placeholder="Fetching segments…"
            loading={isLoading}
          />
          <button
            onClick={simulateLoad}
            className="mt-2 text-[10px] text-[#FF2D55] hover:underline"
          >
            {isLoading ? "Loading…" : "Trigger 2s load →"}
          </button>
        </div>
        <Combobox
          label="Error state"
          value={null}
          onChange={() => {}}
          options={fanSegmentOptions}
          placeholder="Select segment…"
          errorText="This field is required"
        />
        <Combobox
          label="Disabled"
          value="premium"
          onChange={() => {}}
          options={fanSegmentOptions}
          placeholder="Select segment…"
          disabled
        />
      </DemoBox>

      {/* Output */}
      <div className="flex flex-wrap gap-4 text-[10px] font-mono text-[#55556A]">
        <span>segment: <span className="text-[#F0F0F8]">{comboSegment ?? "null"}</span></span>
        <span>club: <span className="text-[#F0F0F8]">{comboClub ?? "null"}</span></span>
        <span>metric: <span className="text-[#F0F0F8]">{comboMetric ?? "null"}</span></span>
      </div>
    </div>
  );
}

// ─── MultiSelect demos ────────────────────────────────────────────────────────

const fanTagOptions = [
  { value: "season-ticket",   label: "Season Ticket",    icon: <Ticket size={13} /> },
  { value: "merch-buyer",     label: "Merch Buyer",      icon: <Tag size={13} /> },
  { value: "away-travel",     label: "Away Travel",      icon: <MapPin size={13} /> },
  { value: "app-user",        label: "App User",         icon: <Activity size={13} /> },
  { value: "vip-lounge",      label: "VIP Lounge",       icon: <Trophy size={13} /> },
  { value: "newsletter",      label: "Newsletter",       icon: <Target size={13} /> },
  { value: "early-adopter",   label: "Early Adopter",    icon: <Star size={13} /> },
  { value: "local",           label: "Local Fan",        icon: <MapPin size={13} /> },
  { value: "international",   label: "International",    icon: <Globe size={13} /> },
  { value: "youth-member",    label: "Youth Member",     icon: <Users size={13} /> },
];

const kpiMultiOptions = [
  {
    group: "Revenue",
    options: [
      { value: "revenue-total",    label: "Revenue Total",      description: "All revenue streams" },
      { value: "ticket-revenue",   label: "Ticket Revenue",     description: "Match + cup" },
      { value: "merch-revenue",    label: "Merch Revenue",      description: "Online + stadium" },
      { value: "sponsor-revenue",  label: "Sponsor Revenue",    description: "Active contracts" },
    ],
  },
  {
    group: "Engagement",
    options: [
      { value: "engagement-rate",  label: "Engagement Rate",    description: "Weighted average" },
      { value: "active-fans",      label: "Fans Activos",       description: "Last 30 days" },
      { value: "nps",              label: "NPS del hincha",     description: "Net Promoter Score" },
      { value: "churn-rate",       label: "Churn Rate",         description: "Monthly" },
    ],
  },
  {
    group: "Behavioral",
    options: [
      { value: "avg-spend",        label: "Gasto Promedio",     description: "Per active fan" },
      { value: "ltv-vip",          label: "LTV Ultra VIP",      description: "Lifetime value" },
      { value: "attendance",       label: "Match Attendance",   description: "% of capacity" },
    ],
  },
];

const segmentMultiOptions = fanSegmentOptions.map((o) => ({ ...o }));

interface MultiSelectDemosProps {
  multiTags:     string[];  setMultiTags:     (v: string[]) => void;
  multiKPIs:     string[];  setMultiKPIs:     (v: string[]) => void;
  multiSegments: string[];  setMultiSegments: (v: string[]) => void;
}

function MultiSelectDemos({
  multiTags, setMultiTags,
  multiKPIs, setMultiKPIs,
  multiSegments, setMultiSegments,
}: MultiSelectDemosProps) {
  return (
    <div className="space-y-6">

      {/* Row 1 — chips default + overflow */}
      <DemoBox className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <MultiSelect
          label="Fan Tags"
          value={multiTags}
          onChange={setMultiTags}
          options={fanTagOptions}
          placeholder="Add tags…"
          searchPlaceholder="Search tags…"
          helperText="Assign behavioral labels to this fan"
        />
        <MultiSelect
          label="Tags — overflow at 2"
          value={multiTags}
          onChange={setMultiTags}
          options={fanTagOptions}
          placeholder="Add tags…"
          overflowAt={2}
          helperText="Shows +N counter beyond 2 chips"
        />
      </DemoBox>

      {/* Row 2 — grouped + select all + max */}
      <DemoBox className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <MultiSelect
          label="KPI Metrics — grouped + select all"
          value={multiKPIs}
          onChange={setMultiKPIs}
          options={kpiMultiOptions}
          placeholder="Choose metrics for report…"
          searchPlaceholder="Filter metrics…"
          selectAll
          helperText="For custom analytics report"
        />
        <MultiSelect
          label="Segments — max 3 selections"
          value={multiSegments}
          onChange={setMultiSegments}
          options={segmentMultiOptions}
          placeholder="Target segments…"
          searchPlaceholder="Search segments…"
          maxSelections={3}
          helperText="Campaign targeting — choose up to 3"
        />
      </DemoBox>

      {/* Row 3 — compact + disabled + sizes */}
      <DemoBox className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MultiSelect
          label="Compact mode"
          value={multiTags}
          onChange={setMultiTags}
          options={fanTagOptions}
          placeholder="Select tags…"
          compact
          helperText="Shows count chip instead of labels"
        />
        <MultiSelect
          label="Small size"
          value={multiTags.slice(0, 2)}
          onChange={() => {}}
          options={fanTagOptions}
          placeholder="Tags…"
          size="sm"
          overflowAt={1}
        />
        <MultiSelect
          label="Disabled"
          value={["season-ticket", "vip-lounge"]}
          onChange={() => {}}
          options={fanTagOptions}
          placeholder="Select tags…"
          disabled
        />
      </DemoBox>

      {/* Output */}
      <div className="flex flex-wrap gap-4 text-[10px] font-mono text-[#55556A]">
        <span>tags ({multiTags.length}): <span className="text-[#F0F0F8]">[{multiTags.join(", ")}]</span></span>
        <span>kpis ({multiKPIs.length}): <span className="text-[#F0F0F8]">[{multiKPIs.join(", ")}]</span></span>
        <span>segments ({multiSegments.length}): <span className="text-[#F0F0F8]">[{multiSegments.join(", ")}]</span></span>
      </div>
    </div>
  );
}

// ─── Feedback Section ─────────────────────────────────────────────────────────

function FeedbackSectionInner() {
  const [modalOpen,  setModalOpen]  = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-10">
      <SectionTitle title="Feedback" description="Overlays, notifications, loading states, and empty states." />

      {/* Skeletons */}
      <div>
        <SubTitle>Skeletons</SubTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DemoBox>
            <p className="text-[10px] font-mono text-[#55556A] mb-4">SkeletonCard</p>
            <SkeletonCard />
          </DemoBox>
          <DemoBox>
            <p className="text-[10px] font-mono text-[#55556A] mb-4">SkeletonChart</p>
            <SkeletonChart />
          </DemoBox>
          <DemoBox className="space-y-4">
            <p className="text-[10px] font-mono text-[#55556A]">Various Skeletons</p>
            <div className="flex items-center gap-3">
              <SkeletonAvatar size="md" />
              <SkeletonText lines={2} className="flex-1" />
            </div>
            <div className="flex items-center gap-3">
              <SkeletonAvatar size="sm" />
              <SkeletonText lines={2} className="flex-1" />
            </div>
            <SkeletonTableRow />
            <SkeletonTableRow />
          </DemoBox>
        </div>
      </div>

      <Divider />

      {/* Loading */}
      <div>
        <SubTitle>Loading States</SubTitle>
        <DemoBox className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={20} className="animate-spin text-[#FF2D55]" />
            <span className="text-[10px] text-[#55556A]">Spinner</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#FF2D55]"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
            <span className="text-[10px] text-[#55556A]">Dots</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B] rounded-full"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <span className="text-[10px] text-[#55556A]">Indeterminate bar</span>
          </div>
          <Button intent="primary" loading>Saving changes...</Button>
        </DemoBox>
      </div>

      <Divider />

      {/* Empty States */}
      <div>
        <SubTitle>Empty States</SubTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DemoBox className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Users size={22} className="text-[#55556A]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#F0F0F8]">No fans yet</p>
              <p className="text-xs text-[#55556A] mt-1">Start by importing your fan base</p>
            </div>
            <Button intent="primary" size="sm" leftIcon={<Plus size={12} />}>Import fans</Button>
          </DemoBox>

          <DemoBox className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center">
              <AlertTriangle size={22} className="text-[#FF2D55]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#F0F0F8]">No results found</p>
              <p className="text-xs text-[#55556A] mt-1">Try adjusting your filters</p>
            </div>
            <Button intent="ghost" size="sm" leftIcon={<RefreshCw size={12} />}>Clear filters</Button>
          </DemoBox>
        </div>
      </div>

      <Divider />

      {/* Toasts */}
      <div>
        <SubTitle>Toasts</SubTitle>
        <DemoBox className="flex flex-wrap gap-3">
          <Button
            intent="success"
            size="sm"
            leftIcon={<CheckCircle2 size={13} />}
            onClick={() => toast({ title: "Saved successfully", message: "Fan profile updated.", variant: "success" })}
          >
            Success toast
          </Button>
          <Button
            intent="danger"
            size="sm"
            leftIcon={<AlertTriangle size={13} />}
            onClick={() => toast({ title: "Something went wrong", message: "Please try again later.", variant: "error" })}
          >
            Error toast
          </Button>
          <Button
            intent="secondary"
            size="sm"
            leftIcon={<Info size={13} />}
            onClick={() => toast({ title: "Campaign scheduled", message: "Goes live at 18:00 UTC.", variant: "info" })}
          >
            Info toast
          </Button>
          <Button
            intent="secondary"
            size="sm"
            leftIcon={<AlertTriangle size={13} />}
            onClick={() => toast({ title: "Low engagement detected", variant: "warning" })}
          >
            Warning toast
          </Button>
          <Button
            intent="ghost"
            size="sm"
            onClick={() => toast({ title: "Notification", message: "This is a default toast." })}
          >
            Default toast
          </Button>
        </DemoBox>
      </div>

      <Divider />

      {/* Modal */}
      <div>
        <SubTitle>Modal</SubTitle>
        <DemoBox className="flex flex-wrap gap-3">
          <Button intent="secondary" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>
        </DemoBox>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Confirm action"
          subtitle="This action cannot be undone."
          footer={
            <>
              <Button intent="ghost"   size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button intent="danger"  size="sm" onClick={() => setModalOpen(false)}>Delete</Button>
            </>
          }
        >
          <div className="py-2 space-y-3">
            <p className="text-sm text-[#8888AA] leading-relaxed">
              You are about to permanently delete this fan segment. All associated
              data including campaigns and analytics will be removed.
            </p>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/[0.06] border border-red-500/20">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400 leading-snug">
                This affects 3 active campaigns. They will be paused automatically.
              </p>
            </div>
          </div>
        </Modal>
      </div>

      <Divider />

      {/* Drawer */}
      <div>
        <SubTitle>Drawer</SubTitle>
        <DemoBox className="flex flex-wrap gap-3">
          <Button intent="secondary" onClick={() => setDrawerOpen(true)}>
            Open Drawer
          </Button>
        </DemoBox>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Fan Profile"
          subtitle="Toluca FC — Active Member"
          footer={
            <>
              <Button intent="ghost"   size="sm" onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button intent="primary" size="sm">Save changes</Button>
            </>
          }
        >
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <Avatar initials="MG" size="lg" color="auto" />
              <div>
                <p className="text-sm font-bold text-[#F0F0F8]">Matías González</p>
                <p className="text-xs text-[#55556A]">mgonzalez@email.com</p>
                <div className="mt-1"><LevelBadge level="Premium" /></div>
              </div>
            </div>
            <Input label="Display name" defaultValue="Matías González" />
            <Input label="Email" defaultValue="mgonzalez@email.com" />
            <Select
              label="Fan tier"
              options={[
                { value: "vip",     label: "Ultra VIP" },
                { value: "premium", label: "Premium" },
                { value: "core",    label: "Core" },
                { value: "casual",  label: "Casual" },
              ]}
              defaultValue="premium"
            />
            <Switch label="Send weekly digest" defaultChecked />
          </div>
        </Drawer>
      </div>

      <Divider />

      {/* Coming Soon Banner */}
      <div>
        <SubTitle>Coming Soon Banner</SubTitle>
        <DemoBox>
          <ComingSoonBanner label="Próximamente — Q3 2025" />
          <ComingSoonBanner label="Beta access available" delay={0} />
        </DemoBox>
      </div>
    </div>
  );
}

function FeedbackSection() {
  return (
    <ToastProvider>
      <FeedbackSectionInner />
    </ToastProvider>
  );
}

// ─── Layout Section ───────────────────────────────────────────────────────────

function LayoutSection() {
  return (
    <div className="space-y-10">
      <SectionTitle title="Layout" description="Shell patterns and responsive behavior." />

      {/* Sidebar preview */}
      <div>
        <SubTitle>Sidebar States</SubTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Expanded */}
          <DemoBox className="p-0 overflow-hidden">
            <div className="p-3 border-b border-white/[0.06]">
              <p className="text-[10px] font-mono text-[#55556A]">Expanded — 224px</p>
            </div>
            <div className="flex h-64">
              <div className="w-[224px] bg-[#0D0D14] border-r border-white/[0.06] flex flex-col shrink-0">
                <div className="flex items-center gap-3 px-4 h-12 border-b border-white/[0.06]">
                  <div className="w-7 h-7 rounded-lg bg-[#FF2D55] flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-xs">BF</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#F0F0F8]">BigFana</p>
                    <p className="text-[9px] text-[#55556A]">Fan Intelligence</p>
                  </div>
                </div>
                <nav className="flex-1 py-3 px-2 space-y-0.5">
                  {[
                    { label: "Dashboard", icon: BarChart3, active: true },
                    { label: "Fans",      icon: Users,     active: false },
                    { label: "Sponsors",  icon: Star,      active: false },
                    { label: "Analytics", icon: BarChart3, active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={cn(
                        "flex items-center gap-3 h-9 px-3 rounded-xl text-xs font-medium",
                        item.active
                          ? "bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20"
                          : "text-[#8888AA]"
                      )}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>
              <div className="flex-1 p-4">
                <div className="h-full rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                  <p className="text-xs text-[#55556A]">Main content</p>
                </div>
              </div>
            </div>
          </DemoBox>

          {/* Collapsed */}
          <DemoBox className="p-0 overflow-hidden">
            <div className="p-3 border-b border-white/[0.06]">
              <p className="text-[10px] font-mono text-[#55556A]">Collapsed — 64px</p>
            </div>
            <div className="flex h-64">
              <div className="w-16 bg-[#0D0D14] border-r border-white/[0.06] flex flex-col shrink-0">
                <div className="flex items-center justify-center h-12 border-b border-white/[0.06]">
                  <div className="w-7 h-7 rounded-lg bg-[#FF2D55] flex items-center justify-center">
                    <span className="text-white font-black text-xs">BF</span>
                  </div>
                </div>
                <nav className="flex-1 py-3 space-y-0.5 flex flex-col items-center">
                  {[BarChart3, Users, Star, BarChart3].map((Icon, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        i === 0
                          ? "bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20"
                          : "text-[#8888AA]"
                      )}
                    >
                      <Icon size={16} />
                    </div>
                  ))}
                </nav>
              </div>
              <div className="flex-1 p-4">
                <div className="h-full rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                  <p className="text-xs text-[#55556A]">Main content</p>
                </div>
              </div>
            </div>
          </DemoBox>
        </div>
      </div>

      <Divider />

      {/* Header anatomy */}
      <div>
        <SubTitle>Header Anatomy</SubTitle>
        <DemoBox className="p-0 overflow-hidden">
          <div className="h-14 border-b border-white/[0.06] bg-[#0D0D14]/80 backdrop-blur-xl px-5 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] text-[#8888AA]">
              <Layout size={14} />
            </div>
            <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-white/[0.08] bg-white/[0.03] w-64">
              <Search size={13} className="text-[#55556A]" />
              <span className="text-xs text-[#55556A]">Search fans, campaigns...</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#00D4A8]/20 bg-[#00D4A8]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4A8] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#00D4A8]">Live</span>
              </div>
              <div className="w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.03] flex items-center justify-center text-[#8888AA]">
                <Bell size={14} />
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl">
                <Avatar initials="RC" size="sm" color="brand" />
                <span className="text-xs font-semibold text-[#F0F0F8]">toluca FC</span>
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-wrap gap-4">
            {["Sidebar toggle", "Global search", "Live indicator", "Notifications", "Profile menu"].map((label) => (
              <span key={label} className="text-[10px] text-[#55556A] border border-white/[0.04] rounded px-2 py-1">
                {label}
              </span>
            ))}
          </div>
        </DemoBox>
      </div>
    </div>
  );
}

// ─── Dashboard Section ────────────────────────────────────────────────────────

function DashboardSection() {
  return (
    <div className="space-y-10">
      <SectionTitle title="Dashboard Patterns" description="Reusable widget and metric card patterns." />

      {/* Stat Cards */}
      <div>
        <SubTitle>KPI / Stat Cards</SubTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Fans"  value="124K" change={12.4}  icon={<Users size={18} />} />
          <StatCard label="Revenue"     value="$2.8M" change={8.1}   icon={<BarChart3 size={18} />} accent />
          <StatCard label="Engagement"  value="74%"   change={-3.2}  icon={<Heart size={18} />} />
          <StatCard label="Campaigns"   value="12"    change={2}     icon={<Zap size={18} />} />
        </div>
      </div>

      <Divider />

      {/* Placeholder / Feature Cards */}
      <div>
        <SubTitle>Placeholder / Feature Cards</SubTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PlaceholderCard
            icon={<BarChart3 size={18} />}
            title="Revenue Analytics"
            description="Track sponsorship ROI, merchandise, and ticket revenue in real time."
            metric="$2.8M"
            metricLabel="this month"
            badge="LIVE"
            accent
          />
          <PlaceholderCard
            icon={<Users size={18} />}
            title="Fan Segmentation"
            description="Automatically group fans by behavior, location, and engagement level."
            metric="8"
            metricLabel="active segments"
          />
          <PlaceholderCard
            icon={<Zap size={18} />}
            title="Smart Campaigns"
            description="Launch targeted campaigns with AI-powered timing recommendations."
            badge="Próximamente"
          >
            <ComingSoonBanner delay={0} />
          </PlaceholderCard>
        </div>
      </div>

      <Divider />

      {/* Mini Stats */}
      <div>
        <SubTitle>MiniStat List</SubTitle>
        <div className="max-w-sm">
          <Card className="p-4">
            <p className="text-sm font-semibold text-[#F0F0F8] mb-3">Last Match Performance</p>
            <MiniStat label="Attendance"     value="43,200"   />
            <MiniStat label="Engagement"     value="+18%"     positive />
            <MiniStat label="Merch sales"    value="$42K"     positive />
            <MiniStat label="Churn risk"     value="2.1%"     positive={false} />
            <MiniStat label="New signups"    value="1,847"    />
          </Card>
        </div>
      </div>

      <Divider />

      {/* Activity item pattern */}
      <div>
        <SubTitle>Activity Item Pattern</SubTitle>
        <Card className="divide-y divide-white/[0.04]">
          {[
            { initials: "MG", name: "Matías González",  action: "upgraded to Premium",  time: "2m ago",  variant: "success" as const },
            { initials: "LR", name: "Laura Ramírez",    action: "referred 3 friends",   time: "15m ago", variant: "info"    as const },
            { initials: "CR", name: "Carlos Ríos",      action: "missed 2 matches",     time: "1h ago",  variant: "warning" as const },
            { initials: "AP", name: "Ana Pérez",        action: "completed survey",     time: "3h ago",  variant: "ghost"   as const },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <Avatar initials={item.initials} size="sm" color="auto" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#F0F0F8] truncate">{item.name}</p>
                <p className="text-[10px] text-[#55556A] truncate">{item.action}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={item.variant}>{item.variant}</Badge>
                <span className="text-[10px] text-[#55556A]">{item.time}</span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── Layout Primitives Section ────────────────────────────────────────────────

function PrimitivesSection() {
  return (
    <div className="space-y-10">
      <SectionTitle
        title="Layout Primitives"
        description="Semantic layout helpers that replace repeated Tailwind utility strings with composable, typed components."
      />

      {/* Surface */}
      <div>
        <SubTitle>Surface — Semantic Panel Variants</SubTitle>
        <p className="text-xs text-[#55556A] mb-4">
          Replaces&nbsp;
          <code className="bg-white/[0.05] rounded px-1 py-0.5 font-mono text-[11px]">
            className=&quot;rounded-2xl border border-white/[0.06] bg-[#0D0D14]&quot;
          </code>
          &nbsp;with a single&nbsp;
          <code className="bg-white/[0.05] rounded px-1 py-0.5 font-mono text-[11px]">
            &lt;Surface variant=&quot;…&quot;&gt;
          </code>
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {([
            { variant: "base",     label: "base",     desc: "Primary widget bg" },
            { variant: "elevated", label: "elevated", desc: "Settings panels, modals" },
            { variant: "overlay",  label: "overlay",  desc: "Dropdowns, popovers" },
            { variant: "glass",    label: "glass",    desc: "Floating overlays" },
            { variant: "inset",    label: "inset",    desc: "Inner cells, mini-stat rows" },
            { variant: "brand",    label: "brand",    desc: "Accent CTA panels" },
          ] as const).map(({ variant, label, desc }) => (
            <Surface key={variant} variant={variant} className="p-4">
              <p className="text-xs font-mono font-bold text-[#F0F0F8] mb-1">
                variant=&quot;{label}&quot;
              </p>
              <p className="text-[10px] text-[#55556A]">{desc}</p>
            </Surface>
          ))}
        </div>
      </div>

      <Divider />

      {/* Stack & Inline */}
      <div>
        <SubTitle>Stack + Inline — Flex Helpers</SubTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DemoBox>
            <p className="text-xs text-[#55556A] mb-3 font-mono">
              &lt;Stack gap={"{3}"}&gt;
            </p>
            <Stack gap={3}>
              {["First item", "Second item", "Third item"].map((l) => (
                <div key={l} className="h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center px-3 text-xs text-[#8888AA]">
                  {l}
                </div>
              ))}
            </Stack>
          </DemoBox>
          <DemoBox>
            <p className="text-xs text-[#55556A] mb-3 font-mono">
              &lt;Inline gap={"{2}"} justify=&quot;between&quot;&gt;
            </p>
            <Inline gap={2} justify="between">
              <Badge variant="brand">Label A</Badge>
              <Badge variant="success">Label B</Badge>
              <Badge variant="info">Label C</Badge>
            </Inline>
          </DemoBox>
        </div>
      </div>

      <Divider />

      {/* Grid */}
      <div>
        <SubTitle>Grid — Responsive Columns</SubTitle>
        <div className="space-y-4">
          {([2, 3, 4] as const).map((cols) => (
            <div key={cols}>
              <p className="text-[10px] text-[#55556A] font-mono mb-2">
                &lt;Grid cols={"{" + cols + "}"}&gt;
              </p>
              <Grid cols={cols} gap={3}>
                {Array.from({ length: cols }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs text-[#55556A]">
                    col {i + 1}
                  </div>
                ))}
              </Grid>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Section */}
      <div>
        <SubTitle>Section — Heading + Divider + Actions</SubTitle>
        <DemoBox>
          <Section
            title="Revenue & Audiences"
            description="Monthly breakdown by segment"
            divider
            actions={<Button size="xs" intent="outline">Filter</Button>}
          >
            <div className="grid grid-cols-3 gap-3 mt-1">
              {["Q1", "Q2", "Q3"].map((q) => (
                <div key={q} className="h-16 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sm font-bold text-[#55556A]">
                  {q}
                </div>
              ))}
            </div>
          </Section>
        </DemoBox>
      </div>

      <Divider />

      {/* Card anatomy */}
      <div>
        <SubTitle>Card Anatomy — Header · Content · Footer</SubTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[#55556A] font-mono mb-2">Compound anatomy</p>
            <Card>
              <Card.Header
                title="Top Fans"
                description="Ranked by XP this season"
                icon={<Star size={14} />}
                actions={<Badge variant="brand">Live</Badge>}
              />
              <Card.Content className="space-y-2">
                {[["Carlos M.", "48,200 XP"], ["Valentina R.", "41,800 XP"], ["Diego T.", "38,500 XP"]].map(([name, xp]) => (
                  <Inline key={name} justify="between">
                    <span className="text-xs text-[#F0F0F8]">{name}</span>
                    <span className="text-xs font-bold text-[#FF2D55]">{xp}</span>
                  </Inline>
                ))}
              </Card.Content>
              <Card.Footer justify="between">
                <span className="text-[10px] text-[#55556A]">Updated 2m ago</span>
                <Button size="xs" intent="ghost">Ver todos →</Button>
              </Card.Footer>
            </Card>
          </div>
          <div>
            <p className="text-[10px] text-[#55556A] font-mono mb-2">Plain usage (backward compatible)</p>
            <Card className="p-6">
              <Stack gap={3}>
                <Inline justify="between">
                  <span className="text-sm font-semibold text-[#F0F0F8]">Revenue</span>
                  <Badge variant="success">+22.4%</Badge>
                </Inline>
                <p className="text-3xl font-black text-[#F0F0F8]">$4.29M</p>
                <p className="text-xs text-[#55556A]">Temporada 2025/26</p>
              </Stack>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Motion Standards Section ─────────────────────────────────────────────────

function MotionSection() {
  const [key, setKey] = useState(0);
  const replay = () => setKey((k) => k + 1);

  const durationEntries = Object.entries(duration) as [string, number][];
  const staggerAnim = stagger(0.07);

  return (
    <div className="space-y-10">
      <SectionTitle
        title="Motion Standards"
        description="Standardized durations, easing curves, and reusable animation variants from @/lib/design-system/motion."
      />

      {/* Duration scale */}
      <div>
        <SubTitle>Duration Scale</SubTitle>
        <div className="space-y-2">
          {durationEntries.map(([name, ms]) => (
            <div key={name} className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-[#55556A] w-16 shrink-0">{name}</span>
              <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B]"
                  style={{ width: `${Math.min((ms / 0.7) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#F0F0F8] w-12 text-right font-mono">
                {Math.round(ms * 1000)}ms
              </span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Easing */}
      <div>
        <SubTitle>Easing Curves</SubTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { name: "out",   desc: "Decelerate — entering elements"  },
            { name: "in",    desc: "Accelerate — exiting elements"   },
            { name: "inOut", desc: "Symmetric — on-screen movement"  },
            { name: "sharp", desc: "Sharp entry — micro-interactions"},
          ]).map(({ name, desc }) => (
            <Surface key={name} variant="inset" className="p-4">
              <p className="text-xs font-mono font-bold text-[#F0F0F8] mb-1">ease.{name}</p>
              <p className="text-[10px] text-[#55556A]">{desc}</p>
            </Surface>
          ))}
        </div>
      </div>

      <Divider />

      {/* Stagger demo */}
      <div>
        <SubTitle>Stagger Animation</SubTitle>
        <div className="flex items-center gap-3 mb-4">
          <Button size="sm" intent="primary" leftIcon={<RefreshCw size={13} />} onClick={replay}>
            Replay
          </Button>
          <span className="text-xs text-[#55556A]">stagger(0.07) — 7 children</span>
        </div>
        <motion.div
          key={key}
          variants={staggerAnim.container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 md:grid-cols-7 gap-3"
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div
              key={i}
              variants={staggerAnim.item}
              className="h-16 rounded-xl bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center text-[#FF2D55] text-sm font-bold"
            >
              {i + 1}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <Divider />

      {/* Hover presets */}
      <div>
        <SubTitle>Hover Micro-Interactions</SubTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([
            { k: "lift",   label: "hover.lift",   desc: "Cards"          },
            { k: "grow",   label: "hover.grow",   desc: "Icon buttons"   },
            { k: "bright", label: "hover.bright", desc: "Image overlays" },
            { k: "dim",    label: "hover.dim",    desc: "Destructive"    },
          ]).map(({ k, label, desc }) => (
            <motion.div
              key={k}
              whileHover={hoverPresets[k as keyof typeof hoverPresets]}
              transition={mt.normal}
              className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] cursor-pointer"
            >
              <p className="text-xs font-mono font-bold text-[#F0F0F8] mb-0.5">{label}</p>
              <p className="text-[10px] text-[#55556A]">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <Divider />

      {/* One-shot helpers */}
      <div>
        <SubTitle>One-Shot Prop Helpers</SubTitle>
        <DemoBox>
          <div className="space-y-3">
            <p className="text-xs text-[#55556A]">
              Spread directly onto&nbsp;
              <code className="bg-white/[0.05] rounded px-1 py-0.5 font-mono text-[11px]">motion.div</code>
              &nbsp;for convenience animations:
            </p>
            {[
              { fn: "fadeUpProps(0)",   label: "Fade Up",    delay: 0   },
              { fn: "fadeUpProps(0.1)", label: "Fade Up +1", delay: 0.1 },
              { fn: "fadeInProps(0.2)", label: "Fade In +2", delay: 0.2 },
            ].map(({ fn, label, delay }) => (
              <div key={fn} className="flex items-center gap-3">
                <motion.div
                  {...(fn.startsWith("fadeIn") ? fadeInProps(delay) : fadeUpProps(delay))}
                  className="h-9 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center text-xs text-[#F0F0F8]"
                >
                  {label}
                </motion.div>
                <code className="text-[10px] font-mono text-[#55556A]">
                  {"{..."}  {fn}{"}"}
                </code>
              </div>
            ))}
          </div>
        </DemoBox>
      </div>

    </div>
  );
}

// ─── Theme Architecture Section ───────────────────────────────────────────────

const TENANT_COLORS: Record<string, { primary: string; label: string }> = {
  bigfana: { primary: "#FF2D55", label: "BigFana (Default)" },
  blue:    { primary: "#3B82F6", label: "Club Azul"         },
  green:   { primary: "#10B981", label: "Club Verde"        },
  gold:    { primary: "#F59E0B", label: "Club Dorado"       },
  violet:  { primary: "#8B5CF6", label: "Club Violeta"      },
};

function ThemeSection() {
  const [activeTheme, setActiveTheme] = useState("bigfana");

  const handleApply = (id: string) => {
    setActiveTheme(id);
    applyTenantTheme(tenantPresets[id]);
  };

  return (
    <div className="space-y-10">
      <SectionTitle
        title="Theme Architecture"
        description="Multi-tenant brand token system. Each club can override primary colors at runtime without a rebuild."
      />

      {/* Tenant switcher */}
      <div>
        <SubTitle>Live Tenant Switcher</SubTitle>
        <p className="text-xs text-[#55556A] mb-4">
          Click a preset to apply the tenant theme. CSS custom properties on&nbsp;
          <code className="bg-white/[0.05] rounded px-1 py-0.5 font-mono text-[11px]">:root</code>
          &nbsp;are updated at runtime — no rebuild required.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {Object.entries(TENANT_COLORS).map(([id, { primary, label }]) => (
            <motion.button
              key={id}
              whileHover={hoverPresets.lift}
              whileTap={{ scale: 0.97 }}
              transition={mt.normal}
              onClick={() => handleApply(id)}
              className={cn(
                "p-4 rounded-xl border transition-all text-left",
                activeTheme === id
                  ? "border-white/30 bg-white/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
              )}
            >
              <div
                className="w-8 h-8 rounded-lg mb-2.5 flex items-center justify-center"
                style={{ background: `${primary}20`, border: `1px solid ${primary}40` }}
              >
                <div className="w-3 h-3 rounded-full" style={{ background: primary }} />
              </div>
              <p className="text-xs font-semibold text-[#F0F0F8] leading-tight">{label}</p>
              {activeTheme === id && (
                <p className="text-[10px] text-[#00D4A8] mt-0.5">✓ Activo</p>
              )}
            </motion.button>
          ))}
        </div>

        {/* Live preview */}
        <DemoBox>
          <p className="text-xs text-[#55556A] mb-4">
            Live preview — components below reflect the active tenant theme:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button intent="primary" size="sm">CTA Principal</Button>
            <Button intent="outline" size="sm">Acción Secundaria</Button>
            <Badge variant="brand">Badge</Badge>
            <Badge variant="brand">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Live
            </Badge>
          </div>
          <div className="mt-4 h-2 rounded-full overflow-hidden bg-white/[0.04]">
            <motion.div
              key={activeTheme}
              className="h-full rounded-full"
              style={{ backgroundColor: TENANT_COLORS[activeTheme].primary }}
              initial={{ width: "0%" }}
              animate={{ width: "72%" }}
              transition={{ duration: 0.7, ease: [0, 0, 0.2, 1] }}
            />
          </div>
          <p className="text-[10px] text-[#55556A] mt-1.5">Progress bar color = active tenant primary</p>
        </DemoBox>
      </div>

      <Divider />

      {/* Token interface */}
      <div>
        <SubTitle>BrandTokens Interface</SubTitle>
        <Surface variant="elevated" className="p-5">
          <pre className="text-xs font-mono text-[#8888AA] leading-relaxed overflow-x-auto whitespace-pre">
{`interface BrandTokens {
  primary:           string;  // buttons, highlights, accents
  primaryDim:        string;  // hover / pressed state
  primaryGlow:       string;  // glow shadow (low alpha)
  primaryGlowStrong: string;  // focus glow (higher alpha)
}

interface TenantTheme {
  id:          string;
  displayName: string;
  brand:       BrandTokens;
  fontFamily?: string;  // optional custom typeface
}`}
          </pre>
        </Surface>
      </div>

      <Divider />

      {/* CSS var map */}
      <div>
        <SubTitle>CSS Custom Property Map</SubTitle>
        <p className="text-xs text-[#55556A] mb-3">
          Token keys map directly to CSS custom properties defined in&nbsp;
          <code className="bg-white/[0.05] rounded px-1 py-0.5 font-mono text-[11px]">globals.css @theme inline</code>.
        </p>
        <div className="space-y-0">
          {[
            { token: "primary",           var: "--color-brand",             usage: "bg-[#FF2D55], text-[#FF2D55]" },
            { token: "primaryDim",        var: "--color-brand-dim",         usage: "hover:bg-[#CC1F3F]" },
            { token: "primaryGlow",       var: "--color-brand-glow",        usage: "glow-brand-sm" },
            { token: "primaryGlowStrong", var: "--color-brand-glow-strong", usage: "glow-brand" },
          ].map((row) => (
            <div key={row.token} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <code className="text-[10px] font-mono text-[#FF2D55] w-32 shrink-0">{row.token}</code>
              <code className="text-[10px] font-mono text-[#8888AA] flex-1">{row.var}</code>
              <span className="text-[10px] text-[#55556A] hidden md:block">{row.usage}</span>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* applyTenantTheme code example */}
      <div>
        <SubTitle>Runtime Application</SubTitle>
        <Surface variant="elevated" className="p-5">
          <pre className="text-xs font-mono text-[#8888AA] leading-relaxed overflow-x-auto whitespace-pre">
{`// Call on tenant load after fetching tenant from DB:
import { applyTenantTheme, tenantPresets } from "@/lib/design-system/theme";

// From a layout or provider:
applyTenantTheme(tenantPresets["club-azul"]);

// Or with a full TenantTheme object from the DB:
applyTenantTheme({
  id: "river-club",
  displayName: "Toluca FC",
  brand: {
    primary:           "#FF2D55",
    primaryDim:        "#CC1F3F",
    primaryGlow:       "rgba(255, 45, 85, 0.15)",
    primaryGlowStrong: "rgba(255, 45, 85, 0.30)",
  },
});`}
          </pre>
        </Surface>
      </div>

    </div>
  );
}

// ─── Date & Time Section ──────────────────────────────────────────────────────

function DateTimeSection() {
  // ── DatePicker demos ───────────────────────────────────────────────────────
  const [singleDate, setSingleDate]       = useState<Date | null>(null);
  const [matchDate,  setMatchDate]        = useState<Date | null>(null);
  const [campaignDate, setCampaignDate]   = useState<Date | null>(null);

  // ── RangePicker demos ──────────────────────────────────────────────────────
  const [analyticsRange, setAnalyticsRange] = useState<DateRange | null>(null);
  const [campaignRange,  setCampaignRange]  = useState<DateRange | null>({
    from: new Date(2026, 4, 1),
    to:   new Date(2026, 4, 31),
  });

  // ── TimePicker demos ───────────────────────────────────────────────────────
  const [kickoffTime, setKickoffTime]   = useState<TimeValue | null>({ hours: 20, minutes: 30 });
  const [broadcastTime, setBroadcastTime] = useState<TimeValue | null>(null);
  const [scheduleTime, setScheduleTime]   = useState<TimeValue | null>({ hours: 9, minutes: 0 });

  return (
    <div className="space-y-10">
      <SectionTitle
        title="Date & Time System"
        description="Phase C — premium date/time pickers built on react-day-picker v10, Radix Popover, and the BigFana design system."
      />

      {/* ── DatePicker ─────────────────────────────────────────────────────── */}
      <div>
        <SubTitle>DatePicker — Single Date Selection</SubTitle>
        <p className="text-xs text-[#55556A] mb-4">
          Single date selection with keyboard navigation, clearable, min/max constraints.
          Used for match dates, campaign start dates, event scheduling.
        </p>

        <DemoBox>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Basic */}
            <DatePicker
              label="Match date"
              placeholder="Select match date…"
              value={singleDate}
              onChange={setSingleDate}
              clearable
              helperText={singleDate ? `Selected: ${singleDate.toLocaleDateString()}` : "Pick a match date"}
            />

            {/* With min/max */}
            <DatePicker
              label="Campaign start"
              placeholder="Choose start date…"
              value={campaignDate}
              onChange={setCampaignDate}
              clearable
              minDate={new Date()}
              helperText="Only future dates available"
            />

            {/* Disabled state */}
            <DatePicker
              label="Last match (locked)"
              value={new Date(2026, 4, 10)}
              onChange={() => {}}
              disabled
            />
          </div>
        </DemoBox>

        {/* Sizes */}
        <div className="mt-4">
          <SubTitle>Sizes</SubTitle>
          <DemoBox>
            <div className="flex flex-col gap-3 max-w-sm">
              <DatePicker size="sm" placeholder="Small — sm" value={null} onChange={() => {}} />
              <DatePicker size="md" placeholder="Medium — md (default)" value={null} onChange={() => {}} />
              <DatePicker size="lg" placeholder="Large — lg" value={null} onChange={() => {}} />
            </div>
          </DemoBox>
        </div>

        {/* Realistic usage: analytics filter */}
        <div className="mt-4">
          <SubTitle>Context — Analytics Filter Bar</SubTitle>
          <DemoBox>
            <div className="flex flex-wrap items-end gap-3">
              <DatePicker
                label="From"
                size="sm"
                placeholder="Start date"
                value={matchDate}
                onChange={setMatchDate}
                clearable
              />
              <DatePicker
                label="To"
                size="sm"
                placeholder="End date"
                value={matchDate ? new Date(matchDate.getTime() + 7 * 86400000) : null}
                onChange={() => {}}
                minDate={matchDate ?? undefined}
              />
              <div className="flex gap-2">
                <Button size="sm" intent="secondary" leftIcon={<Calendar size={13} />}>
                  This week
                </Button>
                <Button size="sm" intent="primary">
                  Apply filter
                </Button>
              </div>
            </div>
          </DemoBox>
        </div>
      </div>

      <Divider />

      {/* ── RangePicker ────────────────────────────────────────────────────── */}
      <div>
        <SubTitle>RangePicker — Date Range Selection</SubTitle>
        <p className="text-xs text-[#55556A] mb-4">
          Dual-month calendar with quick-select presets, hover range preview, and Apply/Cancel footer.
          Core component for analytics dashboards and campaign scheduling.
        </p>

        <DemoBox>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Analytics range */}
            <RangePicker
              label="Analytics window"
              placeholder="Select period…"
              value={analyticsRange}
              onChange={setAnalyticsRange}
              clearable
              helperText="Choose your analysis period"
            />

            {/* Campaign range */}
            <RangePicker
              label="Campaign duration"
              placeholder="Campaign dates…"
              value={campaignRange}
              onChange={setCampaignRange}
              clearable
              helperText="Fan engagement campaign window"
            />
          </div>
        </DemoBox>

        {/* Context: Analytics dashboard filter */}
        <div className="mt-4">
          <SubTitle>Context — Dashboard Analytics Header</SubTitle>
          <DemoBox>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#F0F0F8]">Fan Engagement Analytics</p>
                <p className="text-xs text-[#55556A] mt-0.5">
                  {analyticsRange?.from
                    ? `Showing data for selected period`
                    : "Select a date range to filter data"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RangePicker
                  size="sm"
                  placeholder="Date range…"
                  value={analyticsRange}
                  onChange={setAnalyticsRange}
                  clearable
                  dualMonth={false}
                  withFooter={false}
                />
                <Button size="sm" intent="primary" leftIcon={<TrendingUp size={13} />}>
                  Export report
                </Button>
              </div>
            </div>
          </DemoBox>
        </div>

        {/* Context: Campaign builder */}
        <div className="mt-4">
          <SubTitle>Context — Campaign Builder</SubTitle>
          <DemoBox>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-4">
                <Input
                  label="Campaign name"
                  placeholder="e.g. Season Opener Fan Drive"
                  leftIcon={<Tag size={14} />}
                />
                <RangePicker
                  label="Campaign window"
                  value={campaignRange}
                  onChange={setCampaignRange}
                  clearable
                  minDate={new Date()}
                  helperText="Campaign will run during this period"
                />
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02] space-y-3">
                  <p className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider">Campaign summary</p>
                  {campaignRange?.from ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#55556A]">Start</span>
                        <span className="text-[#F0F0F8] font-medium">{campaignRange.from.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      {campaignRange.to && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#55556A]">End</span>
                          <span className="text-[#F0F0F8] font-medium">{campaignRange.to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      )}
                      {campaignRange.to && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[#55556A]">Duration</span>
                          <span className="text-[#FF2D55] font-semibold">
                            {Math.round((campaignRange.to.getTime() - campaignRange.from.getTime()) / 86400000) + 1} days
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-[#55556A]">No window selected</p>
                  )}
                </div>
              </div>
            </div>
          </DemoBox>
        </div>
      </div>

      <Divider />

      {/* ── TimePicker ─────────────────────────────────────────────────────── */}
      <div>
        <SubTitle>TimePicker — Scroll Wheel Time Selection</SubTitle>
        <p className="text-xs text-[#55556A] mb-4">
          Drum-roll time picker with scroll wheel, keyboard arrows, 12h/24h modes, optional seconds.
          Used for event scheduling, broadcast times, notification timing.
        </p>

        <DemoBox>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Kickoff time — 12h */}
            <TimePicker
              label="Match kickoff (12h)"
              placeholder="Select kickoff time…"
              value={kickoffTime}
              onChange={setKickoffTime}
              is24={false}
              clearable
              helperText={kickoffTime ? `Kickoff at ${kickoffTime.hours}:${String(kickoffTime.minutes).padStart(2,"0")}` : "Pick kickoff time"}
            />

            {/* Broadcast time — 24h */}
            <TimePicker
              label="Broadcast window (24h)"
              placeholder="Broadcast time…"
              value={broadcastTime}
              onChange={setBroadcastTime}
              is24={true}
              clearable
              helperText="UTC broadcast start time"
            />

            {/* Schedule with seconds */}
            <TimePicker
              label="Campaign trigger (with seconds)"
              placeholder="Precise trigger time…"
              value={scheduleTime}
              onChange={setScheduleTime}
              is24={true}
              withSeconds
              clearable
            />
          </div>
        </DemoBox>

        {/* Context: Event Scheduler */}
        <div className="mt-4">
          <SubTitle>Context — Event Scheduler</SubTitle>
          <DemoBox>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-4">
                <DatePicker
                  label="Event date"
                  placeholder="Choose event date…"
                  value={matchDate}
                  onChange={setMatchDate}
                  clearable
                  minDate={new Date()}
                />
                <TimePicker
                  label="Event time"
                  placeholder="Choose event time…"
                  value={kickoffTime}
                  onChange={setKickoffTime}
                  is24={false}
                  clearable
                />
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.05]">
                  <Calendar size={14} className="text-[#FF2D55]" />
                  <p className="text-xs font-semibold text-[#F0F0F8]">Event preview</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#55556A]">Date</span>
                    <span className="text-[#F0F0F8]">
                      {matchDate
                        ? matchDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#55556A]">Kickoff</span>
                    <span className="text-[#F0F0F8] font-mono">
                      {kickoffTime
                        ? `${kickoffTime.hours % 12 === 0 ? 12 : kickoffTime.hours % 12}:${String(kickoffTime.minutes).padStart(2,"0")} ${kickoffTime.hours < 12 ? "AM" : "PM"}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#55556A]">Timezone</span>
                    <span className="text-[#8888AA]">UTC-3 (BRT)</span>
                  </div>
                </div>
                {matchDate && kickoffTime && (
                  <Button size="sm" intent="primary" className="w-full mt-2">
                    Schedule event
                  </Button>
                )}
              </div>
            </div>
          </DemoBox>
        </div>

        {/* Sizes */}
        <div className="mt-4">
          <SubTitle>Sizes</SubTitle>
          <DemoBox>
            <div className="flex flex-col gap-3 max-w-sm">
              <TimePicker size="sm" is24={false} placeholder="Small — sm" value={null} onChange={() => {}} />
              <TimePicker size="md" is24={false} placeholder="Medium — md (default)" value={null} onChange={() => {}} />
              <TimePicker size="lg" is24={false} placeholder="Large — lg" value={null} onChange={() => {}} />
            </div>
          </DemoBox>
        </div>
      </div>

      <Divider />

      {/* ── Architecture notes ──────────────────────────────────────────────── */}
      <div>
        <SubTitle>Architecture Notes</SubTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              title: "react-day-picker v10",
              body: "Calendar grid rendering, keyboard navigation, range selection logic. Styled via classNames prop — zero default CSS imported.",
            },
            {
              title: "Locale-ready",
              body: "Pass the locale prop to DayPicker. All date formatting is centralized in date-utils.ts wrapping date-fns.",
            },
            {
              title: "Timezone architecture",
              body: "TimeValue stores raw h/m/s integers. Consumers apply timezone offset. DatePicker works with JS Date; convert to UTC at API boundary.",
            },
          ].map((note) => (
            <div key={note.title} className="rounded-xl border border-white/[0.06] p-4 bg-[#0D0D14]">
              <p className="text-xs font-semibold text-[#FF2D55] mb-1.5">{note.title}</p>
              <p className="text-xs text-[#55556A] leading-relaxed">{note.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── DataTable Section ────────────────────────────────────────────────────────

// ── Mock data ─────────────────────────────────────────────────────────────────

type FanRow = {
  id: string; name: string; email: string; initials: string;
  level: string; segment: string; spend: number;
  engagement: number; matches: number; lastActive: string;
};

const FANS_DATA: FanRow[] = [
  { id: "1",  name: "Alex Johnson",   email: "alex@example.com",    initials: "AJ", level: "Ultra VIP", segment: "Founding Member",  spend: 2840, engagement: 94, matches: 28, lastActive: "2h ago"  },
  { id: "2",  name: "Maria Santos",   email: "maria@example.com",   initials: "MS", level: "Premium",   segment: "Season Pass",      spend: 1240, engagement: 78, matches: 21, lastActive: "1d ago"  },
  { id: "3",  name: "James Liu",      email: "james@example.com",   initials: "JL", level: "Ultra VIP", segment: "Founding Member",  spend: 3120, engagement: 97, matches: 31, lastActive: "4h ago"  },
  { id: "4",  name: "Sophie Müller",  email: "sophie@example.com",  initials: "SM", level: "Core",      segment: "Match Day Fan",    spend:  480, engagement: 55, matches: 12, lastActive: "3d ago"  },
  { id: "5",  name: "Ravi Patel",     email: "ravi@example.com",    initials: "RP", level: "Premium",   segment: "Season Pass",      spend:  960, engagement: 71, matches: 19, lastActive: "6h ago"  },
  { id: "6",  name: "Lena Fischer",   email: "lena@example.com",    initials: "LF", level: "Ultra VIP", segment: "VIP Club",         spend: 4500, engagement: 99, matches: 35, lastActive: "1h ago"  },
  { id: "7",  name: "Tom Wilson",     email: "tom@example.com",     initials: "TW", level: "Casual",    segment: "Digital Only",     spend:   80, engagement: 32, matches:  5, lastActive: "2w ago"  },
  { id: "8",  name: "Ana Costa",      email: "ana@example.com",     initials: "AC", level: "Core",      segment: "Match Day Fan",    spend:  640, engagement: 61, matches: 14, lastActive: "5d ago"  },
  { id: "9",  name: "Max Bauer",      email: "max@example.com",     initials: "MB", level: "Premium",   segment: "Season Pass",      spend: 1080, engagement: 74, matches: 22, lastActive: "2d ago"  },
  { id: "10", name: "Yuki Tanaka",    email: "yuki@example.com",    initials: "YT", level: "Ultra VIP", segment: "Founding Member",  spend: 2260, engagement: 88, matches: 26, lastActive: "3h ago"  },
  { id: "11", name: "Carlos Rojas",   email: "carlos@example.com",  initials: "CR", level: "Core",      segment: "Match Day Fan",    spend:  320, engagement: 48, matches:  9, lastActive: "1w ago"  },
  { id: "12", name: "Emma Laurent",   email: "emma@example.com",    initials: "EL", level: "Premium",   segment: "VIP Club",         spend: 1560, engagement: 82, matches: 24, lastActive: "8h ago"  },
  { id: "13", name: "Noah Eriksson",  email: "noah@example.com",    initials: "NE", level: "Casual",    segment: "Digital Only",     spend:  140, engagement: 41, matches:  7, lastActive: "3w ago"  },
  { id: "14", name: "Fatima Al-Sayed",email: "fatima@example.com",  initials: "FA", level: "Ultra VIP", segment: "VIP Club",         spend: 3880, engagement: 96, matches: 33, lastActive: "30m ago" },
  { id: "15", name: "Lucas Martin",   email: "lucas@example.com",   initials: "LM", level: "Core",      segment: "Season Pass",      spend:  560, engagement: 59, matches: 13, lastActive: "4d ago"  },
];

type SponsorRow = {
  id: string; company: string; initials: string; tier: string;
  roi: number; reach: string; spend: number; campaigns: number;
  status: "active" | "negotiating" | "renewing"; since: string;
};

const SPONSORS_DATA: SponsorRow[] = [
  { id: "1",  company: "Nike Sport",       initials: "NS", tier: "Platinum", roi: 340, reach: "12.4M", spend: 180000, campaigns: 8,  status: "active",      since: "Jan 2024" },
  { id: "2",  company: "Adidas Global",    initials: "AG", tier: "Gold",     roi: 220, reach: "8.2M",  spend:  95000, campaigns: 5,  status: "active",      since: "Mar 2024" },
  { id: "3",  company: "Red Bull Energy",  initials: "RB", tier: "Platinum", roi: 480, reach: "18.7M", spend: 240000, campaigns: 12, status: "active",      since: "Feb 2023" },
  { id: "4",  company: "Samsung Tech",     initials: "ST", tier: "Silver",   roi: 155, reach: "4.1M",  spend:  42000, campaigns: 3,  status: "negotiating", since: "Jun 2024" },
  { id: "5",  company: "Heineken Beer",    initials: "HB", tier: "Gold",     roi: 195, reach: "6.8M",  spend:  78000, campaigns: 4,  status: "renewing",    since: "Jan 2023" },
  { id: "6",  company: "Emirates Air",     initials: "EA", tier: "Platinum", roi: 520, reach: "22.3M", spend: 310000, campaigns: 15, status: "active",      since: "Aug 2022" },
  { id: "7",  company: "Mastercard",       initials: "MC", tier: "Gold",     roi: 268, reach: "9.5M",  spend: 112000, campaigns: 6,  status: "active",      since: "Apr 2024" },
  { id: "8",  company: "Puma Athletics",   initials: "PA", tier: "Silver",   roi: 130, reach: "3.2M",  spend:  28000, campaigns: 2,  status: "negotiating", since: "Sep 2024" },
  { id: "9",  company: "Gatorade Sports",  initials: "GS", tier: "Gold",     roi: 210, reach: "7.6M",  spend:  88000, campaigns: 5,  status: "active",      since: "Nov 2023" },
  { id: "10", company: "Intel Gaming",     initials: "IG", tier: "Silver",   roi: 175, reach: "5.0M",  spend:  55000, campaigns: 4,  status: "renewing",    since: "Mar 2023" },
];

type CampaignRow = {
  id: string; name: string; type: string; status: string;
  reach: number; opens: number; clicks: number; budget: number; date: string;
};

const CAMPAIGNS_DATA: CampaignRow[] = [
  { id: "1",  name: "Season Opener 2024",   type: "Email",   status: "active",    reach: 45200, opens: 67, clicks: 23, budget:  5000, date: "Mar 1, 2024"  },
  { id: "2",  name: "Champions League Live", type: "Push",    status: "active",    reach: 82400, opens: 0,  clicks: 41, budget:  3200, date: "Mar 5, 2024"  },
  { id: "3",  name: "Fan Loyalty Rewards",   type: "SMS",     status: "completed", reach: 12800, opens: 0,  clicks: 88, budget:  1800, date: "Feb 28, 2024" },
  { id: "4",  name: "Sponsor Spotlight",     type: "Social",  status: "active",    reach: 31600, opens: 0,  clicks: 15, budget:  4500, date: "Mar 3, 2024"  },
  { id: "5",  name: "VIP Match Preview",     type: "Email",   status: "draft",     reach:  8200, opens: 0,  clicks: 0,  budget:  2200, date: "Mar 8, 2024"  },
  { id: "6",  name: "Gamification Push",     type: "Push",    status: "active",    reach: 58900, opens: 0,  clicks: 36, budget:  2800, date: "Mar 6, 2024"  },
  { id: "7",  name: "Away Game Alert",       type: "SMS",     status: "completed", reach:  9400, opens: 0,  clicks: 72, budget:   900, date: "Feb 25, 2024" },
  { id: "8",  name: "Merchandise Drop",      type: "Email",   status: "paused",    reach: 22100, opens: 44, clicks: 12, budget:  3600, date: "Mar 2, 2024"  },
  { id: "9",  name: "Club Birthday Promo",   type: "Social",  status: "active",    reach: 44800, opens: 0,  clicks: 28, budget:  5800, date: "Mar 7, 2024"  },
  { id: "10", name: "Halftime Survey",       type: "Push",    status: "completed", reach: 19200, opens: 0,  clicks: 54, budget:  1100, date: "Feb 20, 2024" },
  { id: "11", name: "Pre-Season Teaser",     type: "Email",   status: "draft",     reach: 35000, opens: 0,  clicks: 0,  budget:  4200, date: "Mar 10, 2024" },
  { id: "12", name: "Stadium Experience",    type: "Social",  status: "active",    reach: 67300, opens: 0,  clicks: 19, budget:  6100, date: "Mar 4, 2024"  },
];

type EventRow = {
  id: string; event: string; user: string; page: string;
  country: string; device: string; timestamp: string;
};

const EVENTS_DATA: EventRow[] = [
  { id: "1",  event: "page_view",      user: "usr_4A2x",  page: "/tickets",       country: "US", device: "mobile",  timestamp: "2024-03-15 14:23:01" },
  { id: "2",  event: "ticket_purchase", user: "usr_8Kqz",  page: "/checkout",      country: "BR", device: "desktop", timestamp: "2024-03-15 14:22:47" },
  { id: "3",  event: "badge_earned",   user: "usr_2Lmn",  page: "/gamification",  country: "DE", device: "mobile",  timestamp: "2024-03-15 14:22:30" },
  { id: "4",  event: "page_view",      user: "usr_9Pqr",  page: "/dashboard",     country: "ES", device: "tablet",  timestamp: "2024-03-15 14:22:15" },
  { id: "5",  event: "login",          user: "usr_7Jkl",  page: "/auth",          country: "FR", device: "desktop", timestamp: "2024-03-15 14:21:58" },
  { id: "6",  event: "fan_reaction",   user: "usr_3Abc",  page: "/match-live",    country: "IT", device: "mobile",  timestamp: "2024-03-15 14:21:44" },
  { id: "7",  event: "sponsor_click",  user: "usr_5Def",  page: "/home",          country: "UK", device: "mobile",  timestamp: "2024-03-15 14:21:31" },
  { id: "8",  event: "page_view",      user: "usr_6Ghi",  page: "/segments",      country: "MX", device: "desktop", timestamp: "2024-03-15 14:21:18" },
];

// ── Campaign status badge ──────────────────────────────────────────────────────

function CampaignStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "info" | "ghost" | "brand"; label: string }> = {
    active:    { variant: "success", label: "Active" },
    completed: { variant: "ghost",   label: "Completed" },
    paused:    { variant: "warning", label: "Paused" },
    draft:     { variant: "info",    label: "Draft" },
  };
  const cfg = map[status] ?? { variant: "ghost", label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function CampaignTypeBadge({ type }: { type: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    Email:  <Send size={10} />,
    Push:   <Bell size={10} />,
    SMS:    <Tag size={10} />,
    Social: <Globe size={10} />,
  };
  return (
    <Badge variant="ghost" className="gap-1">
      {iconMap[type]}
      {type}
    </Badge>
  );
}

function EventTypeBadge({ event }: { event: string }) {
  const map: Record<string, "brand" | "success" | "info" | "warning" | "ghost"> = {
    page_view:       "ghost",
    ticket_purchase: "success",
    badge_earned:    "brand",
    login:           "info",
    fan_reaction:    "warning",
    sponsor_click:   "info",
  };
  return <Badge variant={map[event] ?? "ghost"}>{event}</Badge>;
}

// ── Demo: Fans table ──────────────────────────────────────────────────────────

function FansTableDemo() {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FanRow[]>([]);

  const columns = useMemo<ColumnDef<FanRow, unknown>[]>(() => [
    {
      accessorKey: "name",
      header: "Fan",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 min-w-[180px]">
          <Avatar initials={row.original.initials} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#F0F0F8] truncate">{row.original.name}</p>
            <p className="text-[11px] text-[#55556A] truncate">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => <LevelBadge level={row.original.level} />,
    },
    {
      accessorKey: "segment",
      header: "Segment",
      cell: ({ getValue }) => <Badge variant="ghost">{getValue() as string}</Badge>,
    },
    {
      accessorKey: "spend",
      header: "Spend",
      cell: ({ getValue }) => (
        <span className="font-semibold text-[#F0F0F8] tabular-nums">
          ${(getValue() as number).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "engagement",
      header: "Engagement",
      cell: ({ getValue }) => (
        <EngagementBar value={getValue() as number} className="min-w-[120px]" />
      ),
    },
    {
      accessorKey: "matches",
      header: "Matches",
      cell: ({ getValue }) => (
        <span className="text-[#8888AA] tabular-nums">{getValue() as number}</span>
      ),
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="text-[#55556A]">{getValue() as string}</span>
      ),
    },
  ], []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#55556A]">
          Search · pagination · selection · column visibility · row actions · export
          {selected.length > 0 && (
            <span className="text-[#FF2D55] ml-1">· {selected.length} selected</span>
          )}
        </p>
        <Button intent="ghost" size="xs" onClick={() => setLoading((l) => !l)}>
          {loading ? "Show data" : "Simulate loading"}
        </Button>
      </div>
      <DataTable
        data={FANS_DATA}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        skeletonRows={8}
        emptyMessage="No fans found"
        emptyDescription="Try adjusting your search query."
        searchable
        searchPlaceholder="Search fans…"
        paginated
        defaultPageSize={8}
        selectable
        onSelectionChange={setSelected}
        onExport={() => window.alert("CSV export triggered")}
        bulkActions={(rows) => (
          <Button intent="danger" size="xs" leftIcon={<Trash2 size={11} />}>
            Delete {rows.length} fans
          </Button>
        )}
        rowActions={(row) => (
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button intent="ghost" size="icon-sm">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Label>{row.name}</DropdownMenu.Label>
              <DropdownMenu.Item icon={<Eye size={13} />}>View profile</DropdownMenu.Item>
              <DropdownMenu.Item icon={<Pencil size={13} />}>Edit</DropdownMenu.Item>
              <DropdownMenu.Item icon={<Copy size={13} />}>Duplicate</DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item icon={<Trash2 size={13} />} variant="destructive">Delete</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      />
    </div>
  );
}

// ── Demo: Sponsors table ──────────────────────────────────────────────────────

function SponsorsTableDemo() {
  const [selected, setSelected] = useState<SponsorRow[]>([]);

  const columns = useMemo<ColumnDef<SponsorRow, unknown>[]>(() => [
    {
      accessorKey: "company",
      header: "Sponsor",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5 min-w-[160px]">
          <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
            <span className="text-[9px] font-bold text-[#8888AA]">{row.original.initials}</span>
          </div>
          <span className="text-xs font-semibold text-[#F0F0F8]">{row.original.company}</span>
        </div>
      ),
    },
    {
      accessorKey: "tier",
      header: "Tier",
      cell: ({ getValue }) => {
        const t = getValue() as string;
        const variantMap: Record<string, "vip" | "premium" | "ghost"> = {
          Platinum: "vip", Gold: "premium", Silver: "ghost",
        };
        return <Badge variant={variantMap[t] ?? "ghost"}>{t}</Badge>;
      },
    },
    {
      accessorKey: "roi",
      header: "ROI",
      cell: ({ getValue }) => {
        const roi = getValue() as number;
        return (
          <span className={cn("font-semibold tabular-nums", roi >= 300 ? "text-[#00D4A8]" : roi >= 200 ? "text-blue-400" : "text-[#8888AA]")}>
            {roi}%
          </span>
        );
      },
    },
    {
      accessorKey: "reach",
      header: "Reach",
      cell: ({ getValue }) => <span className="text-[#8888AA] tabular-nums">{getValue() as string}</span>,
    },
    {
      accessorKey: "spend",
      header: "Investment",
      cell: ({ getValue }) => (
        <span className="font-semibold text-[#F0F0F8] tabular-nums">
          ${((getValue() as number) / 1000).toFixed(0)}K
        </span>
      ),
    },
    {
      accessorKey: "campaigns",
      header: "Campaigns",
      cell: ({ getValue }) => (
        <span className="text-[#8888AA] tabular-nums">{getValue() as number}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <StatusBadge status={getValue() as "active" | "negotiating" | "renewing"} />,
    },
    {
      accessorKey: "since",
      header: "Since",
      enableSorting: false,
      cell: ({ getValue }) => <span className="text-[#55556A]">{getValue() as string}</span>,
    },
  ], []);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#55556A]">
        Sortable · searchable · selection · ROI coloring · status badges
        {selected.length > 0 && (
          <span className="text-[#FF2D55] ml-1">· {selected.length} selected</span>
        )}
      </p>
      <DataTable
        data={SPONSORS_DATA}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Search sponsors…"
        paginated
        defaultPageSize={8}
        selectable
        onSelectionChange={setSelected}
        onExport={() => window.alert("Export sponsors")}
        bulkActions={(rows) => (
          <Button intent="secondary" size="xs" leftIcon={<Send size={11} />}>
            Email {rows.length} sponsors
          </Button>
        )}
        rowActions={(row) => (
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button intent="ghost" size="icon-sm">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Label>{row.company}</DropdownMenu.Label>
              <DropdownMenu.Item icon={<Eye size={13} />}>View deal</DropdownMenu.Item>
              <DropdownMenu.Item icon={<BarChart2 size={13} />}>ROI report</DropdownMenu.Item>
              <DropdownMenu.Item icon={<Pencil size={13} />}>Edit contract</DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item icon={<Trash2 size={13} />} variant="destructive">Remove</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      />
    </div>
  );
}

// ── Demo: Campaigns table ─────────────────────────────────────────────────────

function CampaignsTableDemo() {
  const [dateRange, setDateRange] = useState<import("@/lib/date-utils").DateRange | null>(null);

  const columns = useMemo<ColumnDef<CampaignRow, unknown>[]>(() => [
    {
      accessorKey: "name",
      header: "Campaign",
      cell: ({ getValue }) => (
        <span className="text-xs font-semibold text-[#F0F0F8] min-w-[160px] block">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      enableSorting: false,
      cell: ({ getValue }) => <CampaignTypeBadge type={getValue() as string} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <CampaignStatusBadge status={getValue() as string} />,
    },
    {
      accessorKey: "reach",
      header: "Reach",
      cell: ({ getValue }) => (
        <span className="text-[#8888AA] tabular-nums">{((getValue() as number) / 1000).toFixed(1)}K</span>
      ),
    },
    {
      accessorKey: "opens",
      header: "Open %",
      cell: ({ row }) => (
        row.original.type === "Email"
          ? <span className="text-[#F0F0F8] tabular-nums">{row.original.opens}%</span>
          : <span className="text-[#55556A]">—</span>
      ),
    },
    {
      accessorKey: "clicks",
      header: "CTR %",
      cell: ({ getValue }) => {
        const v = getValue() as number;
        return v > 0
          ? <span className="font-semibold tabular-nums text-[#00D4A8]">{v}%</span>
          : <span className="text-[#55556A]">—</span>;
      },
    },
    {
      accessorKey: "budget",
      header: "Budget",
      cell: ({ getValue }) => (
        <span className="font-semibold text-[#F0F0F8] tabular-nums">
          ${(getValue() as number).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      enableSorting: false,
      cell: ({ getValue }) => <span className="text-[#55556A]">{getValue() as string}</span>,
    },
  ], []);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#55556A]">
        Date range filter in toolbar · campaign type & status badges · CTR coloring
      </p>
      <DataTable
        data={CAMPAIGNS_DATA}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Search campaigns…"
        paginated
        defaultPageSize={8}
        onExport={() => window.alert("Export campaigns")}
        toolbarLeft={
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Filter by date"
            size="sm"
          />
        }
        rowActions={(row) => (
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button intent="ghost" size="icon-sm">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Label>{row.name}</DropdownMenu.Label>
              <DropdownMenu.Item icon={<Eye size={13} />}>View analytics</DropdownMenu.Item>
              <DropdownMenu.Item icon={<MousePointerClick size={13} />}>Duplicate</DropdownMenu.Item>
              <DropdownMenu.Item icon={<Pencil size={13} />}>Edit</DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item icon={<Trash2 size={13} />} variant="destructive">Archive</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      />
    </div>
  );
}

// ── Demo: Analytics events table (loading + empty) ────────────────────────────

function EventsTableDemo() {
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);

  const columns = useMemo<ColumnDef<EventRow, unknown>[]>(() => [
    {
      accessorKey: "event",
      header: "Event",
      cell: ({ getValue }) => <EventTypeBadge event={getValue() as string} />,
    },
    {
      accessorKey: "user",
      header: "User ID",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-[#8888AA]">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "page",
      header: "Page",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-[#8888AA]">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "country",
      header: "Country",
      cell: ({ getValue }) => <Badge variant="ghost">{getValue() as string}</Badge>,
    },
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ getValue }) => (
        <span className="text-[#55556A] capitalize">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="font-mono text-[11px] text-[#55556A]">{getValue() as string}</span>
      ),
    },
  ], []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#55556A]">
          Loading state · empty state · event type badges · monospace values
        </p>
        <div className="flex items-center gap-2">
          <Button
            intent="ghost"
            size="xs"
            onClick={() => { setLoading((l) => !l); setEmpty(false); }}
          >
            {loading ? "Hide skeleton" : "Show skeleton"}
          </Button>
          <Button
            intent="ghost"
            size="xs"
            onClick={() => { setEmpty((e) => !e); setLoading(false); }}
          >
            {empty ? "Show data" : "Show empty"}
          </Button>
        </div>
      </div>
      <DataTable
        data={empty ? [] : EVENTS_DATA}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        skeletonRows={6}
        searchable
        searchPlaceholder="Filter events…"
        emptyMessage="No events recorded"
        emptyDescription="Events will appear here as fans interact with the platform."
        paginated
        defaultPageSize={6}
      />
    </div>
  );
}

// ── DataTable section ─────────────────────────────────────────────────────────

function DataTableSection() {
  const [activeTab, setActiveTab] = useState("fans");

  const tabs = [
    { id: "fans",      label: "Fans",      icon: <Users size={13} /> },
    { id: "sponsors",  label: "Sponsors",  icon: <DollarSign size={13} /> },
    { id: "campaigns", label: "Campaigns", icon: <BarChart2 size={13} /> },
    { id: "events",    label: "Events",    icon: <Activity size={13} /> },
  ];

  return (
    <div className="space-y-8">
      <SectionTitle
        title="DataTable"
        description="Enterprise data table built on TanStack Table v8. Sorting, pagination, search, row selection, column visibility, row actions, loading & empty states."
      />

      {/* Feature badges */}
      <div className="flex flex-wrap gap-2">
        {[
          "TanStack Table v8", "Sorting", "Global Search", "Pagination",
          "Row Selection", "Column Visibility", "Row Actions", "Loading State",
          "Empty State", "Bulk Actions", "Export", "Responsive",
        ].map((f) => (
          <Badge key={f} variant="ghost">{f}</Badge>
        ))}
      </div>

      {/* Quick usage */}
      <div>
        <SubTitle>Usage</SubTitle>
        <DemoBox className="bg-[#06060A] font-mono text-xs text-[#8888AA] leading-relaxed space-y-1">
          <p><span className="text-[#FF2D55]">{"import"}</span>{" { DataTable } from "}<span className="text-[#00D4A8]">&quot;@/components/ui&quot;</span>;</p>
          <p><span className="text-[#FF2D55]">{"import type"}</span>{" { ColumnDef } from "}<span className="text-[#00D4A8]">&quot;@/components/ui&quot;</span>;</p>
          <br />
          <p className="text-[#55556A]">{"// Define columns with TanStack ColumnDef"}</p>
          <p>{"const columns: ColumnDef<MyRow>[] = ["}</p>
          <p>&nbsp;&nbsp;{"{ accessorKey: \"name\", header: \"Name\", cell: ({ row }) => row.original.name },"}</p>
          <p>&nbsp;&nbsp;{"{ accessorKey: \"status\", header: \"Status\", cell: ({ getValue }) => <Badge>{...}</Badge> },"}</p>
          <p>{"];"}</p>
          <br />
          <p>{"<DataTable"}</p>
          <p>&nbsp;&nbsp;{"data={rows}"}</p>
          <p>&nbsp;&nbsp;{"columns={columns}"}</p>
          <p>&nbsp;&nbsp;{"searchable paginated selectable"}</p>
          <p>&nbsp;&nbsp;{"rowActions={(row) => <RowMenu row={row} />}"}</p>
          <p>&nbsp;&nbsp;{"onExport={() => exportCSV()}"}</p>
          <p>{"/>"}</p>
        </DemoBox>
      </div>

      <Divider />

      {/* Demos */}
      <div>
        <SubTitle>Live Demos</SubTitle>
        <Tabs
          items={tabs}
          active={activeTab}
          onChange={setActiveTab}
          variant="pill"
          size="sm"
        />

        <div className="mt-6">
          {activeTab === "fans"      && <FansTableDemo />}
          {activeTab === "sponsors"  && <SponsorsTableDemo />}
          {activeTab === "campaigns" && <CampaignsTableDemo />}
          {activeTab === "events"    && <EventsTableDemo />}
        </div>
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: "foundation",  label: "Foundation",  icon: Palette,      Component: FoundationSection  },
  { id: "components",  label: "Components",  icon: Box,          Component: ComponentsSection  },
  { id: "forms",       label: "Forms",       icon: Layers,       Component: FormsSection       },
  { id: "datetime",    label: "Date & Time", icon: Clock,        Component: DateTimeSection    },
  { id: "feedback",    label: "Feedback",    icon: Bell,         Component: FeedbackSection    },
  { id: "layout",      label: "Layout",      icon: Layout,       Component: LayoutSection      },
  { id: "dashboard",   label: "Dashboard",   icon: Cpu,          Component: DashboardSection   },
  { id: "primitives",  label: "Primitives",  icon: Shapes,       Component: PrimitivesSection  },
  { id: "motion",      label: "Motion",      icon: Sparkles,     Component: MotionSection      },
  { id: "theme",       label: "Theme",       icon: Paintbrush,   Component: ThemeSection       },
  { id: "datatable",   label: "DataTable",   icon: Table2,       Component: DataTableSection   },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

export default function DesignSystemPage() {
  const [active, setActive] = useState<SectionId>("foundation");

  const ActiveSection = SECTIONS.find((s) => s.id === active)?.Component ?? FoundationSection;

  return (
    <div className="min-h-screen bg-[#06060A]">

      {/* TOP BAR */}
      <header className="sticky top-0 z-30 h-14 border-b border-white/[0.06] bg-[#06060A]/90 backdrop-blur-xl px-6 flex items-center gap-4">
        <a href="/dashboard" className="flex items-center gap-2 text-[#55556A] hover:text-[#F0F0F8] transition-colors">
          <ChevronRight size={14} className="rotate-180" />
          <span className="text-xs font-medium">Dashboard</span>
        </a>

        <div className="h-4 w-px bg-white/[0.08]" />

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#FF2D55] flex items-center justify-center">
            <Palette size={11} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[#F0F0F8]">Design System</span>
          <Badge variant="ghost">v1.0</Badge>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge variant="brand">
            <span className="w-1 h-1 rounded-full bg-[#FF2D55] animate-pulse" />
            BigFana UI
          </Badge>
        </div>
      </header>

      <div className="flex">

        {/* LEFT NAV */}
        <aside className="sticky top-14 h-[calc(100vh-56px)] w-56 shrink-0 border-r border-white/[0.06] bg-[#0D0D14] flex flex-col py-4 px-3 gap-1 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#55556A] px-3 mb-2">
            Sections
          </p>
          {SECTIONS.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={cn(
                  "relative flex items-center gap-3 h-9 px-3 rounded-xl text-sm font-medium text-left transition-all duration-200",
                  isActive
                    ? "text-[#FF2D55]"
                    : "text-[#8888AA] hover:text-[#F0F0F8] hover:bg-white/[0.04]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="ds-nav-active"
                    className="absolute inset-0 rounded-xl bg-[#FF2D55]/10 border border-[#FF2D55]/20"
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
                <s.icon size={15} className="relative z-10 shrink-0" />
                <span className="relative z-10">{s.label}</span>
              </button>
            );
          })}

          <div className="mt-auto pt-4 border-t border-white/[0.06]">
            <div className="px-3 space-y-1">
              <p className="text-[10px] text-[#55556A]">Built with</p>
              <p className="text-[10px] font-mono text-[#8888AA]">Next.js 16 · Tailwind v4</p>
              <p className="text-[10px] font-mono text-[#8888AA]">Framer Motion · CVA</p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 p-8 max-w-5xl">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ActiveSection />
          </motion.div>
        </main>

      </div>
    </div>
  );
}
