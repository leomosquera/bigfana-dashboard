"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, RotateCcw } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/forms/Combobox";
import { FanForm } from "@/components/fans/FanForm";
import { FanRowActions } from "@/components/fans/FanRowActions";
import { FanProfileDrawer } from "@/components/fans/FanProfileDrawer";
import { FanLevelBadge } from "@/components/gamification/FanLevelBadge";
import { formatRelativeTimeEs } from "@/lib/dashboard-home-format";
import {
  collectCountryFilterOptions,
  collectSegmentFilterOptions,
  FAN_STATUS_LABELS,
  filterFanIntelligenceRows,
  getEepSyncStatusLabel,
  getEepSyncStatusVariant,
  getLocalSegmentLabel,
  resolveFanCountryLabel,
  type FanIntelligenceListFilters,
} from "@/lib/fan-intelligence";
import type { FanIntelligenceListRow } from "@/server/queries/fan-intelligence";
import type {
  FanView,
  FanStatus,
  EepSyncStatus,
  FanLevel,
} from "@/db/schema";

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  orgLevels: FanLevel[],
): ColumnDef<FanIntelligenceListRow, unknown>[] {
  return [
    {
      accessorKey: "displayName",
      header: "Fan",
      enableHiding: false,
      cell: ({ row }) => {
        const fan = row.original;
        const initials =
          [fan.firstName, fan.lastName]
            .filter(Boolean)
            .map((n) => n![0].toUpperCase())
            .join("") ||
          fan.displayName?.[0]?.toUpperCase() ||
          "?";
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#FF2D55]">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#F0F0F8] truncate">
                {fan.displayName}
              </p>
              {fan.email && (
                <p className="text-[10px] text-[#55556A] truncate">{fan.email}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "segment",
      header: "Segmento",
      cell: ({ row }) => {
        const segment = row.original.segment?.trim();
        return (
          <span
            className={
              segment
                ? "text-xs font-medium text-[#C8C8E0]"
                : "text-xs text-[#55556A]"
            }
          >
            {getLocalSegmentLabel(segment)}
          </span>
        );
      },
    },
    {
      id: "nivelPuntos",
      accessorKey: "engagementScore",
      header: "Nivel / Puntos",
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
      id: "pais",
      accessorKey: "countryCode",
      header: "País",
      cell: ({ row }) => {
        const label = resolveFanCountryLabel(row.original.countryCode);
        return (
          <span className="text-xs text-[#8888AA]">{label ?? "—"}</span>
        );
      },
    },
    {
      id: "lastActivity",
      accessorKey: "lastActivityAt",
      header: "Última actividad",
      cell: ({ row }) => {
        const at = row.original.lastActivityAt;
        if (!at) {
          return <span className="text-xs text-[#55556A]">Sin actividad</span>;
        }
        return (
          <span
            className="text-xs text-[#8888AA] tabular-nums"
            title={new Intl.DateTimeFormat("es", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(at))}
          >
            {formatRelativeTimeEs(new Date(at))}
          </span>
        );
      },
    },
    {
      accessorKey: "eepSyncStatus",
      header: "Sync EEP",
      cell: ({ getValue }) => {
        const status = getValue() as EepSyncStatus;
        return (
          <Badge variant={getEepSyncStatusVariant(status)}>
            {getEepSyncStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ getValue }) => {
        const status = getValue() as FanStatus;
        const cfg = FAN_STATUS_LABELS[status] ?? {
          label: status,
          variant: "ghost" as const,
        };
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Alta",
      cell: ({ getValue }) => {
        const date = getValue() as Date;
        return (
          <span className="text-[10px] text-[#55556A] tabular-nums">
            {new Intl.DateTimeFormat("es", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(date))}
          </span>
        );
      },
    },
  ];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FansClientProps {
  initialFans: FanIntelligenceListRow[];
  totalCount: number;
  orgLevels: FanLevel[];
}

const EMPTY_FILTERS: FanIntelligenceListFilters = {
  status: null,
  segment: null,
  countryCode: null,
  eepSyncStatus: null,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function FansClient({
  initialFans,
  totalCount,
  orgLevels,
}: FansClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editingFan, setEditingFan] = useState<FanView | undefined>(undefined);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileFan, setProfileFan] = useState<FanView | null>(null);
  const [filters, setFilters] =
    useState<FanIntelligenceListFilters>(EMPTY_FILTERS);

  const columns = useMemo(() => buildColumns(orgLevels), [orgLevels]);

  const segmentOptions = useMemo(
    () => collectSegmentFilterOptions(initialFans),
    [initialFans],
  );
  const countryOptions = useMemo(
    () => collectCountryFilterOptions(initialFans),
    [initialFans],
  );

  const filteredFans = useMemo(
    () => filterFanIntelligenceRows(initialFans, filters),
    [initialFans, filters],
  );

  const hasActiveFilters = Boolean(
    filters.status ||
      filters.segment ||
      filters.countryCode ||
      filters.eepSyncStatus,
  );

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
    (fan: FanIntelligenceListRow) => (
      <FanRowActions
        fan={fan}
        onEdit={handleEdit}
        onViewProfile={handleViewProfile}
        onMutated={handleMutated}
      />
    ),
    [handleMutated],
  );

  const statusOptions = (
    Object.entries(FAN_STATUS_LABELS) as Array<
      [FanStatus, (typeof FAN_STATUS_LABELS)[FanStatus]]
    >
  )
    .filter(([value]) => value !== "archived")
    .map(([value, cfg]) => ({ value, label: cfg.label }));

  const eepOptions: Array<{ value: EepSyncStatus; label: string }> = [
    { value: "pending", label: "Pendiente" },
    { value: "synced", label: "Sincronizado" },
    { value: "failed", label: "Error" },
    { value: "retrying", label: "Reintentando" },
  ];

  return (
    <>
      <DataTable
        data={filteredFans}
        columns={columns}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Buscar fan, email…"
        paginated
        defaultPageSize={25}
        stickyHeader
        emptyMessage={
          hasActiveFilters ? "Sin fans con estos filtros" : "Sin fans registrados"
        }
        emptyDescription={
          hasActiveFilters
            ? "Ajustá o restablecé los filtros para ver más resultados."
            : "Crea el primer fan con el botón Nuevo fan."
        }
        rowActions={rowActions}
        onRowClick={handleViewProfile}
        initialColumnVisibility={{ createdAt: false }}
        toolbarLeft={
          <div className="flex items-center gap-2 flex-wrap">
            <Combobox
              size="sm"
              clearable
              placeholder="Estado"
              value={filters.status ?? null}
              onChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  status: (value as FanStatus | null) ?? null,
                }))
              }
              options={statusOptions}
            />
            <Combobox
              size="sm"
              clearable
              placeholder="Segmento"
              value={filters.segment ?? null}
              onChange={(value) =>
                setFilters((f) => ({ ...f, segment: value }))
              }
              options={segmentOptions}
            />
            <Combobox
              size="sm"
              clearable
              placeholder="País"
              value={filters.countryCode ?? null}
              onChange={(value) =>
                setFilters((f) => ({ ...f, countryCode: value }))
              }
              options={countryOptions}
            />
            <Combobox
              size="sm"
              clearable
              placeholder="Sync EEP"
              value={filters.eepSyncStatus ?? null}
              onChange={(value) =>
                setFilters((f) => ({
                  ...f,
                  eepSyncStatus: (value as EepSyncStatus | null) ?? null,
                }))
              }
              options={eepOptions}
            />
            {hasActiveFilters && (
              <Button
                intent="ghost"
                size="sm"
                leftIcon={<RotateCcw size={12} />}
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                Limpiar
              </Button>
            )}
          </div>
        }
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
            ? hasActiveFilters
              ? `${filteredFans.length.toLocaleString("es")} de ${totalCount.toLocaleString("es")} fans (PRIMARY)`
              : `${totalCount.toLocaleString("es")} fans PRIMARY en esta organización`
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
        relationshipType="PRIMARY"
      />
    </>
  );
}
