// Auth (Better Auth core tables)
export * from "./auth";

// Organizations & memberships
export * from "./organizations";

// Canonical sports / competitions catalog (ADR-004 / ADR-005 / F08)
export * from "./sports";
export * from "./competitions";
export * from "./competition-organizations";

// Fans (with EEP sync fields)
export * from "./fans";

// Fan↔organization relationships (ADR-001 / ADR-002 / ADR-009 SoT)
export * from "./fan-organizations";

// Integration jobs (async EEP sync queue)
export * from "./integrations";

// Fan behavioral events
export * from "./events";

// Gamification (points ledger + level tiers)
export * from "./gamification";

// Engagement Intelligence Layer (segment rules + fan experiences)
export * from "./segments";

// Campaign engine (campaigns + sponsor placements)
export * from "./campaigns";
