/**
 * Shared shapes for the internal Fan Experience demo API + playground UI.
 * Client-safe — does not import server-only modules.
 */

export interface DemoFanLoginResponse {
  fanId:             string;
  displayName:       string;
  segment:           string | null;
  level:             string | null;
  engagementScore:   number;
  status:            string;
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

export interface DemoFanExperienceCampaign {
  id:               string;
  title:            string;
  description:      string | null;
  type:             string;
  pointsReward:     number;
  startsAt:         string;
  endsAt:           string;
  alreadyResponded: boolean;
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
  engagementScore:  number;
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
