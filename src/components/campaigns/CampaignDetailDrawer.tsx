"use client";

import * as React from "react";
import { useTransition, useEffect, useState } from "react";
import {
  ClipboardList,
  CalendarRange,
  Target,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Drawer } from "@/components/feedback/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from "@/lib/campaign-ui";
import { fetchCampaignDetailAction } from "@/server/actions/campaigns";
import type { CampaignStatus, CampaignType } from "@/db/schema";
import type { CampaignDetail } from "@/server/queries/campaigns";

interface CampaignDetailDrawerProps {
  open:       boolean;
  onClose:    () => void;
  campaignId: string | null;
}

const STATUS_BADGE: Record<
  CampaignStatus,
  "success" | "warning" | "ghost" | "brand"
> = {
  active:    "success",
  scheduled: "brand",
  draft:     "ghost",
  paused:    "warning",
  finished:  "ghost",
};

export function CampaignDetailDrawer({
  open,
  onClose,
  campaignId,
}: CampaignDetailDrawerProps) {
  const [pending, transition] = useTransition();
  const [detail, setDetail] = useState<CampaignDetail | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- drawer snapshot hydrate from Neon */
    if (!open || !campaignId) {
      setDetail(null);
      return;
    }

    transition(async () => {
      const r = await fetchCampaignDetailAction(campaignId);
      if (r.success) setDetail(r.detail);
      else setDetail(null);
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, campaignId, transition]);

  let content: React.ReactNode;

  if (!campaignId) {
    content = (
      <p className="px-6 py-12 text-xs text-[#55556A] text-center">Sin selección.</p>
    );
  } else if (!detail || pending) {
    content = (
      <div className="space-y-3 px-6 py-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  } else {
    const c = detail;
    const typeLabel = CAMPAIGN_TYPE_LABELS[c.type as CampaignType] ?? c.type;
    const statusLabel =
      CAMPAIGN_STATUS_LABELS[c.status as CampaignStatus] ?? c.status;

    const audience =
      c.segmentRules && c.segmentRules.mode === "segments"
        ? "Segmentos dirigidos"
        : "Todos los fans";

    content = (
      <div className="flex flex-col gap-6 px-6 py-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE[c.status as CampaignStatus] ?? "ghost"}>
              {statusLabel}
            </Badge>
            <Badge variant="ghost">{typeLabel}</Badge>
          </div>
          <h3 className="text-lg font-bold text-[#F0F0F8] leading-snug">{c.title}</h3>
          <p className="text-xs text-[#8888AA] leading-relaxed">
            {c.description ?? "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide flex items-center gap-1">
              <Target size={12} /> Audiencia
            </p>
            <p className="text-xs font-semibold text-[#F0F0F8] mt-1">{audience}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide flex items-center gap-1">
              <Layers size={12} /> Puntos
            </p>
            <p className="text-xs font-semibold text-[#F0F0F8] mt-1 tabular-nums">
              {c.pointsReward.toLocaleString("es")}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 col-span-2">
            <p className="text-[10px] font-semibold text-[#55556A] uppercase tracking-wide flex items-center gap-1">
              <CalendarRange size={12} /> Ventana
            </p>
            <p className="text-xs font-semibold text-[#F0F0F8] mt-1">
              {new Intl.DateTimeFormat("es", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(c.startsAt))}
              {" → "}
              {new Intl.DateTimeFormat("es", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(c.endsAt))}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#55556A] mb-3 flex items-center gap-1.5">
            <ClipboardList size={13} /> Preguntas
          </p>
          <div className="space-y-3">
            {c.questions.map((q, qi) => (
              <div
                key={q.id}
                className="rounded-xl border border-white/[0.05] bg-[#0F0F16] px-4 py-3 space-y-2"
              >
                <div className="flex gap-2">
                  <HelpCircle size={14} className="text-[#FF2D55] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-[#55556A] font-semibold">
                      Pregunta {qi + 1}
                    </p>
                    <p className="text-sm text-[#F0F0F8]">{q.question}</p>
                    <Badge variant="ghost" className="mt-2 text-[10px]">
                      {q.type === "multiple_choice" ? "Opción múltiple" : "Texto abierto"}
                    </Badge>
                  </div>
                </div>

                {q.options.length > 0 && (
                  <ul className="mt-2 space-y-1.5 border-t border-white/[0.05] pt-2">
                    {q.options.map((o) => (
                      <li
                        key={o.id}
                        className="text-xs flex items-center gap-2 text-[#8888AA]"
                      >
                        <span className="w-1 h-1 rounded-full bg-[#55556A] shrink-0" />
                        <span>{o.label}</span>
                        {o.isCorrect === true && (
                          <Badge variant="success" className="text-[9px] ml-auto">
                            Correcta
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const title =
    detail && campaignId ? detail.title.slice(0, 80) + (detail.title.length > 80 ? "…" : "") : "Visualizar campaña";

  return (
    <Drawer
      open={open && !!campaignId}
      onClose={onClose}
      title={title}
      subtitle="Resumen ejecutivo demo"
      side="right"
      width="min(560px, 100vw - 48px)"
    >
      {content}
    </Drawer>
  );
}
