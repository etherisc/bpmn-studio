---
layout: default
title: MachineSpec Reference
parent: User Guide
nav_order: 4
permalink: /guides/machinespec-reference/
---

# MachineSpec v2 Reference
{: .no_toc }

Complete reference for the MachineSpec v2 JSON format used by the Process Editor.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

MachineSpec v2 is a JSON format that describes finite state machines for insurance processes. The Process Editor generates this format from BPMN diagrams and can import it back to recreate the visual representation.

## Schema Structure

### Root Object

```json
{
  "id": "string",
  "version": 1,
  "initial": "string",
  "metadata": { ... },
  "states": { ... }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique process identifier |
| `version` | number | Yes | Schema version (always 1) |
| `initial` | string | Yes | Name of the initial state |
| `metadata` | object | No | Process metadata and documentation |
| `states` | object | Yes | State definitions |

### Metadata Object

```json
{
  "metadata": {
    "documentation": "string",
    "lanes": {
      "LaneName": ["state1", "state2"]
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentation` | string | No | Process description |
| `lanes` | object | No | Lane assignments for states |

### State Object

```json
{
  "states": {
    "state_name": {
      "id": "string",
      "type": "task" | "end",
      "on": { ... },
      "timers": [ ... ]
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Stable element identifier |
| `type` | string | No | State type (`task` or `end`) |
| `on` | object | No | Event transitions |
| `timers` | array | No | Timer definitions |

### Transition Object

```json
{
  "on": {
    "EVENT_NAME": {
      "id": "string",
      "target": "string",
      "guard": "string",
      "actions": ["string"]
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Stable flow identifier |
| `target` | string | Yes | Target state name |
| `guard` | string | No | Guard function name |
| `actions` | array | No | Action function names |

### Timer Object

```json
{
  "timers": [
    {
      "id": "string",
      "type": "DURATION" | "DATE",
      "iso": "string",
      "at": "string",
      "event": "string"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique timer identifier |
| `type` | string | Yes | Timer type (`DURATION` or `DATE`) |
| `iso` | string | Conditional | ISO 8601 duration (for `DURATION` type) |
| `at` | string | Conditional | ISO 8601 datetime (for `DATE` type) |
| `event` | string | Yes | Event to trigger when timer expires |

## Complete Example

```json
{
  "id": "insurance_quote",
  "version": 1,
  "initial": "created",
  "metadata": {
    "documentation": "Insurance quote lifecycle process",
    "lanes": {
      "Customer": ["created", "submitted"],
      "Reviewer": ["under_review", "approved", "rejected"],
      "Finance": ["payment_pending", "paid_full"]
    }
  },
  "states": {
    "created": {
      "id": "task_created",
      "type": "task",
      "on": {
        "SUBMIT": {
          "id": "flow_submit",
          "target": "submitted",
          "actions": ["validateSubmission"]
        }
      }
    },
    "submitted": {
      "id": "task_submitted",
      "type": "task",
      "on": {
        "START_REVIEW": {
          "id": "flow_start_review",
          "target": "under_review",
          "guard": "hasRequiredDocuments"
        }
      }
    },
    "under_review": {
      "id": "task_under_review",
      "type": "task",
      "on": {
        "APPROVE": {
          "id": "flow_approve",
          "target": "approved",
          "guard": "isReviewer",
          "actions": ["recordApproval", "sendNotification"]
        },
        "REJECT": {
          "id": "flow_reject",
          "target": "rejected",
          "guard": "isReviewer",
          "actions": ["recordRejection", "sendRejectionNotice"]
        },
        "REVIEW_TIMEOUT": {
          "id": "flow_timeout",
          "target": "rejected",
          "actions": ["recordTimeout"]
        }
      },
      "timers": [
        {
          "id": "timer_review_deadline",
          "type": "DURATION",
          "iso": "P7D",
          "event": "REVIEW_TIMEOUT"
        }
      ]
    },
    "approved": {
      "id": "task_approved",
      "type": "task",
      "on": {
        "REQUEST_PAYMENT": {
          "id": "flow_request_payment",
          "target": "payment_pending",
          "actions": ["generateInvoice", "sendPaymentRequest"]
        }
      }
    },
    "rejected": {
      "id": "end_rejected",
      "type": "end"
    },
    "payment_pending": {
      "id": "task_payment_pending",
      "type": "task",
      "on": {
        "PAY_FULL": {
          "id": "flow_pay_full",
          "target": "paid_full",
          "actions": ["recordPayment", "activatePolicy"]
        },
        "PAYMENT_EXPIRED": {
          "id": "flow_payment_expired",
          "target": "payment_expired"
        }
      },
      "timers": [
        {
          "id": "timer_payment_deadline",
          "type": "DURATION",
          "iso": "P30D",
          "event": "PAYMENT_EXPIRED"
        }
      ]
    },
    "paid_full": {
      "id": "end_paid_full",
      "type": "end"
    },
    "payment_expired": {
      "id": "end_payment_expired",
      "type": "end"
    }
  }
}
```

## Validation Rules

### Schema Validation

- **Required Fields**: All required fields must be present
- **Type Validation**: Fields must match expected types
- **Version**: Must be exactly `1`

### Semantic Validation

- **Initial State**: Must reference an existing state
- **Target States**: All transition targets must exist
- **Unique IDs**: All element, flow, and timer IDs must be unique
- **Deterministic**: No duplicate events from the same state
- **Reachability**: All states must be reachable from initial state

### Timer Validation

- **Duration Format**: ISO 8601 duration (e.g., `P14D`, `PT2H30M`)
- **Date Format**: ISO 8601 datetime with timezone (e.g., `2024-12-31T23:59:59Z`)
- **Event Names**: Must follow UPPER_SNAKE_CASE convention

### Naming Conventions

- **State Names**: snake_case (e.g., `waiting_approval`)
- **Event Names**: UPPER_SNAKE_CASE (e.g., `APPROVE`)
- **IDs**: Descriptive with prefixes (e.g., `task_approval`, `flow_submit`)

## Import/Export Behavior

### BPMN to MachineSpec

1. **Initial State**: Task with no incoming flows becomes `initial`
2. **States**: Tasks and End Events become state objects
3. **Transitions**: Sequence Flows become `on` events
4. **Timers**: Boundary Timers become timer objects
5. **Lanes**: Lane assignments become `metadata.lanes`

### MachineSpec to BPMN

1. **Start Event**: Automatically created, connects to initial state
2. **Tasks**: Created for each non-end state
3. **End Events**: Created for each end-type state
4. **Flows**: Created for each transition
5. **Timers**: Attached as boundary events to tasks
6. **Lanes**: States grouped by lane assignments

### Round-Trip Compatibility

The Process Editor ensures **round-trip compatibility**:
- Export BPMN → Generate MachineSpec → Import → Recreate identical BPMN
- All metadata, IDs, and structure preserved
- Visual layout may change but semantic meaning remains

## Integration with Applications

### Loading MachineSpec

```typescript
import { MachineSpec } from './types/machine-spec';

// Load from JSON file
const spec: MachineSpec = JSON.parse(jsonString);

// Validate schema
if (spec.version !== 1) {
  throw new Error('Unsupported MachineSpec version');
}

// Use in your application
const stateMachine = createMachine(spec);
```

### Generating Events

```typescript
// Event names from MachineSpec
const events = Object.keys(spec.states[currentState].on || {});

// Trigger transition
stateMachine.send('APPROVE');
```

### Implementing Guards

```typescript
const guards = {
  isReviewer: (context, event) => {
    return context.user.role === 'reviewer';
  },
  hasRequiredDocuments: (context, event) => {
    return context.documents.length > 0;
  }
};
```

### Implementing Actions

```typescript
const actions = {
  recordApproval: (context, event) => {
    console.log('Recording approval:', event);
    // Implementation here
  },
  sendNotification: (context, event) => {
    console.log('Sending notification');
    // Implementation here
  }
};
```

## Best Practices

### Design Principles

- **Keep States Focused**: Each state should represent a clear business condition
- **Use Meaningful Names**: State and event names should be self-documenting
- **Minimize Complexity**: Avoid deeply nested or overly complex flows
- **Document Intent**: Use descriptions and lane assignments for clarity

### Performance Considerations

- **State Count**: Keep under 50 states for optimal performance
- **Timer Count**: Limit timers per state (recommended: max 3)
- **Action Count**: Keep action lists short and focused

### Maintenance

- **Version Control**: Track changes to MachineSpec files
- **Testing**: Validate round-trip compatibility regularly
- **Documentation**: Maintain external documentation for complex processes
- **Backup**: Keep both BPMN and JSON versions for redundancy
