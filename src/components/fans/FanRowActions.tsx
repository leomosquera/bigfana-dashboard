"use client";

import { useTransition } from "react";
import { MoreHorizontal, Eye, Pencil, UserX, UserCheck, Archive } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import { suspendFan, reactivateFan, archiveFan } from "@/server/actions/fans";
import type { FanView } from "@/db/schema";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FanRowActionsProps {
  fan:           FanView;
  onEdit:        (fan: FanView) => void;
  onViewProfile: (fan: FanView) => void;
  onMutated:     () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FanRowActions({ fan, onEdit, onViewProfile, onMutated }: FanRowActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleSuspend() {
    startTransition(async () => {
      await suspendFan(fan.id);
      onMutated();
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      await reactivateFan(fan.id);
      onMutated();
    });
  }

  function handleArchive() {
    if (!confirm(`¿Archivar a ${fan.displayName ?? "este fan"}? El fan ya no aparecerá en la lista principal.`)) {
      return;
    }
    startTransition(async () => {
      await archiveFan(fan.id);
      onMutated();
    });
  }

  const canSuspend    = fan.status === "active";
  const canReactivate = fan.status === "suspended" || fan.status === "inactive";
  const canArchive    = fan.status !== "archived";

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          intent="ghost"
          size="icon-sm"
          disabled={isPending}
          title="Acciones"
        >
          <MoreHorizontal size={14} />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" minWidth={176}>
        <DropdownMenu.Label>Acciones</DropdownMenu.Label>

        <DropdownMenu.Item
          icon={<Eye size={13} />}
          onSelect={() => onViewProfile(fan)}
        >
          Ver perfil
        </DropdownMenu.Item>

        <DropdownMenu.Item
          icon={<Pencil size={13} />}
          onSelect={() => onEdit(fan)}
        >
          Editar
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        {canSuspend && (
          <DropdownMenu.Item
            icon={<UserX size={13} />}
            onSelect={handleSuspend}
            disabled={isPending}
          >
            Suspender
          </DropdownMenu.Item>
        )}

        {canReactivate && (
          <DropdownMenu.Item
            icon={<UserCheck size={13} />}
            onSelect={handleReactivate}
            disabled={isPending}
          >
            Reactivar
          </DropdownMenu.Item>
        )}

        {canArchive && (
          <>
            {(canSuspend || canReactivate) && <DropdownMenu.Separator />}
            <DropdownMenu.Item
              icon={<Archive size={13} />}
              variant="destructive"
              onSelect={handleArchive}
              disabled={isPending}
            >
              Archivar
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
