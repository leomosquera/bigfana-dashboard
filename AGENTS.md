# BigFana — AGENTS.md

## Product Context

BigFana is a premium sports-tech SaaS platform focused on:
- fan engagement
- gamification
- behavioral intelligence
- sports communities
- multi-tenant club management

The platform will support multiple sports organizations and large fan communities.

BigFana is NOT:
- a generic admin dashboard
- a playful consumer app
- a bootstrap CRUD panel

The product should feel:
- premium
- cinematic
- modern
- enterprise-grade
- data-driven
- sports-tech

Inspirations:
- Linear
- Stripe
- Vercel
- Formula 1 dashboards
- modern fintech SaaS
- premium analytics platforms

---

# Technical Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Framer Motion
- CVA (class-variance-authority)
- Lucide React icons

Current architecture already includes:
- Design System
- Theme system
- Motion system
- Layout primitives
- UI primitives
- Dashboard standardization

Always work WITH the existing architecture.

---

# Critical Rules

## DO NOT

- Do not redesign the existing dashboard.
- Do not simplify the premium aesthetic.
- Do not introduce playful UI.
- Do not use emoji icons.
- Do not introduce random component styles.
- Do not hardcode colors or spacing.
- Do not create duplicated UI primitives.
- Do not perform large unrelated refactors.
- Do not replace existing architecture without reason.
- Do not introduce inconsistent motion patterns.
- Do not use Pages Router.
- Do not generate generic SaaS UI.

---

# Visual Identity

The UI must always preserve:
- dark premium surfaces
- cinematic feeling
- subtle glow effects
- clean spacing
- minimalist enterprise UI
- sports-tech aesthetics

Use:
- outline icons
- subtle gradients
- layered surfaces
- soft borders
- elegant hover states

Avoid:
- cartoonish UI
- oversized rounded shapes
- colorful playful palettes
- emoji-based UX

---

# Icons

Always use:
- Lucide React
- outline style icons
- consistent icon sizing

Never use:
- emojis
- filled playful icons
- inconsistent icon sets

---

# Design System Rules

Always use:
- design tokens
- primitives
- CVA variants
- reusable abstractions

Prefer:
- Surface
- Card
- Stack
- Inline
- Grid
- Section

Avoid repeated Tailwind utility chains.

Never hardcode:
- colors
- spacing
- border radius
- shadows

Use theme tokens instead.

---

# Motion Rules

Use shared motion presets from the motion system.

Animations should feel:
- smooth
- premium
- subtle
- cinematic

Preferred:
- fadeUp
- scaleIn
- stagger animations
- soft hover transitions

Avoid:
- excessive bouncing
- exaggerated animations
- flashy transitions

Microinteractions should remain subtle.

---

# Component Architecture

Prefer:
- composable components
- semantic anatomy
- reusable patterns

Examples:
- Card.Header
- Card.Content
- Card.Footer
- Modal.Header
- Modal.Body
- Modal.Footer

Do not create monolithic components.

---

# UX Rules

BigFana should feel like an enterprise analytics platform.

Interfaces should be:
- clean
- dense but readable
- productivity-focused
- responsive
- keyboard accessible

Prioritize:
- data clarity
- usability
- fast scanning
- consistency

---

# Data Tables

Tables are a core product pattern.

Tables should support:
- sorting
- filtering
- pagination
- column visibility
- date filtering
- row actions
- dropdown menus
- responsive layouts

Prefer enterprise-grade UX patterns.

---

# Dropdowns / Overlays

Dropdowns, modals, drawers and popovers should:
- share the same visual language
- use consistent spacing
- use consistent motion
- support keyboard navigation
- preserve accessibility

---

# Theming

The platform supports:
- multi-tenant branding
- dynamic themes
- future sponsor branding
- future light mode

Always build components with theme compatibility in mind.

Never hardcode brand colors.

Use:
- CSS variables
- theme tokens
- theme helpers

---

# Code Quality

Always:
- preserve type safety
- avoid unnecessary abstractions
- avoid duplicated logic
- keep components modular
- keep imports organized

Before finishing:
- run typecheck
- run lint
- verify build passes

---

# Workflow

Work incrementally.

Prefer:
1. analysis
2. implementation plan
3. small safe refactors
4. verification

Do not rewrite large sections unnecessarily.

Preserve backward compatibility whenever possible.

---

# Future Architecture Awareness

The platform will eventually support:
- authentication
- organizations
- memberships
- multi-tenant access
- fan events
- behavioral analytics
- gamification
- EEP integrations
- mobile applications

Build with future scalability in mind.

---

# Enterprise Systems

The platform already includes:
- Overlay System
- Dropdown System
- Selection System
- Date & Time System
- Enterprise DataTable System

