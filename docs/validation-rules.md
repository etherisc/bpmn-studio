---
layout: default
title: Validation Rules (Legacy)
parent: User Guide
nav_order: 7
permalink: /validation-rules/
---

# Validation Rules Reference
{: .no_toc }

Complete reference for all validation rules enforced by the Process Editor.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

The Process Editor enforces **7 custom validation rules** to ensure process integrity and compatibility with the MachineSpec v2 format.

## Rule Reference

### subset-only

**Purpose**: Disallow unsupported BPMN elements

**Allowed Elements**:
- ✅ `bpmn:Task`
- ✅ `bpmn:EndEvent`
- ✅ `bpmn:SequenceFlow`
- ✅ `bpmn:BoundaryEvent` (Timer only)
- ✅ `bpmn:Lane`
- ✅ `bpmn:Participant`

**Error Example**:
```
Element type 'bpmn:StartEvent' is not allowed in this editor
```

**Fix**: Use only the allowed BPMN subset

---

### single-initial-task

**Purpose**: Exactly one task with no incoming flows

**Rule**: Process must have exactly one initial state

**Error Examples**:
```
Process must have exactly one initial task
Multiple initial tasks found
```

**Fix**: Ensure exactly one task has no incoming sequence flows

---

### deterministic-transitions

**Purpose**: No duplicate event names from the same state

**Rule**: Each outgoing flow from a state must have a unique event name

**Error Example**:
```
Duplicate event 'APPROVE' from state 'created'
```

**Fix**: Use unique event names for each outgoing flow from the same task

---

### terminal-no-outgoing

**Purpose**: End events cannot have outgoing flows

**Rule**: End events are terminal states

**Error Example**:
```
End Events cannot have outgoing flows
```

**Fix**: Remove outgoing flows from end events

---

### timer-valid

**Purpose**: Timers must have valid configuration

**Required Fields**:
- `data-timer-id`: Unique timer identifier
- `data-timer-type`: `DURATION` or `DATE`
- `data-event`: Event name to trigger

**Additional Requirements**:
- **DURATION timers**: Must have `data-iso` (ISO 8601 duration)
- **DATE timers**: Must have `data-at` (ISO datetime)

**Error Examples**:
```
Timer must have a timer ID
Invalid ISO 8601 duration format
Timer event name must be UPPER_SNAKE_CASE
```

**Fix**: Provide all required timer fields with valid formats

---

### unique-ids

**Purpose**: All element/timer/flow IDs must be unique

**Scope**: Checks across all elements in the process

**Error Example**:
```
Duplicate ID 'task_1' found
```

**Fix**: Ensure all IDs are unique across:
- Element IDs (`data-element-id`)
- Flow IDs (`data-flow-id`) 
- Timer IDs (`data-timer-id`)

---

### state-name-valid

**Purpose**: State names must follow snake_case pattern

**Rule**: `data-state-name` must be snake_case

**Valid Examples**:
- ✅ `created`
- ✅ `waiting_approval`
- ✅ `ready_for_collection`

**Invalid Examples**:
- ❌ `Created` (capital letter)
- ❌ `waiting-approval` (hyphen)
- ❌ `1created` (starts with number)

**Error Example**:
```
State name must be snake_case
```

**Fix**: Use lowercase letters, numbers, and underscores only

## Validation Workflow

### Real-time Validation

The editor validates continuously:
1. **On Element Creation**: Rules prevent invalid elements
2. **On Property Changes**: Fields are validated on input
3. **On Diagram Changes**: Full validation runs automatically

### Export Validation

Before export, the editor:
1. **Runs All Rules**: Complete validation check
2. **Blocks Export**: If any errors are found
3. **Shows Issues**: In the validation panel

### Validation Panel

The validation panel shows:
- **Error Count**: Red indicators for blocking issues
- **Warning Count**: Yellow indicators for non-blocking issues
- **Clickable Issues**: Click to highlight problematic elements
- **Auto-hide**: Hides when no issues found

## Best Practices

### Naming Conventions

Follow these patterns for consistency:

```typescript
// State names (snake_case)
const stateNames = [
  'created',
  'under_review', 
  'waiting_approval',
  'ready_for_collection'
];

// Event names (UPPER_SNAKE_CASE)  
const eventNames = [
  'SUBMIT',
  'APPROVE', 
  'REJECT',
  'COLLECTION_EXPIRED'
];

// IDs (descriptive prefixes)
const ids = [
  'task_created',
  'flow_approve', 
  'timer_collection',
  'end_completed'
];
```

### Process Structure

Ensure your process follows this pattern:

```
[Initial Task] → [Intermediate Tasks] → [End Event]
```

- **One entry point**: Single initial task
- **Clear flow**: Connected path to terminal states
- **No loops**: Linear or branching flows only
- **Deterministic**: Unique events from each state

### Error Prevention

Prevent common errors:

1. **Set State Names**: Always provide `data-state-name` for tasks
2. **Set Event Names**: Always provide `data-event` for flows
3. **Unique Events**: Don't reuse event names from the same state
4. **Complete Timers**: Provide all required timer fields
5. **Unique IDs**: Use descriptive, unique identifiers

## Troubleshooting

### Validation Not Running

If validation isn't working:
1. Check browser console for errors
2. Try the **"Validate"** button manually
3. Refresh the page to reset validation state

### False Positives

If you see incorrect validation errors:
1. Check element properties are set correctly
2. Verify BPMN XML structure is valid
3. Try exporting and re-importing the diagram

### Performance Issues

For large diagrams:
1. Validation runs on every change (2-second delay)
2. Complex rules may slow down the editor
3. Consider breaking large processes into smaller ones
