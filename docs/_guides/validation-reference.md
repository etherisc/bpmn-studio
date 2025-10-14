---
layout: default
title: Validation Reference
parent: User Guide
nav_order: 5
---

# Validation Reference
{: .no_toc }

Complete reference for validation rules and error handling in the Process Editor.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

The Process Editor uses **multi-layer validation** to ensure process integrity:

1. **Modeling Rules**: Prevent invalid operations during editing
2. **Linting Rules**: Real-time validation with detailed error messages
3. **Export Validation**: Final checks before generating MachineSpec JSON

## Modeling Rules (Runtime Prevention)

These rules **prevent invalid operations** during modeling and are enforced immediately:

### Element Creation Rules

**Start Events**:
- ✅ Can be created when no Start Event exists
- ❌ Cannot create multiple Start Events
- ❌ Cannot create if one already exists

**Tasks**:
- ✅ Can always be created
- ✅ Can be connected to any other element

**End Events**:
- ✅ Can always be created
- ✅ Multiple End Events allowed

**Boundary Timers**:
- ✅ Can attach to Tasks only
- ❌ Cannot attach to Start Events, End Events, or other elements

### Connection Rules

**From Start Events**:
- ✅ Can connect to Tasks
- ❌ Cannot connect to End Events
- ❌ Cannot have multiple outgoing connections
- ❌ Cannot have incoming connections

**From Tasks**:
- ✅ Can connect to Tasks
- ✅ Can connect to End Events
- ✅ Multiple outgoing connections allowed

**To End Events**:
- ✅ Can receive connections from Tasks
- ✅ Can receive connections from Start Events
- ❌ Cannot have outgoing connections

### Context Menu Rules

**Start Event Context Menu**:
- Shows "Append Task" only if no outgoing connection exists
- Shows "Connect" only if no outgoing connection exists
- Hides options when already connected

**Task Context Menu**:
- Shows all standard options (Append Task, Append End Event, etc.)
- Shows "Attach Boundary Timer" option

**End Event Context Menu**:
- Shows only "Connect" (for incoming connections)
- No append options (cannot have outgoing flows)

## Linting Rules (Real-time Validation)

These rules run continuously and show **detailed error messages**:

### subset-only

**Purpose**: Ensures only supported BPMN elements are used

**Validates**:
- No unsupported BPMN elements (gateways, intermediate events, etc.)
- Only allowed element types in the diagram

**Error Messages**:
- `"Element type 'bpmn:ExclusiveGateway' is not supported"`
- `"Remove unsupported elements from the diagram"`

**Resolution**: Remove or replace unsupported elements with supported alternatives

### single-initial-task

**Purpose**: Ensures exactly one initial state exists

**Validates**:
- Exactly one Task with no incoming Sequence Flows
- At least one Task exists in the diagram

**Error Messages**:
- `"No initial task found (task with no incoming flows)"`
- `"Multiple initial tasks found, only one allowed"`

**Resolution**: 
- Add a Task with no incoming flows
- Remove extra initial Tasks by adding incoming flows

### deterministic-transitions

**Purpose**: Prevents ambiguous transitions from the same state

**Validates**:
- No duplicate event names on outgoing flows from the same Task
- Each event name is unique per source Task

**Error Messages**:
- `"Duplicate event 'APPROVE' from task 'review_task'"`
- `"Each outgoing flow must have a unique event name"`

**Resolution**: Change event names to be unique (e.g., `APPROVE_MANAGER`, `APPROVE_SYSTEM`)

### terminal-no-outgoing

**Purpose**: Ensures End Events are truly terminal

**Validates**:
- End Events have no outgoing Sequence Flows
- End Events are properly terminal

**Error Messages**:
- `"End event cannot have outgoing flows"`
- `"Remove outgoing connections from end events"`

**Resolution**: Remove outgoing flows from End Events

### timer-valid

**Purpose**: Validates timer configuration and placement

**Validates**:
- Timers only attached to Tasks
- Valid ISO 8601 duration or datetime format
- Timer has associated event name

**Error Messages**:
- `"Timer must be attached to a Task"`
- `"Invalid ISO duration format: 'P14X'"`
- `"Timer must have an event name"`

**Resolution**:
- Move timer to a Task
- Fix ISO format (e.g., `P14D` for 14 days)
- Add event name in timer properties

### unique-ids

**Purpose**: Ensures all identifiers are unique

**Validates**:
- Element IDs are unique across the diagram
- Flow IDs are unique across the diagram
- Timer IDs are unique across the diagram

**Error Messages**:
- `"Duplicate element ID: 'task_review'"`
- `"Duplicate flow ID: 'flow_approve'"`
- `"Duplicate timer ID: 'timer_deadline'"`

**Resolution**: Change duplicate IDs to be unique

### state-name-valid

**Purpose**: Validates state naming conventions

**Validates**:
- Tasks have `data-state-name` attribute
- State names follow snake_case convention
- State names are unique within the process

