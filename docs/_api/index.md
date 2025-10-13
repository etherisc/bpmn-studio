---
layout: default
title: API Reference
nav_order: 4
has_children: true
---

# API Reference
{: .no_toc }

Technical documentation for developers integrating with the Process Editor.
{: .fs-6 .fw-300 }

## Overview

The Process Editor provides several APIs for integration:

- **TypeScript Interfaces**: Type definitions for MachineSpec v2
- **JSON Schema**: Validation schema for MachineSpec
- **Mapping Functions**: Convert between BPMN and MachineSpec
- **Validation Rules**: Custom bpmnlint rules

## Integration Points

### Web Application Integration

Import MachineSpec JSON into your web application:

```typescript
import { MachineSpec } from './types/machine-spec';

// Load MachineSpec from Process Editor
const spec: MachineSpec = await loadProcessDefinition();

// Use in your state machine library
const machine = createMachine(spec);
```

### Custom Validation

Extend validation with your own rules:

```typescript
import { ValidationRule } from './types/validation';

const customRule: ValidationRule = {
  check: (node, reporter) => {
    // Your validation logic
  }
};
```

### File Format Support

The editor supports these file formats:

| Format | Extension | Use Case |
|--------|-----------|----------|
| BPMN XML | `.bpmn` | Visual diagrams, tool interop |
| MachineSpec JSON | `.machine.json` | Application integration |
| Bundle ZIP | `.zip` | Complete export with manifest |
