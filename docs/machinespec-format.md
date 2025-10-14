---
layout: default
title: MachineSpec Format (Legacy)
parent: User Guide
nav_order: 6
permalink: /machinespec-format/
---

# MachineSpec v2 Format
{: .no_toc }

Understanding the JSON format exported by the Process Editor.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

The Process Editor exports processes as **MachineSpec v2 JSON**, a format designed for executable state machines in insurance applications.

## Basic Structure

```json
{
  "id": "quote",
  "version": 1,
  "initial": "created",
  "metadata": { /* optional metadata */ },
  "states": { /* state definitions */ }
}
```

### Root Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Process identifier |
| `version` | number | ✅ | Definition version |
| `initial` | string | ✅ | Initial state name |
| `metadata` | object | ❌ | Process metadata |
| `states` | object | ✅ | State definitions |

## State Definitions

Each state in the `states` object represents a Task or End Event:

```json
{
  "states": {
    "created": {
      "id": "task_created",
      "type": "task",
      "on": { /* transitions */ },
      "timers": [ /* timer definitions */ ],
      "metadata": { /* custom data */ }
    },
    "completed": {
      "id": "end_completed", 
      "type": "end"
    }
  }
}
```

### State Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ❌ | Stable element ID |
| `type` | string | ❌ | `"task"` or `"end"` |
| `on` | object | ❌ | Event transitions |
| `timers` | array | ❌ | Timer definitions |
| `metadata` | object | ❌ | Custom state data |

## Transitions

Transitions define how the process moves between states:

```json
{
  "on": {
    "APPROVE": {
      "id": "flow_approve",
      "target": "approved",
      "guard": "isReviewer",
      "actions": ["recordApproval", "sendNotification"]
    },
    "REJECT": "rejected"
  }
}
```

### Transition Formats

**Simple Transition** (string):
```json
"COMPLETE": "completed"
```

**Complex Transition** (object):
```json
"APPROVE": {
  "id": "flow_approve",
  "target": "approved", 
  "guard": "isReviewer",
  "actions": ["recordApproval"]
}
```

### Transition Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `target` | string | ✅ | Target state name |
| `id` | string | ❌ | Stable flow ID |
| `guard` | string | ❌ | Guard function name |
| `actions` | array | ❌ | Side effect function names |
| `condition` | string | ❌ | Future: expression conditions |

## Timers

Timers trigger automatic transitions after time periods:

```json
{
  "timers": [
    {
      "id": "collection_timeout",
      "type": "DURATION",
      "iso": "P14D",
      "event": "COLLECTION_EXPIRED"
    },
    {
      "id": "deadline",
      "type": "DATE", 
      "at": "2024-12-31T23:59:59Z",
      "event": "DEADLINE_REACHED"
    }
  ]
}
```

### Timer Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique timer ID |
| `type` | string | ✅ | `"DURATION"` or `"DATE"` |
| `event` | string | ✅ | Event to trigger |
| `iso` | string | ⚠️ | ISO duration (required for DURATION) |
| `at` | string | ⚠️ | ISO datetime (required for DATE) |

### Duration Format (ISO 8601)

| Format | Description | Example |
|--------|-------------|---------|
| `PnD` | n days | `P14D` (14 days) |
| `PTnH` | n hours | `PT2H` (2 hours) |
| `PTnM` | n minutes | `PT30M` (30 minutes) |
| `PTnS` | n seconds | `PT45S` (45 seconds) |
| Combined | Multiple units | `P1DT2H30M` (1 day, 2 hours, 30 minutes) |

## Metadata

Optional metadata for documentation and tooling:

```json
{
  "metadata": {
    "documentation": "Insurance quote lifecycle process",
    "lanes": {
      "Customer": ["created", "submitted"],
      "Reviewer": ["under_review", "approved"], 
      "Finance": ["payment_pending", "paid"]
    }
  }
}
```

### Metadata Properties

| Property | Type | Description |
|----------|------|-------------|
| `documentation` | string | Process description |
| `lanes` | object | Responsibility groupings |

## Complete Example

Here's a complete MachineSpec for an insurance quote process:

```json
{
  "id": "quote",
  "version": 1,
  "initial": "created",
  "metadata": {
    "documentation": "Insurance quote lifecycle",
    "lanes": {
      "Customer": ["created"],
      "Reviewer": ["approved"],
      "Finance": ["ready_for_collection", "paid_full"]
    }
  },
  "states": {
    "created": {
      "id": "task_created",
      "type": "task",
      "on": {
        "APPROVE": {
          "id": "flow_approve",
          "target": "approved",
          "guard": "isReviewer"
        }
      }
    },
    "approved": {
      "id": "task_approved",
      "type": "task", 
      "on": {
        "READY_FOR_COLLECTION": {
          "target": "ready_for_collection"
        }
      },
      "timers": [
        {
          "id": "timer_collection",
          "type": "DURATION",
          "iso": "P14D",
          "event": "COLLECTION_EXPIRED"
        }
      ]
    },
    "ready_for_collection": {
      "id": "task_ready",
      "type": "task",
      "on": {
        "PAY_FULL": {
          "target": "paid_full",
          "actions": ["recordPayment"]
        }
      }
    },
    "paid_full": {
      "id": "end_paid",
      "type": "end"
    }
  }
}
```

This example shows:
- **4 states**: 3 tasks + 1 end event
- **3 transitions**: With different configurations
- **1 timer**: 14-day collection timeout
- **1 action**: Payment recording
- **1 guard**: Reviewer authorization
- **Lane organization**: By responsibility
