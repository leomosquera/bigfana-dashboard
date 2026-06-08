# BigFana Logical Model

## Purpose

This document translates the Domain Model into logical entities and relationships.

The goal is to define:

- business entities
- ownership boundaries
- relationships
- cardinalities

without defining physical database implementation details.

This document intentionally avoids:

- SQL definitions
- column types
- indexes
- constraints
- migrations

Those concerns belong to future database documentation.

---

# Logical Architecture Overview

```txt
Sport
    ↓
Competition
    ↓
Organization
    ↓
Campaign
    ↓
Fan Interaction

Fan
    ↓
Fan Organization
    ↓
Organization

Fan
    ↓
Events
    ↓
EEP
```

---

# Core Entities

## Sport

Represents a sport category.

Examples:

```txt
Football
Basketball
Rugby
Volleyball
Esports
```

Relationships:

```txt
Sport
    1:N
Competition
```

---

## Competition

Represents a league, tournament, championship, or organized ecosystem.

Examples:

```txt
Liga Profesional Argentina
La Liga
Premier League
NBA
Kings League
```

Relationships:

```txt
Competition
    N:1
Sport

Competition
    N:N
Organization

Competition
    1:N
Match

Competition
    1:N
Standing
```

---

## Organization

Represents a sports entity.

Examples:

```txt
River Plate
Boca Juniors
Real Madrid
Argentina National Team
Chicago Bulls
```

Relationships:

```txt
Organization
    N:N
Competition

Organization
    1:N
Campaign

Organization
    1:N
Benefit

Organization
    1:N
Reward

Organization
    1:N
Sponsor

Organization
    1:N
Content

Organization
    1:N
Loyalty Program
```

---

## Fan

Represents a platform-level sports fan.

Relationships:

```txt
Fan
    1:N
FanOrganization

Fan
    1:N
FanCompetition

Fan
    1:N
FanSport

Fan
    1:N
FanEvent

Fan
    1:N
Redemption
```

---

# Relationship Entities

## FanOrganization

Represents the relationship between a fan and an organization.

Examples:

```txt
Primary Organization

Followed Organization
```

Relationships:

```txt
Fan
    N:N
Organization
```

Responsibilities:

- relationship ownership
- primary organization
- followed organizations
- organization affinity

---

## FanCompetition

Represents competitions followed by a fan.

Relationships:

```txt
Fan
    N:N
Competition
```

Responsibilities:

- competition interests
- notifications
- personalization

---

## FanSport

Represents sports followed by a fan.

Relationships:

```txt
Fan
    N:N
Sport
```

Responsibilities:

- interests
- recommendations
- segmentation

---

# Loyalty Entities

## LoyaltyProgram

Represents an organization-owned loyalty program.

Relationships:

```txt
Organization
    1:N
LoyaltyProgram
```

Responsibilities:

- loyalty configuration
- point rules
- level rules

---

## FanPointsLedger

Represents all loyalty transactions.

Relationships:

```txt
Fan
    1:N
FanPointsLedger

Organization
    1:N
FanPointsLedger
```

Responsibilities:

- point accumulation
- point consumption
- audit history

---

## FanLevel

Represents loyalty levels.

Examples:

```txt
Bronze
Silver
Gold
Platinum
```

Relationships:

```txt
Organization
    1:N
FanLevel
```

---

# Engagement Entities

## Campaign

Represents a fan engagement initiative.

Examples:

```txt
Trivia
Survey
Prediction
Poll
Sponsor Activation
```

Relationships:

```txt
Organization
    1:N
Campaign
```

---

## CampaignQuestion

Represents a campaign question.

Relationships:

```txt
Campaign
    1:N
CampaignQuestion
```

---

## CampaignOption

Represents possible answers.

Relationships:

```txt
CampaignQuestion
    1:N
CampaignOption
```

---

## CampaignResponse

Represents fan participation.

Relationships:

```txt
Fan
    1:N
CampaignResponse

Campaign
    1:N
CampaignResponse
```

---

# Loyalty Value Entities

## Benefit

Represents a fan benefit.

Examples:

```txt
Discounts
Priority Access
Exclusive Experiences
```

Relationships:

```txt
Organization
    1:N
Benefit
```

---

## Reward

Represents redeemable assets.

Examples:

```txt
Merchandise
Tickets
Experiences
```

Relationships:

```txt
Organization
    1:N
Reward
```

---

## Redemption

Represents reward redemption.

Relationships:

```txt
Fan
    1:N
Redemption

Reward
    1:N
Redemption
```

---

# Sponsor Entities

## Sponsor

Represents a commercial partner.

Examples:

```txt
Nike
Adidas
Coca-Cola
```

Relationships:

```txt
Sponsor
    1:N
Advertisement

Sponsor
    N:N
Organization

Sponsor
    N:N
Competition
```

---

## Advertisement

Represents sponsor activations.

Relationships:

```txt
Sponsor
    1:N
Advertisement
```

---

# Content Entities

## Content

Represents informational content.

Examples:

```txt
News
Articles
Videos
Match Updates
```

Relationships:

```txt
Organization
    1:N
Content
```

---

# Competition Entities

## Match

Represents a sporting event.

Relationships:

```txt
Competition
    1:N
Match
```

---

## Standing

Represents rankings.

Relationships:

```txt
Competition
    1:N
Standing
```

---

# Behavioral Entities

## FanEvent

Represents a behavioral action.

Examples:

```txt
Login
Trivia Answer
Prediction
Content View
Reward Redemption
```

Relationships:

```txt
Fan
    1:N
FanEvent
```

Responsibilities:

- engagement tracking
- loyalty generation
- EEP synchronization

---

# Intelligence Entities

## Audience

Generated by EEP.

Consumed by BigFana.

Examples:

```txt
Highly Engaged Fans
European Football Fans
VIP Fans
```

Relationships:

```txt
EEP
    ↓
Audience
```

---

## Segment

Generated by EEP.

Consumed by BigFana.

Examples:

```txt
VIP
Casual
International
Sponsor Target
```

Relationships:

```txt
EEP
    ↓
Segment
```

---

# Integration Entities

## Integration

Represents an external platform connection.

Examples:

```txt
EEP
CRM
Commerce
Ticketing
ERP
Marketing Platforms
```

Relationships:

```txt
Organization
    1:N
Integration
```

---

## IntegrationJob

Represents synchronization work.

Examples:

```txt
Fan Sync
Campaign Sync
Audience Import
Reward Sync
```

Relationships:

```txt
Integration
    1:N
IntegrationJob
```

---

# Future Expansion

The logical model is intentionally designed to support future entities:

```txt
Season

Division

Tournament

Marketplace

Subscription

Membership

Collectibles

Fantasy Competitions

Platform Achievements
```

without requiring fundamental redesign.

---

# Related Documents

- domain-model.md
- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-002 Primary and Followed Organizations
- ADR-003 EEP Responsibilities
- ADR-004 Sports, Competitions and Organizations Model
- ADR-005 Managed vs Integrated Competitions
- ADR-006 Global Sports Community Vision