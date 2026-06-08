# BigFana Dashboard UX Architecture

## Purpose

This document defines the UX architecture of the BigFana administrative dashboard.

The objective is to establish:

- layout principles
- navigation behavior
- dashboard patterns
- screen structure
- component usage
- interaction patterns
- scalability rules

This document complements:

```txt
dashboard-information-architecture.md
```

The information architecture defines what exists.

This document defines how users experience it.

---

# UX Vision

The BigFana dashboard must feel like a premium sports-tech SaaS platform.

The experience should be:

```txt
Premium

Cinematic

Modern

Enterprise-grade

Data-driven

Fast to scan

Operationally useful
```

The dashboard must not feel like:

```txt
Generic CRUD

Bootstrap Admin

Playful Consumer App

Basic Backoffice
```

---

# Core UX Principles

## Clarity

Users must understand what is happening quickly.

Every screen should answer:

```txt
Where am I?

What can I do here?

What requires attention?

What changed recently?
```

---

## Density With Readability

BigFana is an operational platform.

Screens may be information-dense, but they must remain readable.

Prefer:

```txt
Compact cards

Clear hierarchy

Short labels

Strong grouping

Consistent spacing
```

---

## Action-Oriented Design

Every administrative screen should prioritize useful actions.

Examples:

```txt
Create Campaign

Publish Content

Review Redemptions

Sync Integration

View Audience

Analyze Results
```

---

## Modular Navigation

Navigation must scale as modules grow.

Avoid adding top-level navigation items unnecessarily.

Prefer:

```txt
Domain

Section

Detail
```

Example:

```txt
Loyalty
    ↓
Rewards
    ↓
Reward Detail
```

---

## Role-Based Experience

Users should only see:

```txt
Modules they can access

Actions they can perform

Data scoped to their organization
```

Hidden UI must never replace server-side permissions.

---

# Global Layout

The dashboard layout is composed of:

```txt
Sidebar

Top Bar

Main Content

Contextual Panels

Overlays
```

---

# Sidebar

## Purpose

Primary navigation.

---

## Behavior

The sidebar should support:

```txt
Expanded Mode

Collapsed Icon Mode

Mobile Drawer Mode
```

---

## Structure

Recommended groups:

```txt
Dashboard

Fans

Engagement

Loyalty

Competitions

Content

Sponsors

Intelligence

Integrations

Administration
```

---

## Rules

The sidebar must:

```txt
Highlight active section

Support nested items

Remain scannable

Respect permissions

Respect enabled modules
```

Avoid:

```txt
Overcrowding

Deep nesting beyond 2 levels

Unclear labels
```

---

# Top Bar

## Purpose

Provide context and quick actions.

---

## Elements

Examples:

```txt
Organization Switcher

Search

Notifications

Quick Create

User Menu

Environment Indicator
```

---

## Organization Context

The selected organization must always be clear.

All dashboard data is organization-scoped unless explicitly marked global.

---

# Main Content Area

## Purpose

Display module screens.

---

## Standard Page Structure

Recommended structure:

```txt
Page Header

Primary Actions

Filters / Toolbar

Content Area

Secondary Panels
```

---

## Page Header

Should include:

```txt
Title

Description

Status

Breadcrumb

Primary CTA
```

Example:

```txt
Campaigns

Create, manage and analyze fan engagement campaigns.
```

---

# Dashboard Home

## Purpose

Provide operational overview.

---

## Primary Widgets

Examples:

```txt
Total Fans

Active Fans

Campaign Participation

Points Issued

Rewards Redeemed

Benefits Used

Upcoming Match

Top Audience

Sponsor Performance
```

---

## UX Rules

Dashboard home should:

```txt
Prioritize current activity

Highlight alerts

Show key trends

Provide shortcuts
```

Avoid becoming a static analytics page.

---

# Tables

Tables are a core dashboard pattern.

---

## Required Capabilities

Tables should support:

```txt
Search

Filtering

Sorting

Pagination

Column Visibility

Bulk Actions

Row Actions

Empty State

Loading State
```

---

## UX Rules

Use tables for:

```txt
Fans

Campaigns

Rewards

Redemptions

Sponsors

Integrations

Content
```

Avoid creating custom table patterns for each module.

Use the shared DataTable system.

---

# Filters

Filters should be consistent across modules.

---

## Common Filters

Examples:

```txt
Status

Date Range

Type

Organization

Audience

Segment

Level

Campaign
```

---

## UX Rules

Filters should be:

```txt
Toolbar-based

Composable

Persistent when useful

Easy to reset
```

Avoid placing complex filters randomly inside pages.

---

# Cards

Cards should be used for:

```txt
KPIs

Summaries

Module Overview

Quick Actions

Status Blocks
```

---

## UX Rules

Cards should:

```txt
Have clear titles

Use compact metadata

Support visual hierarchy

Avoid decorative clutter
```

Cards must use design system tokens.

---

# Forms

Forms should be optimized for administrative workflows.

---

## Form Patterns

Examples:

```txt
Single Step Form

Multi Step Wizard

Side Panel Form

Inline Edit

Bulk Edit
```

