# BigFana AI Development Workflow

## Purpose

This document defines how AI agents must execute implementation work inside the BigFana repository.

The objective is to ensure:

- consistency
- traceability
- documentation alignment
- database safety
- architectural compliance

AI agents must follow this workflow before implementing any change.

---

# Core Principle

AI agents must never implement code without understanding the current project state.

Implementation always starts with context acquisition.

---

# Mandatory Reading Order

Before starting any task, AI agents must read:

```txt
AGENTS.md

AI_RULES.md

PROJECT_STATE.md
```

---

## Architecture Context

Read:

```txt
docs/00-vision/

docs/01-business/

docs/02-product/

docs/03-architecture/
```

when relevant to the requested task.

---

## Database Tasks

For database-related work always read:

```txt
docs/04-database/current-schema.md

docs/04-database/gap-analysis.md

docs/04-database/foundation-db-v1.md

docs/04-database/physical-model-v1.md

docs/04-database/migration-plan-v1.md

docs/04-database/database-decisions-review.md
```

before generating SQL.

---

## EEP Tasks

Always read:

```txt
docs/05-eep/eep-architecture.md
```

before implementing EEP functionality.

---

## Dashboard Tasks

Always read:

```txt
docs/07-dashboard/dashboard-information-architecture.md

docs/07-dashboard/dashboard-ux-architecture.md

docs/07-dashboard/permission-matrix.md
```

before implementing UI.

---

# Task Execution Flow

Every implementation task must follow:

```txt
Understand

↓

Plan

↓

Implement

↓

Document

↓

Validate

↓

Commit
```

---

# Migration Workflow

When implementing a migration:

---

## Step 1

Identify migration from:

```txt
migration-plan-v1.md
```

---

## Step 2

Review dependencies:

```txt
physical-model-v1.md

database-decisions-review.md
```

---

## Step 3

Create migration file:

```txt
database/migrations/foundation-v1/
```

Example:

```txt
001_create_fan_organizations.sql
```

---

## Step 4

Update backlog status:

```txt
foundation-db-backlog.md
```

Example:

```txt
[ ] → [-]
```

---

## Step 5

Create session document:

```txt
docs/sessions/YYYY-MM-DD-description.md
```

---

## Step 6

Generate implementation summary.

---

## Step 7

Request approval before execution when required.

---

## Step 8

After successful execution:

Update:

```txt
current-schema.md

gap-analysis.md

foundation-db-backlog.md

PROJECT_STATE.md
```

---

## Step 9

Generate commit.

---

# Documentation Workflow

Whenever implementation changes project behavior:

Update documentation first.

Documentation is part of the product.

---

## Update Existing Documents

Always prefer:

```txt
Update Existing Document
```

instead of:

```txt
Create New Document
```

unless a new document is truly required.

---

# Session Workflow

Every significant work session must generate:

```txt
docs/sessions/YYYY-MM-DD-topic.md
```

---

## Session Structure

Include:

```txt
Goal

Completed Work

Decisions

Files Modified

Next Steps
```

---

# Database Rules

AI agents must never:

```txt
Drop Tables

Drop Columns

Delete Data

Rename Critical Structures
```

without explicit approval.

---

## Migration Strategy

Always follow:

```txt
Expand

↓

Migrate

↓

Contract
```

---

# Git Workflow

AI agents may generate commits.

---

## Commit Language

Use Spanish.

Examples:

```txt
feat: crea catálogo global de deportes

feat: crea relación fan_organizations

docs: actualiza modelo físico v1

refactor: adapta consultas al nuevo modelo de fans
```

---

## Commit Frequency

Create commits:

```txt
Per Goal

Per Migration

Per Feature

Per Refactor
```

Avoid giant commits.

---

# Branch Workflow

Never work directly on:

```txt
main
```

---

Preferred flow:

```txt
foundation-stable

↓

feature/*
```

Examples:

```txt
feature/foundation-db-v1

feature/loyalty-module

feature/eep-segments
```

---

# Pull Request Workflow

Before merging:

Validate:

```txt
Documentation

Architecture

Database

Permissions

EEP Impact
```

---

# Architecture Decisions

AI agents must never modify:

```txt
ADRs
```

without approval.

---

## If an ADR Conflict Appears

The AI must:

```txt
Stop

Explain Conflict

Propose Alternatives

Request Approval
```

---

# Project State Updates

Whenever a milestone is completed:

Update:

```txt
PROJECT_STATE.md
```

---

## Examples

```txt
Current Phase

Completed Migrations

Current Goal

Next Goal
```

---

# Knowledge Preservation

AI agents must preserve project knowledge.

Before creating new documentation:

```txt
Search Existing Documentation

Update Existing Source of Truth

Avoid Duplication
```

---

# Success Criteria

An implementation task is considered complete only when:

```txt
Code Implemented

Documentation Updated

Backlog Updated

Session Created

Validation Completed

Commit Generated
```

---

# Related Documents

- AGENTS.md
- AI_RULES.md
- PROJECT_STATE.md
- foundation-db-v1.md
- migration-plan-v1.md
- database-decisions-review.md