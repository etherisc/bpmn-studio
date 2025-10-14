---
layout: default
title: BPMN Elements Reference
parent: User Guide
nav_order: 3
permalink: /guides/bpmn-elements/
---

# BPMN Elements Reference
{: .no_toc }

Complete reference for supported BPMN elements and their usage in the Process Editor.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

The Process Editor supports a **restricted subset** of BPMN elements specifically designed for insurance process modeling. This ensures processes remain simple, deterministic, and compatible with the MachineSpec v2 format.

## Supported Elements

### Start Event

**Purpose**: Visual entry point for the process flow  
**BPMN Symbol**: ![Start Event]({{ site.baseurl }}/assets/images/start-event.png)

**Usage Rules**:
- Exactly **one Start Event** per diagram
- Must have **exactly one outgoing** Sequence Flow
- Can **only connect to Tasks**
- **No incoming** flows allowed

**Visual Only**: Start Events are not exported to MachineSpec JSON. The initial state is determined by finding the Task with no incoming flows.

**Example**:
```
[Start] → [Created Task]
```

### Task

**Purpose**: Represents a state where the process waits for events  
**BPMN Symbol**: ![Task]({{ site.baseurl }}/assets/images/task.png)

**Usage Rules**:
- Represents a **state** in the process
- Can have **multiple incoming** and **outgoing** flows
- Must have a **unique state name**

**Required Metadata**:
- `data-state-name`: State identifier (snake_case)
- `data-element-id`: Stable internal ID

**Optional Metadata**:
- `data-description`: Human-readable description

**Example**:
```json
{
  "data-state-name": "waiting_approval",
  "data-element-id": "task_approval",
  "data-description": "Waiting for manager approval"
}
```

### End Event

**Purpose**: Terminal state where the process completes  
**BPMN Symbol**: ![End Event]({{ site.baseurl }}/assets/images/end-event.png)

**Usage Rules**:
- Represents a **terminal state**
- Can have **multiple incoming** flows
- **No outgoing** flows allowed
- Process can have **multiple End Events**

**Required Metadata**:
- `data-element-id`: Stable internal ID

**Example**:
```
[Approved Task] → [Process Complete]
```

### Sequence Flow

**Purpose**: Represents transitions between states  
**BPMN Symbol**: ![Sequence Flow]({{ site.baseurl }}/assets/images/sequence-flow.png)

**Usage Rules**:
- Connects **Tasks** to **Tasks** or **End Events**
- Connects **Start Events** to **Tasks**
- Each flow from a state must have a **unique event name**

**Required Metadata**:
- `data-event`: Event name (UPPER_SNAKE_CASE)
- `data-flow-id`: Stable internal ID

**Optional Metadata**:
- `data-guard`: Guard function name
- `data-actions`: Comma-separated action names

**Example**:
```json
{
  "data-event": "APPROVE",
  "data-flow-id": "flow_approve",
  "data-guard": "isReviewer",
  "data-actions": "recordApproval,sendNotification"
}
```

### Boundary Timer

**Purpose**: Automatic transitions after time periods  
**BPMN Symbol**: ![Boundary Timer]({{ site.baseurl }}/assets/images/boundary-timer.png)

**Usage Rules**:
- **Only attaches to Tasks**
- Triggers automatic transitions
- Can be **duration-based** or **date-based**

**Required Metadata**:
- `data-timer-id`: Unique timer identifier
- `data-timer-type`: Either `DURATION` or `DATE`
- `data-event`: Event to trigger when timer expires

**Duration Timers** (relative time):
- `data-iso`: ISO 8601 duration (e.g., `P14D`, `PT2H30M`)

**Date Timers** (absolute time):
- `data-at`: ISO 8601 datetime (e.g., `2024-12-31T23:59:59Z`)

**Duration Example**:
```json
{
  "data-timer-id": "timer_collection",
  "data-timer-type": "DURATION",
  "data-iso": "P14D",
  "data-event": "COLLECTION_EXPIRED"
}
```

**Date Example**:
```json
{
  "data-timer-id": "timer_deadline",
  "data-timer-type": "DATE",
  "data-at": "2024-12-31T23:59:59Z",
  "data-event": "DEADLINE_REACHED"
}
```

### Lane

**Purpose**: Groups states by responsibility or role  
**BPMN Symbol**: ![Lane]({{ site.baseurl }}/assets/images/lane.png)

**Usage Rules**:
- **Optional** organizational element
- Groups related states
- Maps to metadata in MachineSpec

**Metadata**:
- Lane **label text** becomes the lane name

**Example**:
```json
{
  "metadata": {
    "lanes": {
      "Customer": ["created", "submitted"],
      "Reviewer": ["under_review", "approved"],
      "Finance": ["payment_pending", "paid"]
    }
  }
}
```

## Blocked Elements

The following BPMN elements are **not supported** and will trigger validation errors:

- **Gateways** (Exclusive, Parallel, Inclusive)
- **Intermediate Events** (Message, Signal, etc.)
- **Subprocesses**
- **Call Activities**
- **Data Objects**
- **Message Flows**
- **Associations**

## Validation Rules

### Element-Specific Rules

**Start Events**:
- Must have exactly one outgoing flow
- Cannot have incoming flows
- Can only connect to Tasks

**Tasks**:
- Must have `data-state-name` in snake_case
- State names must be unique within the process

**End Events**:
- Cannot have outgoing flows
- Must be reachable from the initial state

**Sequence Flows**:
- Must have `data-event` in UPPER_SNAKE_CASE
- Event names must be unique per source state

**Boundary Timers**:
- Can only attach to Tasks
- Must have valid ISO 8601 duration or datetime
- Must specify the event to trigger

### Process-Level Rules

- **Single Initial State**: Exactly one Task with no incoming flows
- **Deterministic Transitions**: No duplicate events from the same state
- **Connected Flow**: All states must be reachable from initial state
- **Unique IDs**: All element, flow, and timer IDs must be unique

## Best Practices

### Naming Conventions

- **State Names**: Use `snake_case` (e.g., `waiting_approval`, `payment_received`)
- **Event Names**: Use `UPPER_SNAKE_CASE` (e.g., `APPROVE`, `PAYMENT_RECEIVED`)
- **IDs**: Use descriptive prefixes (e.g., `task_approval`, `flow_submit`, `timer_deadline`)

### Process Design

- **Keep it Simple**: Use the minimum elements needed
- **Clear Flow**: Ensure obvious path from start to end
- **Meaningful Names**: Use business terminology
- **Document Complex Logic**: Add descriptions for complex states

### Timer Usage

- **Use Duration Timers** for relative deadlines (14 days from now)
- **Use Date Timers** for absolute deadlines (end of year)
- **Keep ISO Format**: Use standard ISO 8601 format for compatibility

## Common Patterns

### Linear Process
```
[Start] → [Created] → [Submitted] → [Approved] → [Complete]
```

### Branching Process
```
[Start] → [Review] → [Approved] → [Complete]
                  → [Rejected] → [Cancelled]
```

### Timer-Based Process
```
[Start] → [Waiting] ──(14 days)──→ [Expired]
             │
             └─[RESPOND]─→ [Responded]
```

### Multi-Lane Process
```
Customer Lane:  [Start] → [Created] → [Submitted]
                                         │
Reviewer Lane:                           └→ [Under Review] → [Approved]
                                                               │
Finance Lane:                                                  └→ [Payment] → [Complete]
```
