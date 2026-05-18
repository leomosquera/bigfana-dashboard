/**
 * Shared shapes for the internal Fan Experience demo API + playground UI.
 * Client-safe — does not import server-only modules.
 */

export interface DemoFanLoginSnapshot {
  fanId:             string;
  displayName:       string;
  segment:           string | null;
  level:             string | null;
  engagementScore:   number;
  status:            string;
}

export interface DemoFanLoginResponse extends DemoFanLoginSnapshot {
  /** Signed demo fan token — send as `Authorization: Bearer <token>` on fan APIs */
  token:     string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface DemoFanExperienceSegment {
  key: string | null;
  rule: {
    id:          string;
    name:        string;
    color:       string | null;
    description: string | null;
    priority:    number;
    isActive:    boolean;
  } | null;
}

export interface DemoFanExperienceLevel {
  current: {
    id:        string;
    name:      string;
    color:     string | null;
    minPoints: number;
    sortOrder: number;
  } | null;
  next: {
    id:        string;
    name:      string;
    color:     string | null;
    minPoints: number;
    sortOrder: number;
  } | null;
  pointsToNextLevel: number | null;
}

/** Fan-facing option — no correctness hints (trivia answers stay server-side). */
export interface DemoFanExperienceCampaignOption {
  id:        string;
  label:     string;
  value:     string;
  sortOrder: number;
}

export interface DemoFanExperienceCampaignQuestion {
  id:        string;
  /** `multiple_choice` | `short_text` — mirrors campaign_questions.type */
  type:      string;
  question:  string;
  sortOrder: number;
  options:   DemoFanExperienceCampaignOption[];
}

export interface DemoFanExperienceCampaign {
  id:               string;
  type:             string;
  title:            string;
  description:      string | null;
  /** Hero / cover — from campaign metadata when configured */
  image:            string | null;
  pointsReward:     number;
  startsAt:         string;
  endsAt:           string;
  status:           string;
  ctaLabel:         string;
  alreadyResponded: boolean;
  questions:        DemoFanExperienceCampaignQuestion[];
}

export interface DemoFanExperienceSponsor {
  id:             string;
  sponsorName:    string;
  title:          string;
  description:    string | null;
  imageUrl:       string | null;
  destinationUrl: string | null;
  priority:       number;
}

export interface DemoFanExperienceFan {
  id:               string;
  displayName:      string;
  email:            string | null;
  segment:          string | null;
  tier:             string | null;
  /** Cumulative engagement / points balance (server — same economy as niveles). */
  engagementScore:  number;
  /** Acumulado oficial de puntos (ledger cuando hay historial; si no, perfil del fan). */
  points:            number;
  /** Nivel actual derivado del acumulado (mismo criterio que `level.current`). */
  level:            string | null;
  status:           string;
}

export interface DemoFanExperienceLedgerPreviewRow {
  id:           string;
  points:       number;
  balanceAfter: number;
  eventType:    string;
  reason:       string;
  createdAt:    string;
}

export interface DemoFanExperienceStats {
  engagementScore: number;
  /** Igual que `fan.points` — total acumulado para vistas que lean `stats`. */
  totalPoints:     number;
  velocityTrend:   "accelerating" | "stable" | "dormant";
  points30d:       number;
  events30d:       number;
  activityScore:   number;
  ledgerPreview:   DemoFanExperienceLedgerPreviewRow[];
}

export interface DemoBehavioralSnapshot {
  totalEvents:    number;
  topEventTypes:  { eventType: string; count: number; points: number }[];
  lastEventAt:    string | null;
  daysSinceLast:  number | null;
  activityScore:  number;
}

export interface DemoVelocitySnapshot {
  points30d: number;
  events30d: number;
  points7d:  number;
  events7d:  number;
  trend:     "accelerating" | "stable" | "dormant";
}

export interface DemoEligibleExperienceSurface {
  id:              string;
  type:            string;
  title:           string;
  description:     string | null;
  sponsorAffinity: string[];
  segmentName:     string | null;
  segmentColor:    string | null;
}

export interface DemoFanExperienceIntelligence {
  behavioral: DemoBehavioralSnapshot;
  velocity:   DemoVelocitySnapshot;
}

export interface DemoFanExperienceResponse {
  fan:          DemoFanExperienceFan;
  segment:      DemoFanExperienceSegment;
  level:        DemoFanExperienceLevel;
  campaigns:    DemoFanExperienceCampaign[];
  experiences:  DemoEligibleExperienceSurface[];
  sponsors:     DemoFanExperienceSponsor[];
  stats:        DemoFanExperienceStats;
  intelligence: DemoFanExperienceIntelligence;
}
