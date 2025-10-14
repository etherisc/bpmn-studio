---
layout: default
title: User Guide
nav_order: 2
has_children: true
permalink: /guides/
---

# User Guide
{: .no_toc }

Complete guides for using the Process Editor to create insurance process flows.
{: .fs-6 .fw-300 }

The Process Editor is designed specifically for modeling insurance processes using a restricted BPMN subset that maps directly to executable state machines.

## What You'll Learn

### Tutorials
- **[Getting Started](getting-started/)**: Create your first process flow
- **[Process Modeling](process-modeling/)**: Advanced techniques and best practices  

### Reference Documentation
- **[BPMN Elements Reference](bpmn-elements/)**: Complete guide to supported elements
- **[MachineSpec Reference](machinespec-reference/)**: JSON format specification
- **[Validation Reference](validation-reference/)**: Rules and error handling

### Legacy Reference
- **[MachineSpec Format](machinespec-format/)**: Understanding the JSON output format
- **[Validation Rules](validation-rules/)**: Complete reference for all validation rules

## Before You Begin

The Process Editor uses a **restricted BPMN subset** designed specifically for insurance processes:

- ✅ **Tasks** represent process states
- ✅ **End Events** represent terminal states
- ✅ **Sequence Flows** represent transitions between states
- ✅ **Boundary Timers** represent time-based transitions
- ✅ **Lanes** represent responsibility groupings

- ✅ **Start Events** represent visual entry points (visual only)

❌ **Gateways, Subprocesses** and other BPMN elements are not supported to ensure clean, deterministic process definitions.

## Key Concepts

### States vs Tasks
In the Process Editor, **Tasks represent states** in your process, not activities. Each task is a point where your process waits for an event to occur.

### Events vs Transitions  
**Sequence Flows represent transitions** triggered by events. Each flow must have an event name that triggers the transition.

### Initial State
The **initial state** is automatically determined as the Task with no incoming sequence flows. You don't need Start Events.

### Terminal States
**End Events** represent states where the process completes. They cannot have outgoing flows.

Ready to start? Begin with [Getting Started](getting-started/)!
