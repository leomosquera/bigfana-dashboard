# BigFana Application Architecture

## Purpose

This document defines how the BigFana application codebase should be organized.

The objective is to establish:

- application boundaries
- module structure
- server-side architecture
- client-side architecture
- data access rules
- integration rules
- event flow
- scalability principles

This document is the reference for future implementation work.

---

# Architecture Principles

BigFana must follow these principles:

```txt
Modular

Typed

Server-first

API-ready

Multi-tenant

Event-driven

Integration-friendly

Documentation-aligned
```

The application must remain scalable without introducing unnecessary complexity too early.

---

# Current Stack

BigFana currently uses:

```txt
Next.js App Router

TypeScript

Tailwind CSS v4

Framer Motion

CVA

Lucide React

Better Auth

Neon PostgreSQL
```

EEP is an external system integrated through APIs and asynchronous synchronization.

---

# Application Layers

The application should be organized into clear layers:

```txt
UI Layer

Application Layer

Domain Layer

Data Access Layer

Integration Layer
```

---

# UI Layer

Responsible for:

```txt
Pages

Layouts

Components

Forms

Tables

Modals

Drawers

Navigation
```

Rules:

- No direct database access.
- No business logic duplication.
- No integration logic.
- Use shared design system primitives.
- Use existing dashboard visual language.

---

# Application Layer

Responsible for:

```txt
Server Actions

Route Handlers

Use Cases

Validation

Authorization

Workflow Coordination
```

Rules:

- Coordinates business operations.
- Calls domain services.
- Validates permissions.
- Enforces organization scope.
- Generates events when required.

---

# Domain Layer

Responsible for:

```txt
Business Rules

Module Logic

Entity Behavior

Loyalty Rules

Campaign Rules

Fan Relationship Rules
```

Rules:

- Must not depend on UI.
- Must not directly depend on external providers.
- Must express product concepts clearly.
- Must follow ADR decisions.

---

# Data Access Layer

Responsible for:

```txt
Database Queries

Repositories

Persistence

Transactions

Data Mapping
```

Rules:

- All business data queries must be organization-scoped.
- Database logic must not be duplicated across UI components.
- Repositories should expose clear methods.
- Avoid raw query logic scattered across the application.

---

# Integration Layer

Responsible for:

```txt
EEP

CRM

Commerce

Ticketing

ERP

Marketing Platforms

Sports Data Providers
```

Rules:

- External integrations must be isolated.
- Integrations must not block core user experience.
- Integration failures must be retryable.
- Integration logic must not leak into UI components.

---

# Recommended Folder Structure

The target structure should evolve toward:

```txt
src/
  app/
    (dashboard)/
    api/

  components/
    ui/
    dashboard/
    shared/

  modules/
    organizations/
    users/
    fans/
    campaigns/
    loyalty/
    benefits/
    rewards/
    sponsors/
    content/
    competitions/
    integrations/
    intelligence/

  server/
    auth/
    db/
    events/
    integrations/
    permissions/
    services/

  lib/
    utils/
    validation/
    formatting/
    constants/

  styles/
```

This structure is a target direction.

Existing code should be migrated incrementally, not rewritten all at once.

---

# Module Structure

Each module should follow a consistent internal structure when needed.

Example:

```txt
modules/fans/
  components/
  actions/
  services/
  repositories/
  schemas/
  types/
  constants/
```

Not every module needs every folder.

Folders should be created only when the module requires them.

---

# Server Actions

Server actions should be used for dashboard workflows when appropriate.

Examples:

```txt
Create Campaign

Update Fan

Redeem Reward

Update Organization Settings
```

Rules:

- Validate input.
- Verify permissions.
- Enforce organization scope.
- Call services.
- Return typed results.
- Avoid direct UI-specific logic.

---

# Route Handlers

Route handlers should be used for:

```txt
External APIs

Webhook Receivers

Mobile App APIs

Fan App APIs

Integration Endpoints
```

Rules:

- Must be typed.
- Must validate input.
- Must authenticate when required.
- Must not duplicate service logic.
- Must call application services.

---

# Services

Services contain application and domain logic.

Examples:

```txt
FanService

CampaignService

LoyaltyService

IntegrationService

CompetitionService
```

Responsibilities:

- enforce business rules
- coordinate repositories
- generate events
- create integration jobs
- apply permissions where needed

---

# Repositories

Repositories contain database access.

Examples:

```txt
FanRepository

CampaignRepository

OrganizationRepository

IntegrationJobRepository
```

Responsibilities:

- query data
- persist data
- map database results
- keep database logic isolated

Repositories must not contain UI logic.

---

# Validation

Validation should be centralized.

