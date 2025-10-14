---
layout: default
title: API Reference
nav_order: 3
has_children: true
permalink: /api-reference/
---

# API Reference
{: .no_toc }

Technical documentation for developers integrating with the Process Editor.
{: .fs-6 .fw-300 }

## Available References

- **[TypeScript Interfaces](typescript-interfaces/)** - Complete type definitions for MachineSpec v2
- **[JSON Schema](json-schema/)** - Schema validation for MachineSpec format

## Integration Overview

The Process Editor generates **MachineSpec v2 JSON** that can be directly imported into your applications. The format is designed for:

- **State Machine Libraries**: XState, Robot, Machina.js
- **Workflow Engines**: Custom insurance process engines
- **Validation Systems**: Schema-based validation and type checking

## Usage Patterns

### Loading MachineSpec

```typescript
import { MachineSpec } from './types/machine-spec';

const spec: MachineSpec = JSON.parse(jsonString);
const stateMachine = createMachine(spec);
```

### Type Safety

Use the provided TypeScript interfaces for full type safety:

```typescript
import { State, Transition, Timer } from './types/machine-spec';

const state: State = {
  id: "task_created",
  type: "task",
  on: {
    APPROVE: {
      id: "flow_approve", 
      target: "approved"
    }
  }
};
```

### Schema Validation

Validate MachineSpec JSON against the provided schema:

```typescript
import Ajv from 'ajv';
import schema from './schema/machine-spec.v2.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

if (!validate(machineSpec)) {
  console.error('Invalid MachineSpec:', validate.errors);
}
```
