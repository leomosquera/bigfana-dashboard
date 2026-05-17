"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CampaignRowActions } from "@/components/campaigns/CampaignRowActions";
import { CampaignComposerModal } from "@/components/campaigns/CampaignComposerModal";
import { CampaignDetailDrawer } from "@/components/campaigns/CampaignDetailDrawer";
import type { SegmentRulePickOption } from "@/server/queries/org-segments";
import type { CampaignStatus, CampaignType } from "@/db/schema";
import type { CampaignWithResponseStats } from "@/server/queries/campaigns";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_TYPE_LABELS } from "@/lib/campaign-ui";

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

function fmtDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  }).format(new Date(date));
}

function fmtDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("es", {
    day:   "2-digit",
    month: "short",
    hour:  "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function buildColumns(): ColumnDef<CampaignWithResponseStats, unknown>[] {
  return [
    {
      accessorKey: "title",
      header:      "Título",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#F0F0F8] truncate">{row.original.title}</p>
          <p className="text-[10px] text-[#55556A] mt-0.5">
            {(row.original.metadata as { demoSeed?: boolean } | null)?.demoSeed
              ? "Demo seed"
              : "—"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ getValue }) => {
        const t = getValue() as CampaignType;
        return (
          <span className="text-xs text-[#C8C8E0]">
            {CAMPAIGN_TYPE_LABELS[t] ?? t}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ getValue }) => {
        const status = getValue() as CampaignStatus;
        return (
          <Badge variant={STATUS_BADGE[status] ?? "ghost"}>
            {CAMPAIGN_STATUS_LABELS[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "pointsReward",
      header: "Puntos",
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums font-semibold text-[#8888AA]">
          {(getValue() as number).toLocaleString("es")}
        </span>
      ),
    },
    {
      id:     "window",
      header: "Ventana",
      cell: ({ row }) => (
        <div className="text-[10px] text-[#8888AA] leading-relaxed whitespace-nowrap">
          <span className="block">{fmtDate(row.original.startsAt)}</span>
          <span className="text-[#55556A]">→ {fmtDate(row.original.endsAt)}</span>
        </div>
      ),
    },
    {
      accessorKey: "responseCount",
      header:      "Fans",
      cell: ({ row }) => (
        <span className="text-xs tabular-nums font-semibold text-[#F0F0F8]">
          {row.original.responseCount.toLocaleString("es")}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header:      "Creación",
      cell: ({ getValue }) => (
        <span className="text-[10px] text-[#55556A] whitespace-nowrap tabular-nums">
          {fmtDateTime(getValue() as string)}
        </span>
      ),
    },
  ];
}

interface CampaignsClientProps {
  campaigns: CampaignWithResponseStats[];
  segments: SegmentRulePickOption[];
}

export function CampaignsClient({ campaigns: rows, segments }: CampaignsClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const columns = useMemo(() => buildColumns(), []);

  const [drawOpen, setDrawOpen]   = useState(false);
  const [drawCampaignId,setDrawCampaignId]= useState<string | null>(null);

  const [composerOpen,setComposerOpen] = useState(false);
  const [composerMode,setComposerMode]= useState<'create'|'edit'>('create');
  const [composerCampaignId,setComposerCampaignId]= useState<string | null>(null);

  function handleMutate() {
    startTransition(() => router.refresh());
  }

  function openCreate() {
    setComposerMode('create');
    setComposerCampaignId(null);
    setComposerOpen(true);
  }

  function openEdit(row:CampaignWithResponseStats){
    setComposerMode('edit');
    setComposerCampaignId(row.id);
    setComposerOpen(true);
  }

  function openView(row:CampaignWithResponseStats){
    setDrawCampaignId(row.id);
    setDrawOpen(true);
  }

  function rowActions(row: CampaignWithResponseStats) {
    return (
      <CampaignRowActions
        row={row}
        onView={openView}
        onEdit={openEdit}
        onMutated={handleMutate}
      />
    );
  }

  return (
    <>
      <DataTable<CampaignWithResponseStats>
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Buscar campaña…"
        paginated
        defaultPageSize={25}
        stickyHeader
        emptyMessage="Sin campañas"
        emptyDescription='Creá tu primera campaña con "Nueva campaña". Si la base está migrada aparecerán los seeds demo.'
        rowActions={rowActions}
        onRowClick={openView}
        toolbarRight={
          <Button
            intent="primary"
            size="sm"
            leftIcon={<Megaphone size={13} />}
            onClick={openCreate}
          >
            Nueva campaña
          </Button>
        }
        caption={
          rows.length > 0
            ? `${rows.length.toLocaleString("es")} campaña(s) cargadas desde Neon`
            : undefined
        }
      />

      <CampaignComposerModal
        open={composerOpen}
        mode={composerMode}
        campaignId={composerCampaignId}
        segmentOptions={segments}
        onClose={() => setComposerOpen(false)}
        onSuccess={() => {
          handleMutate();
        }}
      />

      <CampaignDetailDrawer
        open={drawOpen}
        campaignId={drawCampaignId}
        onClose={() => {
          setDrawOpen(false);
          setDrawCampaignId(null);
        }}
      />
    </>
  );
}
