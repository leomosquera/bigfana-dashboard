# BigFana — AI_RULES.md

## Purpose

This document defines mandatory operating rules for every AI agent working on BigFana.

AI agents are responsible for:

1. Implementing changes.
2. Preserving project context.
3. Updating documentation.
4. Registering architectural decisions.
5. Keeping future agents aligned.

A task is not complete until the affected documentation and project state are updated.

---

# Mandatory Reading Order

Before doing any work, every AI agent must read:

1. `AI_RULES.md`
2. `PROJECT_STATE.md`
3. `AGENTS.md`
4. Relevant ADRs in `docs/decisions/`
5. Relevant module documentation in `docs/`

Do not assume context that is not documented.

---

# Core Responsibilities

Every AI agent must:

1. Understand the requested task.
2. Identify affected modules.
3. Check existing documentation before proposing changes.
4. Avoid unnecessary refactors.
5. Preserve existing architecture.
6. Update documentation when the task changes product, architecture, database, EEP, dashboard, app, or roadmap.
7. Leave a clear next step.

---

# Knowledge Preservation Rules

BigFana is a long-term project.

AI agents must prioritize preserving knowledge over producing code quickly.

Before creating new documentation, check if an existing document should be updated instead.

Avoid duplicated documentation.

Every concept should have a single source of truth.

Whenever documentation becomes obsolete, update it instead of creating competing versions.

If documentation conflicts are detected:

1. Identify the source of truth.
2. Inform the user.
3. Propose consolidation.

Never allow the project knowledge to become fragmented.

---

# Do Not Install Dependencies Without Approval

The AI agent must not install:

- npm packages
- UI libraries
- SDKs
- database tools
- external services
- analytics tools

without explicit human approval.

If a dependency is needed, propose:

1. Package name.
2. Reason.
3. Alternatives.
4. Impact.
5. Risk.

Wait for approval before installing.

---

# Do Not Modify Database Without Approval

The AI agent must not create, alter, drop, or migrate database structures without explicit approval.

Before proposing a database change, provide:

1. Business reason.
2. Tables affected.
3. Fields affected.
4. Relationships affected.
5. Migration plan.
6. Rollback considerations.
7. Impact on EEP.
8. Impact on existing data.

After an approved database change, update:

- `docs/04-database/current-schema.md`
- `docs/04-database/domain-model.md`
- relevant module docs
- `PROJECT_STATE.md`

---

# Do Not Commit Automatically

The AI agent must not run `git commit`.

The AI agent may suggest commit messages.

The human developer is responsible for reviewing and committing.

Suggested commit messages should use English technical prefixes:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `chore:`

Example:

```txt
feat: add followed organizations model