---

## UX Rules

Forms should:

```txt
Validate early

Group related fields

Use clear labels

Explain complex decisions

Avoid unnecessary fields
```

Use side panels for contextual creation when possible.

Examples:

```txt
Create Benefit

Create Reward

Create Sponsor

Create Campaign
```

---

# Drawers and Side Panels

Drawers are preferred for contextual workflows.

Use drawers for:

```txt
Quick Detail

Create Entity

Edit Entity

Review Activity

Preview Campaign
```

Drawers should not replace full pages for complex workflows.

---

# Modals

Modals should be used sparingly.

Use modals for:

```txt
Confirm Delete

Confirm Publish

Confirm Sync

Short Decisions
```

Avoid long forms inside modals.

---

# Detail Pages

Detail pages should exist for complex entities.

Examples:

```txt
Fan Detail

Campaign Detail

Reward Detail

Sponsor Detail

Competition Detail

Integration Detail
```

---

## Standard Detail Structure

```txt
Header

Status

Key Metrics

Tabs

Activity Timeline

Related Records
```

---

# Tabs

Tabs are useful inside detail pages.

Examples:

```txt
Overview

Activity

Analytics

Settings

History
```

Tabs should not be used as primary navigation.

---

# Activity Timeline

Activity timelines are important for:

```txt
Fans

Campaigns

Rewards

Integrations

Sponsors
```

They should show chronological events.

Examples:

```txt
Fan registered

Campaign answered

Reward redeemed

Integration failed

Sponsor campaign published
```

---

# Analytics UX

Analytics must be actionable.

Avoid dashboards that only display numbers.

Each analytics screen should help users answer:

```txt
What happened?

Why does it matter?

What should I do next?
```

---

# Empty States

Every module must have useful empty states.

Empty states should include:

```txt
Short explanation

Primary action

Optional example
```

Example:

```txt
No campaigns yet.

Create your first campaign to start engaging fans.
```

---

# Loading States

Loading states should preserve layout stability.

Prefer:

```txt
Skeletons

Inline loading

Table skeletons
```

Avoid full-screen loaders unless absolutely necessary.

---

# Error States

Errors should be:

```txt
Clear

Actionable

Recoverable when possible
```

Examples:

```txt
Retry

Contact Support

View Logs

Reconnect Integration
```

---

# Notifications

Dashboard notifications may include:

```txt
Integration Errors

Campaign Published

Reward Redemption Pending

Audience Sync Completed

EEP Sync Failed
```

Notifications should be useful, not noisy.

---

# Search

Search should evolve in stages.

## Phase 1

```txt
Module-level search
```

## Future

```txt
Global dashboard search
```

Global search may include:

```txt
Fans

Campaigns

Sponsors

Rewards

Content

Competitions
```

---

# Quick Create

A global quick create pattern may support:

```txt
Create Campaign

Create Fan

Create Reward

Create Benefit

Create Sponsor

Create Content
```

Quick create should respect permissions.

---

# Responsive Behavior

The dashboard is desktop-first.

Mobile support should prioritize:

```txt
Monitoring

Approvals

Quick Actions

Notifications
```

Complex workflows should remain desktop-optimized.

---

# Accessibility

The dashboard must support:

```txt
Keyboard Navigation

Focus States

Readable Contrast

Semantic Markup

Accessible Labels
```

Accessibility must not be treated as a final-stage improvement.

---

# Motion

Motion should feel:

```txt
Subtle

Premium

Cinematic

Purposeful
```

Use motion for:

```txt
Page transitions

Drawer transitions

Hover states

Microinteractions

Progressive reveal
```

Avoid:

```txt
Bouncy animation

Distracting movement

Overly playful transitions
```

---

# Visual System

The visual system should preserve:

```txt
Dark premium surfaces

Subtle glow

Soft borders

Layered depth

Clean spacing

Modern sports-tech aesthetics
```

Avoid:

```txt
Emoji icons

Bright playful colors

Unstructured gradients

Generic admin styling
```

---

# Module UX Notes

## Fans

Primary UX:

```txt
Directory

Profile Detail

Activity Timeline

Segments

Loyalty Status
```

---

## Campaigns

Primary UX:

```txt
Campaign Builder

Audience Targeting

Preview

Publish Flow

Results
```

---

## Loyalty

Primary UX:

```txt
Level Builder

Point Rules

Reward Catalog

Redemption Queue
```

---

## Sponsors

Primary UX:

```txt
Sponsor Directory

Activation Builder

Audience Targeting

Performance View
```

---

## Integrations

Primary UX:

```txt
Connection Status

Sync Logs

Errors

Retry Actions
```

---

# Success Criteria

Dashboard UX is successful when:

```txt
Users understand where to go

Users can complete key workflows quickly

Modules feel connected

Data is easy to scan

Actions are obvious

The experience feels premium and enterprise-grade
```

---

# Related Documents

- dashboard-information-architecture.md
- modules-catalog.md
- application-architecture.md
- system-architecture.md
- AGENTS.md