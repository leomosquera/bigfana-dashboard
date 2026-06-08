# BigFana Permission Matrix

## Purpose

This document defines the authorization model of BigFana.

The objective is to establish:

- platform roles
- organization roles
- permission scopes
- module access rules
- future scalability

This document is the source of truth for access control decisions.

---

# Authorization Principles

BigFana follows a:

```txt
Role-Based Access Control (RBAC)
```

model.

Permissions are assigned to roles.

Users receive permissions through one or more roles.

---

# Security Principles

Permissions must always be enforced:

```txt
Server Side
```

User interface visibility is not considered security.

Every operation must validate:

```txt
Authentication

Organization Scope

Permission
```

before execution.

---

# Permission Hierarchy

```txt
Platform
    ↓
Organization
        ↓
Module
            ↓
Action
```

Example:

```txt
campaigns.create
```

Meaning:

```txt
Campaign Module
    ↓
Create Action
```

---

# Role Categories

BigFana supports two major role groups:

```txt
Platform Roles

Organization Roles
```

---

# Platform Roles

Platform roles are reserved for BigFana operators.

These roles are not intended for clubs.

---

# Platform Administrator

Highest level role.

---

## Responsibilities

```txt
Platform Management

Tenant Management

Global Configuration

Feature Flags

System Monitoring
```

---

## Access

```txt
All Modules

All Organizations

All Permissions
```

---

# Platform Support

Operational support role.

---

## Responsibilities

```txt
Customer Support

Troubleshooting

Monitoring
```

---

## Restrictions

Cannot:

```txt
Delete Organizations

Manage Billing

Modify Platform Settings
```

unless explicitly granted.

---

# Organization Roles

Organization roles are assigned by clubs, leagues, and competitions.

---

# Organization Administrator

Highest role inside an organization.

---

## Responsibilities

```txt
Organization Configuration

Users

Permissions

Campaigns

Loyalty

Content

Sponsors

Integrations
```

---

## Access

Full access within the organization.

Cannot access:

```txt
Other Organizations

Platform Settings
```

---

# Marketing Manager

Responsible for engagement and growth.

---

## Responsibilities

```txt
Campaigns

Audiences

Segments

Notifications

Content

Fan Engagement
```

---

## Access

Can:

```txt
Create Campaigns

Publish Content

View Fans

Use Audiences

Use Segments
```

Cannot:

```txt
Manage Users

Manage Permissions

Manage Billing
```

---

# Community Manager

Responsible for fan interaction.

---

## Responsibilities

```txt
Fan Support

Fan Management

Community Engagement
```

---

## Access

Can:

```txt
View Fans

Manage Fan Notes

View Campaign Results

View Loyalty Data
```

Cannot:

```txt
Manage Roles

Manage Integrations

Manage Billing
```

---

# Content Editor

Responsible for content creation.

---

## Responsibilities

```txt
News

Articles

Media

Notifications
```

---

## Access

Can:

```txt
Create Content

Edit Content

Publish Content
```

Cannot:

```txt
Manage Campaigns

Manage Loyalty

Manage Integrations
```

---

# Sponsor Manager

Responsible for sponsor relationships.

---

## Responsibilities

```txt
Sponsors

Sponsor Campaigns

Benefits

Experiences
```

---

## Access

Can:

```txt
Manage Sponsors

Create Sponsor Activations

View Sponsor Analytics
```

Cannot:

```txt
Manage Users

Manage Integrations

Manage Billing
```

---

# Loyalty Manager

Responsible for loyalty programs.

---

## Responsibilities

```txt
Points

Levels

Benefits

Rewards

Redemptions
```

---

## Access

Can:

```txt
Manage Benefits

Manage Rewards

Manage Redemptions

Configure Loyalty Rules
```

Cannot:

```txt
Manage Users

Manage Integrations

Manage Billing
```

---

# Competition Manager

Responsible for sports operations.

---

## Responsibilities

```txt
Competitions

Matches

Standings

Seasons

Divisions
```

---

## Access

Can:

```txt
Manage Matches

Manage Standings

Manage Competitions
```

Cannot:

```txt
Manage Users

Manage Loyalty

Manage Billing
```

---

# Integration Manager

Responsible for external systems.

---

## Responsibilities

```txt
EEP

CRM

Commerce

Ticketing

ERP
```

---

## Access

Can:

```txt
Configure Integrations

View Logs

Retry Synchronizations
```

Cannot:

```txt
Manage Users

Manage Billing
```

---

# Read Only

Observation role.

---

## Responsibilities

```txt
View Information
```

---

## Access

Can:

```txt
View Authorized Modules
```

Cannot:

```txt
Create

Update

Delete
```

operations.

---

# Permission Naming Convention

Permissions should follow:

```txt
module.action
```

Examples:

```txt
fans.view
fans.export

campaigns.view
campaigns.create
campaigns.update
campaigns.delete

content.publish

rewards.manage

integrations.retry
```

---

# Module Permission Groups

---

# Organizations

Permissions:

```txt
organizations.view
organizations.update
```

---

# Users

Permissions:

```txt
users.view
users.create
users.update
users.delete

roles.view
roles.manage
```

---

# Fans

Permissions:

```txt
fans.view
fans.create
fans.update
fans.export
```

---

# Campaigns

Permissions:

```txt
campaigns.view
campaigns.create
campaigns.update
campaigns.delete
campaigns.publish
```

---

# Loyalty

Permissions:

```txt
points.view
points.manage

levels.view
levels.manage

benefits.view
benefits.manage

rewards.view
rewards.manage

redemptions.view
redemptions.manage
```

---

# Content

Permissions:

```txt
content.view
content.create
content.update
content.publish
content.delete
```

---

# Sponsors

Permissions:

```txt
sponsors.view
sponsors.create
sponsors.update
sponsors.delete

sponsor_campaigns.manage
```

---

# Competitions

Permissions:

```txt
sports.view

competitions.view
competitions.manage

matches.manage

standings.manage
```

---

# Intelligence

Permissions:

```txt
audiences.view

segments.view

insights.view
```

---

# Integrations

Permissions:

```txt
integrations.view

integrations.manage

integrations.retry
```

---

# Administration

Permissions:

```txt
settings.view
settings.manage

audit_logs.view
```

---

# Tenant Isolation Rules

Organization users must never access:

```txt
Other Organizations

Other Fans

Other Campaigns

Other Loyalty Programs

Other Integrations
```

unless explicitly granted through platform-level permissions.

---

# Future Permission Categories

Future modules may introduce:

```txt
marketplace.*

subscriptions.*

fantasy.*

wallet.*

collectibles.*
```

The naming convention must remain consistent.

---

# Role Assignment Rules

Users may have:

```txt
One Role

Multiple Roles
```

Permissions are cumulative.

Example:

```txt
Marketing Manager

+

Content Editor
```

Result:

```txt
Combined Permissions
```

---

# Permission Resolution

Authorization checks should follow:

```txt
Authenticated?

↓

Organization Scope Valid?

↓

Permission Granted?

↓

Execute Action
```

---

# Success Criteria

The permission model is successful when:

```txt
Permissions are explicit

Roles remain understandable

Organization isolation is preserved

New modules can be added without redesign

Platform administration remains separated from organization administration
```

---

# Related Documents

- dashboard-information-architecture.md
- dashboard-ux-architecture.md
- application-architecture.md
- modules-catalog.md
- system-architecture.md
- AGENTS.md
- AI_RULES.md