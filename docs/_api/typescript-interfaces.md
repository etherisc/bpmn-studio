---
layout: default
title: TypeScript Interfaces
parent: API Reference
nav_order: 1
permalink: /api/typescript-interfaces/
---

# TypeScript Interfaces
{: .no_toc }

Complete TypeScript interface definitions for MachineSpec v2.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Core Types

### StateValue and EventType

```typescript
export type StateValue = string;
export type EventType = string;
```

Basic type aliases for state and event identifiers.

### TransitionSpec

```typescript
export type TransitionSpec =
  | StateValue
  | {
      id?: string;                 // stable flow id
      target: StateValue;
      guard?: string;              // named policy
      actions?: string[];          // named side-effects
      condition?: string;          // optional expression (not enforced now)
    };
```

Represents a transition between states. Can be either:
- **Simple**: Just the target state name as a string
- **Complex**: Object with additional properties

### TimerSpec

```typescript
export interface TimerSpec {
  id: string;
  type: 'DURATION' | 'DATE';
  iso?: string;                    // when type === 'DURATION'
  at?: string;                     // when type === 'DATE'
  event: EventType;
}
```

Defines timer-based transitions with either duration or absolute date triggers.

### StateNode

```typescript
export interface StateNode {
  id?: string;                     // stable element id (task/end)
  type?: 'task' | 'end';           // we only use these two in v1
  on?: Record<EventType, TransitionSpec>;
  timers?: TimerSpec[];
  metadata?: Record<string, unknown>;
}
```

Represents a single state in the process with its transitions and timers.

### MachineSpec

```typescript
export interface MachineSpec {
  id: string;                      // process key
  version: number;                 // definition version
  initial: StateValue;
  metadata?: {
    documentation?: string;
    lanes?: Record<string, string[]>;  // lane -> [stateName,...]
  };
  states: Record<StateValue, StateNode>;
}
```

The root interface representing a complete process definition.

### ExportManifest

```typescript
export interface ExportManifest {
  id: string;
  version: number;
  exported_at: string;
  hashes: {
    bpmn: string;
    machine: string;
  };
  tool_version: string;
}
```

Metadata included in bundle exports for integrity verification.

## Usage Examples

### Creating a MachineSpec

```typescript
import { MachineSpec, StateNode, TransitionSpec } from './types/machine-spec';

const spec: MachineSpec = {
  id: 'quote',
  version: 1,
  initial: 'created',
  states: {
    created: {
      type: 'task',
      on: {
        SUBMIT: {
          target: 'submitted',
          actions: ['validateInput']
        }
      }
    },
    submitted: {
      type: 'task',
      on: {
        APPROVE: 'approved',
        REJECT: 'rejected'
      },
      timers: [{
        id: 'review_timeout',
        type: 'DURATION',
        iso: 'P7D',
        event: 'REVIEW_TIMEOUT'
      }]
    },
    approved: { type: 'end' },
    rejected: { type: 'end' }
  }
};
```

### Type Guards

```typescript
function isTaskState(state: StateNode): boolean {
  return state.type === 'task' || state.type === undefined;
}

function isEndState(state: StateNode): boolean {
  return state.type === 'end';
}

function isComplexTransition(transition: TransitionSpec): transition is object {
  return typeof transition === 'object';
}
```

### Validation

```typescript
function validateMachineSpec(spec: MachineSpec): string[] {
  const errors: string[] = [];
  
  // Check initial state exists
  if (!spec.states[spec.initial]) {
    errors.push(`Initial state '${spec.initial}' not found in states`);
  }
  
  // Check all transition targets exist
  Object.entries(spec.states).forEach(([stateName, state]) => {
    if (state.on) {
      Object.entries(state.on).forEach(([event, transition]) => {
        const target = typeof transition === 'string' ? transition : transition.target;
        if (!spec.states[target]) {
          errors.push(`Transition target '${target}' not found in states`);
        }
      });
    }
  });
  
  return errors;
}
```

## Integration Patterns

### State Machine Libraries

#### XState Integration

```typescript
import { createMachine } from 'xstate';
import { MachineSpec } from './types/machine-spec';

function machineSpecToXState(spec: MachineSpec) {
  return createMachine({
    id: spec.id,
    initial: spec.initial,
    states: Object.fromEntries(
      Object.entries(spec.states).map(([name, state]) => [
        name,
        {
          on: state.on || {},
          type: state.type === 'end' ? 'final' : undefined
        }
      ])
    )
  });
}
```

#### Custom State Machine

```typescript
class ProcessStateMachine {
  private spec: MachineSpec;
  private currentState: StateValue;
  
  constructor(spec: MachineSpec) {
    this.spec = spec;
    this.currentState = spec.initial;
  }
  
  transition(event: EventType): StateValue {
    const state = this.spec.states[this.currentState];
    const transition = state.on?.[event];
    
    if (!transition) {
      throw new Error(`No transition for event '${event}' from state '${this.currentState}'`);
    }
    
    const target = typeof transition === 'string' ? transition : transition.target;
    this.currentState = target;
    
    return target;
  }
  
  getCurrentState(): StateValue {
    return this.currentState;
  }
}
```

### File I/O

```typescript
import { MachineSpec } from './types/machine-spec';

// Load from file
async function loadMachineSpec(file: File): Promise<MachineSpec> {
  const content = await file.text();
  return JSON.parse(content) as MachineSpec;
}

// Save to file
function saveMachineSpec(spec: MachineSpec, filename: string): void {
  const content = JSON.stringify(spec, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}
```
