"use client";

import { useTransition } from "react";
import { MoreHorizontal, Eye, Pencil, Play, Pause, FlagTriangleRight } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";
import {
  pauseCampaign,
  activateCampaign,
  finishCampaign,
} from "@/server/actions/campaigns";
import type { CampaignWithResponseStats } from "@/server/queries/campaigns";

interface CampaignRowActionsProps {
  row:       CampaignWithResponseStats;
  onView:    (row: CampaignWithResponseStats) => void;
  onEdit:    (row: CampaignWithResponseStats) => void;
  onMutated: () => void;
}

export function CampaignRowActions({
  row,
  onView,
  onEdit,
  onMutated,
}: CampaignRowActionsProps) {
  const [pending, transition] = useTransition();

  const isFinished = row.status === "finished";
  const isActive   = row.status === "active";

  async function mutate(fn: typeof activateCampaign): Promise<void> {
    transition(async () => {
      await fn(row.id);
      onMutated();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button intent="ghost" size="icon-sm" disabled={pending} title="Acciones">
          <MoreHorizontal size={14} />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" minWidth={192}>
        <DropdownMenu.Label>Acciones</DropdownMenu.Label>

        <DropdownMenu.Item icon={<Eye size={13} />} onSelect={() => onView(row)}>
          Ver detalle
        </DropdownMenu.Item>

        <DropdownMenu.Item
          icon={<Pencil size={13} />}
          onSelect={() => onEdit(row)}
          disabled={isFinished}
        >
          Editar
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        {!isFinished && !isActive && (
          <DropdownMenu.Item
            icon={<Play size={13} />}
            disabled={pending}
            onSelect={() => mutate(activateCampaign)}
          >
            Activar / reprogramar
          </DropdownMenu.Item>
        )}

        {!isFinished && isActive && (
          <DropdownMenu.Item
            icon={<Pause size={13} />}
            disabled={pending}
            onSelect={() => mutate(pauseCampaign)}
          >
            Pausar
          </DropdownMenu.Item>
        )}

        {!isFinished && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              icon={<FlagTriangleRight size={13} />}
              variant="destructive"
              disabled={pending}
              onSelect={() => {
                if (
                  !confirm(
                    `¿Finalizar "${row.title.slice(0, 72)}${row.title.length > 72 ? "…" : ""}"?`,
                  )
                ) {
                  return;
                }
                void mutate(finishCampaign);
              }}
            >
              Finalizar campaña
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
