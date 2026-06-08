# BigFana System Architecture

## Purpose

This document defines the high-level architecture of BigFana.

The goal is to describe how the major systems interact and where responsibilities belong.

This document intentionally focuses on architecture and system boundaries rather than implementation details.

---

# Architectural Principles

BigFana is designed as:

```txt
Organization First
Global Community Ready
```

The platform must support:

- multiple organizations
- multiple sports
- multiple competitions
- multiple integrations
- EEP intelligence
- future global fan communities

---

# High-Level Architecture

```txt
                        ┌─────────────────┐
                        │      EEP        │
                        │ Intelligence    │
                        │ Segmentation    │
                        └────────┬────────┘
                                 │
                                 │
                                 ▼

┌─────────────────────────────────────────────────────┐
│                     BigFana                         │
│                                                     │
│  Dashboard                                          │
│  Fan Experience                                     │
│  Loyalty                                            │
│  Campaigns                                          │
│  Sponsors                                           │
│  Benefits                                           │
│  Rewards                                            │
│  Content                                            │
│  Match Center                                       │
│                                                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       │
                       ▼

              ┌─────────────────┐
              │   PostgreSQL    │
              │      Neon       │
              └─────────────────┘
```

---

# Core Systems

BigFana consists of four major domains:

```txt
Platform Core

Fan Experience

Intelligence

Integrations
```

---

# Platform Core

Responsible for:

```txt
Organizations

Users

Memberships

Permissions

Configuration

Multi-Tenant Management
```

Ownership:

```txt
BigFana
```

---

# Fan Experience

Responsible for:

```txt
Fans

Campaigns

Points

Levels

Benefits

Rewards

Content

Match Center

Notifications
```

Ownership:

```txt
BigFana
```

---

# Intelligence Layer

Responsible for:

```txt
Audience Generation

Behavioral Segmentation

Scoring

Recommendations

Profile Enrichment
```

Ownership:

```txt
EEP
```

Defined by:

```txt
ADR-003
```

---

# Integration Layer

Responsible for:

```txt
CRM

Commerce

Ticketing

ERP

Marketing Platforms

EEP
```

Ownership:

```txt
BigFana
```

BigFana acts as an integration hub.

---

# Multi-Tenant Architecture

BigFana is multi-tenant.

Each organization operates independently.

Examples:

```txt
River Plate

Boca Juniors

Toluca

Real Madrid
```

Each organization owns:

```txt
Fans

Campaigns

Benefits

Rewards

Content

Sponsors
```

while sharing the same platform infrastructure.

---

# Global Community Layer

Future architecture supports:

```txt
Cross Organization Relationships

Global Fan Profiles

Global Competitions

Global Audiences

Cross Community Campaigns
```

Defined by:

```txt
ADR-001

ADR-002

ADR-006
```

---

# Fan Architecture

Current Direction:

```txt
Fan
    ↓
FanOrganization
    ↓
Organization
```

A fan is a platform-level identity.

Organizations own relationships rather than fan records.

---

# Competition Architecture

Current Direction:

```txt
Sport
    ↓
Competition
    ↓
Organization
```

Defined by:

```txt
ADR-004
```

---

# Competition Types

Supported competition models:

```txt
Integrated

Managed
```

Defined by:

```txt
ADR-005
```

---

# Managed Competitions

BigFana owns:

```txt
Teams

Fixtures

Standings

Matches

Seasons

Divisions
```

Examples:

```txt
Kings League

Neighborhood League

University League

Corporate League
```

---

# Integrated Competitions

BigFana consumes external data.

Examples:

```txt
Liga Profesional Argentina

La Liga

Premier League

Liga MX

NBA
```

Data sources may include:

```txt
Sports APIs

Official Providers

Federation Feeds
```

---

# EEP Integration Architecture

Event Flow:

```txt
Fan Action
    ↓
Fan Event
    ↓
Integration Job
    ↓
EEP
```

Examples:

```txt
Campaign Participation

Reward Redemption

Content View

Match Prediction

Sponsor Interaction
```

---

# Audience Flow

```txt
EEP
    ↓
Audience
    ↓
BigFana Campaign
```

Examples:

```txt
VIP Fans

Highly Engaged Fans

International Fans

European Football Fans
```

---

# Commerce Architecture

Commerce is not a core responsibility of BigFana.

BigFana follows an integration-first strategy.

Preferred model:

```txt
External Commerce
    ↓
BigFana Integration
```

Examples:

```txt
Shopify

WooCommerce

VTEX

Custom Commerce
```

---

# Optional Commerce Module

Future versions may include:

```txt
BigFana Commerce
```

as a standalone product.

The commerce domain should remain separated from the engagement domain.

---

# CRM Architecture

BigFana integrates with existing CRM systems whenever possible.

Examples:

```txt
HubSpot

Salesforce

Zoho

Custom CRM
```

BigFana should not attempt to replace enterprise CRM systems.

---

# Ticketing Architecture

Ticketing follows an integration-first strategy.

Examples:

```txt
Ticketmaster

Club Ticketing Systems

League Ticketing Systems
```

BigFana consumes ticketing activity as fan behavior.

---

# Database Architecture

Current database:

```txt
PostgreSQL

Neon
```

Future database evolution is defined in:

```txt
foundation-db-v1.md
```

---

# Deployment Architecture

Target deployment:

```txt
Frontend
    ↓
Next.js

Backend
    ↓
Next.js API

Database
    ↓
Neon PostgreSQL

Intelligence
    ↓
EEP
```

---

# Future Expansion Areas

The architecture intentionally supports future modules:

```txt
Marketplace

Subscriptions

Digital Collectibles

Fantasy Sports

Membership Programs

Global Rankings

Cross Community Experiences
```

without requiring architectural redesign.

---

# Related Documents

- PROJECT_STATE.md
- foundation-db-v1.md
- domain-model.md
- logical-model.md
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006