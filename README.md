# Process Editor

A standalone visual BPMN editor for defining insurance process flows. This editor produces BPMN XML and MachineSpec v2 JSON definitions that can be directly imported/exported by web applications.

## Features

- **Visual BPMN Editor**: Browser-based modeler with restricted BPMN subset
- **Insurance Process Support**: Custom metadata for states, events, timers, guards, and actions
- **Real-time Validation**: Live linting with custom rules for process integrity
- **Dual Export**: Generate both BPMN XML and MachineSpec v2 JSON
- **Bundle Export**: ZIP packages with BPMN, JSON, and manifest with SHA256 hashes
- **Self-contained**: No backend required, runs entirely in the browser

## Supported BPMN Elements

| Element | Use | Notes |
|---------|-----|-------|
| **Task** | Represents a state | Must have `data-state-name` |
| **End Event** | Terminal state | No outgoing flows allowed |
| **Sequence Flow** | Transition | Must have `data-event` |
| **Boundary Timer** | Timer on a state | Must have `data-event` and ISO duration/date |
| **Lane** | Responsibility lane | Optional, maps to metadata |

All other BPMN elements are blocked and will trigger validation errors.

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run tests
pnpm test

# Build for production
pnpm run build
```

### Usage

1. **Create Process**: Start with a blank template or import existing BPMN/MachineSpec
2. **Model Flow**: Add Tasks and End Events from the palette
3. **Connect States**: Use Sequence Flows to define transitions
4. **Add Metadata**: Use the Properties Panel to set state names, events, guards, actions
5. **Add Timers**: Attach Boundary Timer events to Tasks for time-based transitions
6. **Validate**: Use the Validate button to check for errors
7. **Export**: Save as BPMN XML, MachineSpec JSON, or complete bundle

## Validation Rules

The editor enforces these rules to ensure valid process definitions:

- **subset-only**: Only allowed BPMN elements can be used
- **single-initial-task**: Exactly one task with no incoming flows (initial state)
- **deterministic-transitions**: No duplicate events from the same state
- **terminal-no-outgoing**: End events cannot have outgoing flows
- **timer-valid**: Timers must have valid ISO duration/date and event names
- **unique-ids**: All element/timer/flow IDs must be unique
- **state-name-valid**: State names must be snake_case format

## MachineSpec v2 Format

The editor exports processes in MachineSpec v2 JSON format:

```json
{
  "id": "quote",
  "version": 1,
  "initial": "created",
  "metadata": {
    "documentation": "Insurance quote lifecycle",
    "lanes": {
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
      "on": {
        "READY_FOR_COLLECTION": { "target": "ready_for_collection" }
      },
      "timers": [{
        "id": "timer_collection",
        "type": "DURATION",
        "iso": "P14D",
        "event": "COLLECTION_EXPIRED"
      }]
    },
    "paid_full": { "type": "end" }
  }
}
```

## Architecture

### Core Components

- **ModelerHost**: Manages bpmn-js modeler instance and integrations
- **Toolbar**: File operations, validation, and export functionality
- **ValidationPane**: Real-time display of linting results
- **Properties Panel**: Metadata editing for selected elements

### Custom Modules

- **PaletteLimiter**: Restricts available BPMN elements in palette
- **ContextPadLimiter**: Limits context menu actions to valid operations
- **RulesProvider**: Prevents invalid modeling operations at runtime
- **PropertiesBindings**: Custom properties panel for insurance metadata
- **LintingIntegration**: Real-time validation with custom bpmnlint rules

### Mapping

- **BpmnToSpecMapper**: Converts BPMN XML to MachineSpec v2 JSON
- **SpecToBpmnMapper**: Converts MachineSpec v2 JSON to BPMN XML

## File Structure

```
src/
  main.ts                 # Application entry point
  ui/
    Toolbar.ts           # Main toolbar component
    ValidationPane.ts    # Validation results display
  editor/
    ModelerHost.ts       # Core modeler management
    PaletteLimiter.ts    # Palette restrictions
    ContextPadLimiter.ts # Context pad restrictions
    PropertiesBindings.ts # Custom properties panel
    LintingIntegration.ts # Validation integration
    RulesProvider.ts     # Runtime modeling rules
    validation/rules/    # Custom bpmnlint rules
  mapping/
    bpmnToSpec.ts        # BPMN → MachineSpec conversion
    specToBpmn.ts        # MachineSpec → BPMN conversion
  types/
    machine-spec.ts      # TypeScript interfaces
  lib/
    files.ts             # File utility functions
assets/
  templates/blank.bpmn   # Blank BPMN template
  styles/editor.css      # Application styles
schema/
  machine-spec.v2.json   # JSON schema for validation
```

## Browser Compatibility

- Modern browsers with ES2020 support
- Chrome 80+, Firefox 80+, Safari 14+, Edge 80+
- Requires WebCrypto API for SHA256 hashing

## License

MIT License - see individual library licenses for bpmn-js components.

## Dependencies

- **bpmn-js**: BPMN modeling and rendering
- **bpmn-js-properties-panel**: Properties editing
- **@bpmn-io/properties-panel**: Properties panel framework
- **bpmnlint**: BPMN validation engine
- **jszip**: ZIP file creation for bundles
- **ajv**: JSON schema validation