**Error Messages**:
- `"Task must have a state name"`
- `"State name must be snake_case: 'WaitingApproval'"`
- `"Duplicate state name: 'waiting_approval'"`

**Resolution**:
- Add state name in properties panel
- Convert to snake_case (e.g., `waiting_approval`)
- Make state names unique

## Export Validation (Pre-Export Checks)

These rules run **before export** and block export if errors exist:

### Process Structure

**Initial State Validation**:
- Must have exactly one initial state
- Initial state must be reachable

**Terminal State Validation**:
- Must have at least one terminal state (End Event)
- All terminal states must be reachable from initial state

**Connectivity Validation**:
- All states must be connected to the main flow
- No orphaned elements (unreachable from initial state)

### Metadata Completeness

**Required Fields**:
- All Tasks must have `data-state-name`
- All Sequence Flows must have `data-event`
- All Timers must have complete configuration

**Format Validation**:
- State names must be valid identifiers
- Event names must be valid identifiers
- ISO formats must be parseable

### Semantic Consistency

**Event Uniqueness**:
- No duplicate events from the same state
- Event names follow naming conventions

**Timer Consistency**:
- Timer events don't conflict with flow events
- Timer configurations are valid

## Error Display and Resolution

### Error Severity Levels

**Error** (🔴):
- Blocks export functionality
- Must be resolved before proceeding
- Examples: Missing initial state, duplicate events

**Warning** (🟡):
- Allows export but indicates potential issues
- Should be reviewed and resolved
- Examples: Missing descriptions, unconventional naming

**Info** (🔵):
- Informational messages
- Suggestions for improvement
- Examples: Best practice recommendations

### Error Location

**Element Highlighting**:
- Click error in validation pane to highlight element
- Problematic elements shown with red border
- Tooltip shows error details

**Properties Panel Integration**:
- Invalid fields highlighted in properties panel
- Inline validation messages
- Real-time feedback as you type

### Common Error Patterns

#### "No initial state found"

**Cause**: No Task without incoming flows

**Solutions**:
1. Add a new Task at the beginning
2. Remove incoming flow from existing Task
3. Connect Start Event to first Task

#### "Duplicate event 'APPROVE'"

**Cause**: Multiple flows from same Task with same event name

**Solutions**:
1. Rename events to be specific (`APPROVE_MANAGER`, `APPROVE_SYSTEM`)
2. Combine flows if they should be the same transition
3. Use guards to differentiate conditions

#### "Invalid ISO duration 'P14X'"

**Cause**: Malformed ISO 8601 duration

**Solutions**:
1. Use correct format: `P14D` (14 days)
2. Check ISO 8601 reference for valid patterns
3. Use duration calculator tools

#### "State name must be snake_case"

**Cause**: State name doesn't follow naming convention

**Solutions**:
1. Convert to lowercase: `WaitingApproval` → `waiting_approval`
2. Replace spaces with underscores: `Waiting Approval` → `waiting_approval`
3. Remove special characters: `Waiting-Approval!` → `waiting_approval`

## Validation Configuration

### Custom Rule Configuration

The validation system can be configured via `.bpmnlintrc`:

```json
{
  "extends": "bpmnlint:recommended",
  "rules": {
    "subset-only": "error",
    "single-initial-task": "error",
    "deterministic-transitions": "error",
    "terminal-no-outgoing": "error",
    "timer-valid": "error",
    "unique-ids": "error",
    "state-name-valid": "error"
  }
}
```

### Rule Severity Levels

- `"error"`: Blocks export, shows as red
- `"warn"`: Allows export, shows as yellow
- `"off"`: Disables the rule

### Performance Considerations

**Large Diagrams**:
- Validation may be slower on diagrams with >50 elements
- Consider breaking complex processes into smaller ones

**Real-time Validation**:
- Debounced to avoid excessive validation calls
- Runs after 500ms of inactivity

## Best Practices for Validation

### Proactive Validation

1. **Design First**: Plan your process structure before modeling
2. **Validate Early**: Check validation pane regularly while modeling
3. **Fix Immediately**: Resolve errors as soon as they appear
4. **Test Round-trips**: Export and re-import to verify integrity

### Error Prevention

1. **Follow Conventions**: Use established naming patterns
2. **Use Templates**: Start from validated templates
3. **Incremental Building**: Add elements one at a time
4. **Regular Validation**: Check validation pane after each change

### Debugging Complex Errors

1. **Isolate Issues**: Temporarily remove elements to identify problems
2. **Check Dependencies**: Verify all referenced elements exist
3. **Validate Externally**: Use JSON schema validators for MachineSpec
4. **Use Version Control**: Compare with known-good versions

### Performance Optimization

1. **Minimize Elements**: Use only necessary BPMN elements
2. **Simplify Flows**: Avoid overly complex branching
3. **Batch Changes**: Make multiple related changes before validation
4. **Regular Cleanup**: Remove unused elements and flows