Preferred pattern:

```txt
schemas/
```

Examples:

```txt
create-campaign.schema.ts

update-fan.schema.ts

redeem-reward.schema.ts
```

Rules:

- Validate input at boundaries.
- Keep validation reusable.
- Use typed schemas where possible.

---

# Permissions

Permissions must be explicit and module-based.

Examples:

```txt
fans.view

fans.create

fans.update

campaigns.view

campaigns.create

campaigns.update

rewards.manage
```

Rules:

- Check permissions server-side.
- Do not rely only on hidden UI.
- Enforce organization scope.
- Avoid hardcoded role assumptions.

---

# Multi-Tenant Rules

Every business operation must resolve:

```txt
organization_id
```

before accessing or modifying organization-owned data.

Applies to:

```txt
fans

campaigns

benefits

rewards

content

sponsors

integrations

events
```

Global platform queries must be explicitly justified and documented.

---

# Event-Driven Rules

Relevant fan actions must generate events.

Examples:

```txt
fan_registered

campaign_answered

trivia_completed

prediction_submitted

benefit_used

reward_redeemed

content_viewed

sponsor_clicked
```

Events are used for:

```txt
Loyalty

Analytics

EEP Synchronization

Audience Generation
```

---

# Event Flow

```txt
User Action
    ↓
Service
    ↓
Database Transaction
    ↓
Fan Event
    ↓
Integration Job
    ↓
EEP
```

Events must be append-only whenever possible.

---

# Integration Job Pattern

External synchronization should use integration jobs.

Pattern:

```txt
Create Business Record

Create Event

Create Integration Job

Return UI Response

Process Integration Later
```

The UI must not wait for external systems unless explicitly required.

---

# EEP Integration Rules

BigFana sends events to EEP.

BigFana consumes:

```txt
Audiences

Segments

Scores

Insights
```

EEP responsibilities are defined in:

```txt
ADR-003

docs/05-eep/eep-architecture.md
```

---

# API-First Readiness

The architecture must remain compatible with:

```txt
Dashboard

Fan Web App

Mobile App

External Integrations

Future Public APIs
```

Business logic must not be tightly coupled to dashboard UI.

---

# Dashboard Rules

Dashboard implementation must follow:

```txt
docs/07-dashboard/dashboard-information-architecture.md
```

Rules:

- Use existing design system.
- Use shared data table system.
- Use shared overlay system.
- Keep UI consistent.
- Avoid duplicated UI primitives.

---

# Database Evolution Rules

Database changes must follow:

```txt
AI_RULES.md

docs/04-database/foundation-db-v1.md
```

No database migration should be created without approval.

Every migration must update:

```txt
docs/04-database/current-schema.md

docs/04-database/gap-analysis.md

PROJECT_STATE.md
```

---

# Error Handling

Errors should be handled consistently.

Expected error categories:

```txt
Validation Error

Authorization Error

Not Found Error

Conflict Error

Integration Error

Unexpected Error
```

User-facing errors should be clear and actionable.

Internal errors should preserve diagnostic context.

---

# Logging and Observability

Important workflows should be observable.

Examples:

```txt
Authentication

Campaign Participation

Point Awarding

Reward Redemption

Integration Jobs

EEP Synchronization
```

Future observability should include:

```txt
Logs

Metrics

Audit Trail

Integration Health
```

---

# Testing Direction

Testing should prioritize:

```txt
Critical Business Rules

Permission Checks

Tenant Isolation

Event Generation

Integration Job Creation
```

Test strategy will be defined in future documentation.

---

# Migration Strategy

Existing code should not be rewritten immediately.

Architecture should evolve incrementally:

```txt
Preserve existing functionality

Extract reusable services

Introduce repositories where needed

Move logic out of UI gradually

Document every major refactor
```

---

# Anti-Patterns

Avoid:

```txt
Direct database access from client components

Duplicated business logic

Hardcoded organization IDs

Hardcoded roles

Hardcoded visual styles

Blocking UI on external integrations

Large unrelated refactors

Unapproved dependencies

Unapproved database changes
```

---

# Success Criteria

The application architecture is successful when:

```txt
Modules are understandable

Business logic is reusable

Database access is isolated

Integrations are isolated

Events are consistently generated

Tenant boundaries are enforced

Future apps can reuse the same backend logic
```

---

# Related Documents

- PROJECT_STATE.md
- AI_RULES.md
- AGENTS.md
- docs/03-architecture/system-architecture.md
- docs/04-database/foundation-db-v1.md
- docs/05-eep/eep-architecture.md
- docs/07-dashboard/dashboard-information-architecture.md
- docs/08-integrations/integrations-strategy.md