Always reuse existing systems before creating new patterns.

Avoid:
- duplicated filter UIs
- duplicated table logic
- duplicated overlays
- inconsistent toolbar patterns

---

# DataTable Rules

Use the shared DataTable system for all data-heavy interfaces.

Prefer:
- toolbar-based filtering
- dense enterprise spacing
- bulk actions
- column visibility
- row actions
- loading states
- empty states

Do not create isolated table implementations unless strictly necessary.

---

# Selection System Rules

Use:
- Combobox
- MultiSelect
- DatePicker
- RangePicker
- TimePicker

for all advanced filtering and selection flows.

Avoid native selects for complex enterprise interfaces.

---

# Internationalization

The visible UI currently remains in Spanish.

The project is being prepared for future internationalization using:
- next-intl
- App Router compatible architecture
- non-routing i18n mode

Rules:
- Extract reusable UI strings progressively.
- Do not hardcode reusable UI labels inside complex components.
- Proper nouns and dynamic database content are NOT translation keys.
- Keep locale architecture lightweight until real multi-language support is needed.

---

# Formatting Rules

Prepare all formatting to become locale-aware.

Prefer:
- Intl.NumberFormat
- locale-aware date formatting
- next-intl formatting helpers

Avoid hardcoded locale formatting inside components.

---

# SaaS Foundation Awareness

The platform will support:
- Supabase
- authentication
- organizations
- memberships
- roles
- protected routes
- multi-tenant branding
- behavioral event systems

Frontend architecture should remain compatible with:
- organization-aware contexts
- multi-tenant theming
- future mobile applications
- EEP integrations

---

# SaaS + Backend Architecture Rules

BigFana is now a real multi-tenant SaaS platform.

The backend architecture must support:

* organizations (tenants)
* memberships
* role-based access
* fan management
* behavioral event systems
* gamification
* EEP integrations
* future mobile/webapp APIs

---

# Multi-Tenant Rules

All business data must always be organization-scoped.

Every query involving:

* fans
* events
* campaigns
* analytics
* gamification
* integrations

must always filter by:

* `organization_id`

Never create global queries unless explicitly required.

Always think:

* tenant isolation
* organization-aware access
* secure scoped data

---

# Authentication Rules

The platform uses:

* Better Auth
* Neon PostgreSQL
* session-based authentication

Current auth scope:

* admin dashboard authentication only

Future fan authentication will likely use:

* OTP
* magic links
* social auth
* mobile-first flows

Do not mix admin auth and fan auth architectures.

---

# Database Rules

Database:

* Neon PostgreSQL

Current schema includes:

* organizations
* memberships
* users
* fans
* fan_events
* integration_jobs

Database architecture must remain:

* scalable
* tenant-aware
* event-driven

Avoid premature complexity:

* no microservices
* no over-engineering
* no unnecessary abstraction layers

---

# Event Architecture

The platform is event-driven.

Fan behavior should eventually generate:

* fan_events
* points
* rankings
* achievements
* gamification states
* EEP synchronization

Examples:

* attending matches
* buying products
* answering trivia
* predictions
* voting
* redeeming rewards
* participating in raffles

Event architecture must remain flexible and append-only.

Avoid rigid schemas for behavioral payloads.

Prefer:

* JSONB payloads
* typed event metadata
* scalable event ingestion

---

# EEP Integration Rules

BigFana integrates with the EEP platform.

The EEP acts as:

* behavioral intelligence engine
* segmentation engine
* exposure/scoring engine

BigFana responsibilities:

* manage fan interactions
* generate behavioral events
* synchronize fan profiles
* synchronize events

EEP synchronization must:

* be asynchronous
* never block UX flows
* support retries
* support failed sync recovery

Use:

* integration_jobs
* sync status fields
* idempotent integration patterns

---

# API Architecture Rules

The platform will expose APIs for:

* future mobile applications
* fan webapps
* integrations
* sponsor systems
* future public APIs

Architecture must remain:

* API-first
* mobile-friendly
* stateless where possible

Avoid tightly coupling:

* dashboard UI
* business logic
* API contracts

Prefer:

* reusable server actions
* reusable queries
* centralized business logic

---

# Server Architecture Rules

Prefer:

* server components
* server actions
* typed queries
* typed API contracts

Avoid:

* client-heavy business logic
* duplicated fetch logic
* direct DB access from client components

---

# Fan System Rules

Fans are NOT admin users.

Fans are organization-scoped entities.

Future fan systems will include:

* gamification
* trivia
* raffles
* predictions
* rankings
* rewards
* loyalty systems
* engagement scoring

Design future systems with:

* scalability
* event ingestion
* mobile UX
* real-time engagement

in mind.
