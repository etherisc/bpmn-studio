---
layout: default
title: JSON Schema
parent: API Reference
nav_order: 2
---

# MachineSpec v2 JSON Schema
{: .no_toc }

JSON Schema for validating MachineSpec v2 format.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Schema Location

The complete JSON Schema is available at:
- **File**: `schema/machine-spec.v2.json`
- **Schema ID**: `https://example.com/machine-spec.v2.schema.json`

## Usage

### JavaScript/TypeScript

```javascript
import Ajv from 'ajv';
import schema from './schema/machine-spec.v2.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

// Validate a MachineSpec
const spec = { /* your MachineSpec */ };
const valid = validate(spec);

if (!valid) {
  console.log('Validation errors:', validate.errors);
}
```

### Node.js

```javascript
const Ajv = require('ajv');
const fs = require('fs');

const schema = JSON.parse(fs.readFileSync('schema/machine-spec.v2.json', 'utf8'));
const ajv = new Ajv();
const validate = ajv.compile(schema);

function validateMachineSpec(spec) {
  const valid = validate(spec);
  return {
    valid,
    errors: validate.errors || []
  };
}
```

### Online Validation

You can also validate MachineSpec files using online JSON Schema validators:
1. Copy the schema from `schema/machine-spec.v2.json`
2. Copy your MachineSpec JSON
3. Use tools like [jsonschemavalidator.net](https://www.jsonschemavalidator.net/)

## Schema Structure

### Root Schema

```json
{
  "type": "object",
  "required": ["id", "version", "initial", "states"],
  "properties": {
    "id": { "type": "string", "minLength": 1 },
    "version": { "type": "integer", "minimum": 1 },
    "initial": { "type": "string", "minLength": 1 },
    "metadata": { /* metadata schema */ },
    "states": { /* states schema */ }
  }
}
```

### States Schema

```json
{
  "type": "object",
  "minProperties": 1,
  "additionalProperties": {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "type": { "enum": ["task", "end"] },
      "on": { /* transitions schema */ },
      "timers": { /* timers schema */ },
      "metadata": { "type": "object", "additionalProperties": true }
    }
  }
}
```

### Transitions Schema

```json
{
  "type": "object",
  "additionalProperties": {
    "oneOf": [
      { "type": "string", "minLength": 1 },
      {
        "type": "object",
        "required": ["target"],
        "properties": {
          "id": { "type": "string" },
          "target": { "type": "string", "minLength": 1 },
          "guard": { "type": "string" },
          "actions": {
            "type": "array",
            "items": { "type": "string", "minLength": 1 },
            "uniqueItems": true
          }
        }
      }
    ]
  }
}
```

### Timers Schema

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "type", "event"],
    "properties": {
      "id": { "type": "string", "minLength": 1 },
      "type": { "enum": ["DURATION", "DATE"] },
      "iso": { "type": "string" },
      "at": { "type": "string", "format": "date-time" },
      "event": { "type": "string", "minLength": 1 }
    },
    "allOf": [
      {
        "if": { "properties": { "type": { "const": "DURATION" } } },
        "then": { "required": ["iso"] }
      },
      {
        "if": { "properties": { "type": { "const": "DATE" } } },
        "then": { "required": ["at"] }
      }
    ]
  }
}
```

## Validation Examples

### Valid MachineSpec

```json
{
  "id": "quote",
  "version": 1,
  "initial": "created",
  "states": {
    "created": {
      "type": "task",
      "on": {
        "SUBMIT": "submitted"
      }
    },
    "submitted": {
      "type": "end"
    }
  }
}
```

### Invalid Examples

**Missing Required Fields**:
```json
{
  "id": "quote"
  // Missing: version, initial, states
}
```

**Invalid State Reference**:
```json
{
  "id": "quote",
  "version": 1,
  "initial": "nonexistent", // Error: state doesn't exist
  "states": {
    "created": { "type": "task" }
  }
}
```

**Invalid Timer Configuration**:
```json
{
  "timers": [{
    "id": "timer1",
    "type": "DURATION"
    // Missing: iso (required for DURATION), event
  }]
}
```

## Custom Validation

You can extend the schema for your specific needs:

```javascript
const customSchema = {
  ...baseSchema,
  properties: {
    ...baseSchema.properties,
    metadata: {
      type: 'object',
      properties: {
        ...baseSchema.properties.metadata.properties,
        customField: { type: 'string' }
      }
    }
  }
};
```
