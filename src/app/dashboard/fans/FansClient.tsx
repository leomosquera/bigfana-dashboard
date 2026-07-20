"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FanForm } from "@/components/fans/FanForm";
import { FanRowActions } from "@/components/fans/FanRowActions";
import { FanProfileDrawer } from "@/components/fans/FanProfileDrawer";
import { FanLevelBadge } from "@/components/gamification/FanLevelBadge";
import { getCountryLabel } from "@/lib/country-codes";
import type { FanView, FanStatus, EepSyncStatus, FanLevel } from "@/db/schema";

// ─── Status badge helpers ─────────────────────────────────────────────────────

const FAN_STATUS_CONFIG: Record<
  FanStatus,
  { label: string; variant: "success" | "warning" | "ghost" | "brand" }
> = {
  active:    { label: "Activo",    variant: "success" },
  inactive:  { label: "Inactivo",  variant: "ghost"   },
  suspended: { label: "Suspendido", variant: "warning" },
  archived:  { label: "Archivado", variant: "brand"   },
};

const EEP_STATUS_CONFIG: Record<
  EepSyncStatus,
  { label: string; variant: "success" | "warning" | "ghost" | "brand" }
> = {
  pending:   { label: "Pendiente", variant: "ghost"   },
  synced:    { label: "Sincronizado", variant: "success" },
  failed:    { label: "Error",     variant: "brand"   },
  retrying:  { label: "Reintentando", variant: "warning" },
};

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(orgLevels: FanLevel[]): ColumnDef<FanView, unknown>[] {
  return [
    {
      accessorKey: "displayName",
      header:      "Fan",
      enableHiding: false,
      cell: ({ row }) => {
        const fan = row.original;
        const initials = [fan.firstName, fan.lastName]
          .filter(Boolean)
          .map((n) => n![0].toUpperCase())
          .join("") || fan.displayName?.[0]?.toUpperCase() || "?";
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#FF2D55]">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F0F0F8] truncate">{fan.displayName}</p>
              {fan.email && (
                <p className="text-[10px] text-[#55556A] truncate">{fan.email}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header:      "Teléfono",
      cell: ({ getValue }) => (
        <span className="text-xs text-[#8888AA]">
          {(getValue() as string | null) ?? "—"}
        </span>
      ),
    },
    {
      id:     "location",
      header: "Ubicación",
      cell: ({ row }) => {
        const { city, countryCode } = row.original;
        const parts = [city, getCountryLabel(countryCode)].filter(Boolean).join(", ");
        return (
          <span className="text-xs text-[#8888AA]">
            {parts || "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "engagementScore",
      header:      "Puntos",
      cell: ({ row }) => {
        const score = row.original.engagementScore ?? 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#C8C8E0] tabular-nums">
              {score.toLocaleString("es")}
            </span>
            <FanLevelBadge score={score} levels={orgLevels} size="xs" />
          </div>
        );
      },
    },
    {
      accessorKey: "eepSyncStatus",
      header:      "Sync EEP",
      cell: ({ getValue }) => {
        const status = getValue() as EepSyncStatus;
        const cfg = EEP_STATUS_CONFIG[status] ?? { label: status, variant: "ghost" as const };
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header:      "Estado",
      cell: ({ getValue }) => {
        const status = getValue() as FanStatus;
        const cfg = FAN_STATUS_CONFIG[status] ?? { label: status, variant: "ghost" as const };
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header:      "Alta",
      cell: ({ getValue }) => {
        const date = getValue() as Date;
        return (
          <span className="text-[10px] text-[#55556A] tabular-nums">
            {new Intl.DateTimeFormat("es", {
              day:   "2-digit",
              month: "short",
              year:  "numeric",
            }).format(new Date(date))}
          </span>
        );
      },
    },
  ];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FansClientProps {
  initialFans: FanView[];
  totalCount:  number;
  orgLevels:   FanLevel[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FansClient({ initialFans, totalCount, orgLevels }: FansClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [formOpen,    setFormOpen]    = useState(false);
  const [editingFan,  setEditingFan]  = useState<FanView | undefined>(undefined);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileFan,  setProfileFan]  = useState<FanView | null>(null);

  const columns = buildColumns(orgLevels);

  function handleEdit(fan: FanView) {
    setEditingFan(fan);
    setFormOpen(true);
  }

  function handleNewFan() {
    setEditingFan(undefined);
    setFormOpen(true);
  }

  function handleFormClose() {
    setFormOpen(false);
    setEditingFan(undefined);
  }

  function handleViewProfile(fan: FanView) {
    setProfileFan(fan);
    setProfileOpen(true);
  }

  function handleProfileClose() {
    setProfileOpen(false);
    // Keep profileFan alive during exit animation — cleared on next open
  }

  const handleMutated = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  function handleSuccess() {
    handleMutated();
  }

  const rowActions = useCallback(
    (fan: FanView) => (
      <FanRowActions
        fan={fan}
        onEdit={handleEdit}
        onViewProfile={handleViewProfile}
        onMutated={handleMutated}
      />
    ),
    [handleMutated],
  );

  return (
    <>
      <DataTable
        data={initialFans}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Buscar fan, email…"
        paginated
        defaultPageSize={25}
        stickyHeader
        emptyMessage="Sin fans registrados"
        emptyDescription="Crea el primer fan con el botón Nuevo fan."
        rowActions={rowActions}
        onRowClick={handleViewProfile}
        toolbarRight={
          <Button
            intent="primary"
            size="sm"
            leftIcon={<UserPlus size={13} />}
            onClick={handleNewFan}
          >
            Nuevo fan
          </Button>
        }
        caption={
          totalCount > 0
            ? `${totalCount.toLocaleString("es")} fans registrados en esta organización`
            : undefined
        }
      />

      <FanForm
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={handleSuccess}
        fan={editingFan}
      />

      <FanProfileDrawer
        open={profileOpen}
        onClose={handleProfileClose}
        fan={profileFan}
        orgLevels={orgLevels}
      />
    </>
  );
}
