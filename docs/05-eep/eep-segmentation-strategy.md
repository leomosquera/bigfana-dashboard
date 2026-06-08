# BigFana EEP Segmentation Strategy

## Purpose

This document defines ownership and responsibilities for segmentation inside BigFana and EEP.

The objective is to avoid duplication of segmentation logic and establish a clear source of truth.

---

# Core Principle

BigFana owns:

```txt
Events

Fan Activity

Business Rules

Campaign Participation

Loyalty Data
```

EEP owns:

```txt
Segmentation

Scoring

Recommendations

Audience Generation

Profile Enrichment
```

---

# Ownership Model

## BigFana

Responsible for collecting:

```txt
Fan Events

Campaign Events

Reward Events

Content Events

Sponsor Events

Commerce Events
```

BigFana generates behavioral data.

---

## EEP

Responsible for transforming behavioral data into:

```txt
Segments

Audiences

Scores

Recommendations
```

EEP generates intelligence.

---

# Segments

## Definition

A segment is a logical classification of fans.

Examples:

```txt
Highly Engaged Fans

VIP Fans

Frequent Predictors

Inactive Fans

International Fans
```

---

## Ownership

```txt
EEP
```

---

## Database

BigFana stores only a local cache:

```txt
segments

fan_segments
```

---

# Audiences

## Definition

An audience is a group of fans available for activation.

Examples:

```txt
Fans Eligible For Reward

Fans Eligible For Campaign

Premium Members

Sponsor Target Audience
```

---

## Ownership

```txt
EEP
```

---

## Database

BigFana stores only:

```txt
audiences

fan_audiences
```

---

# fan_segment_rules

## Definition

Business rules created by administrators.

Examples:

```txt
Fans with more than 1000 points

Fans that participated in 5 campaigns

Fans from Mexico
```

---

## Ownership

```txt
BigFana
```

---

## Purpose

These rules define segmentation criteria.

They do not define actual segments.

---

# Relationship Between Rules and Segments

```txt
BigFana Rule
    ↓
EEP Processing
    ↓
Segment
    ↓
Audience
```

Example:

Rule:

Fans with more than 1000 points

↓

EEP

↓

VIP Fans Segment

↓

VIP Audience

````

---

# Future Direction

EEP remains the source of truth for:

```txt
Segments

Audiences

Scores

Recommendations
````

BigFana remains the source of truth for:

```txt
Events

Rules

Campaigns

Loyalty
```

---

# Related Documents

* eep-architecture.md
* physical-model-v1.md
* database-decisions-review.md
* ADR-003
