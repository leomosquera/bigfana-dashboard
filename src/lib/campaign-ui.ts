import type { CampaignStatus, CampaignType } from "@/db/schema";

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  survey:      "Encuesta",
  poll:        "Encuesta rápida / voto",
  trivia:      "Trivia",
  prediction:  "Predicción",
  raffle:      "Sorteo",
  reward:      "Recompensa",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft:     "Borrador",
  scheduled: "Programada",
  active:    "Activa",
  paused:    "Pausada",
  finished:  "Finalizada",
};
