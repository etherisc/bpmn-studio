# Process Editor — Full Implementation Specification

**Purpose:**  
Create a **standalone visual editor** for defining insurance process flows.  
The editor produces **BPMN XML** and **MachineSpec v2 JSON** definitions that can be directly imported/exported by our main web application (React/Express/Postgres stack).  

---

## 🎯 Goals

- Visual BPMN-based editor (browser app, no backend).  
- Restrict modeling to a safe BPMN subset.  
- Attach insurance-specific metadata (state names, events, timers, guards, etc.).  
- Validate diagrams in real time using `bpmnlint` + custom rules.  
- Export/import **MachineSpec v2 JSON** compatible with the main app.  
- Prevent invalid operations through modeling rules.  
- Fully self-contained (can run locally via `npm start` or any static host).  

---

## 🧱 Architecture Overview

### Core dependencies
| Function | Library |
|-----------|----------|
| Diagram rendering/modeling | [`bpmn-js`](https://github.com/bpmn-io/bpmn-js) |
| Properties editing | [`bpmn-js-properties-panel`](https://github.com/bpmn-io/bpmn-js-properties-panel) |
| Validation | [`bpmnlint`](https://github.com/bpmn-io/bpmnlint) + [`bpmn-js-bpmnlint`](https://github.com/bpmn-io/bpmn-js-bpmnlint) |
| Interaction rules | Custom rules provider (extends `diagram-js` modeling rules) |
| Bundling | Vite or Webpack |
| Language | TypeScript (preferred) |

### File structure (recommended)
```
/src/
  main.ts
  ui/
    Toolbar.tsx
    ValidationPane.tsx
  editor/
    ModelerHost.ts
    PaletteLimiter.ts
    ContextPadLimiter.ts
    PropertiesBindings.ts
    LintingIntegration.ts
    RulesProvider.ts
  mapping/
    bpmnToSpec.ts
    specToBpmn.ts
  lib/
    files.ts
  types/
    machineSpec.ts
/assets/
  templates/blank.bpmn
  styles/editor.css
.bpmnlintrc
```

---

## ⚙️ Supported BPMN Subset

| Element | Use | Notes |
|----------|-----|-------|
| **Task** | Represents a state | Must have `data-state-name` |
| **End Event** | Terminal state | No outgoing flow |
| **Sequence Flow** | Transition | Must have `data-event` |
| **Boundary Timer** | Timer on a state | Must have `data-event` and ISO duration/date |
| **Lane** | Responsibility lane | Optional, maps to metadata |

All other BPMN elements (start events, gateways, subprocesses, etc.) are **disallowed** and must be blocked in the palette and linted as errors.

---

## 🧩 Metadata (stored as BPMN attributes)

| Element | Attribute | Purpose |
|----------|------------|----------|
| Task | `data-element-id` | Stable internal ID |
| Task | `data-state-name` | Key in MachineSpec |
| Task | `data-description` | Optional documentation |
| Sequence Flow | `data-event` | Command/event name (UPPER_SNAKE_CASE) |
| Sequence Flow | `data-flow-id` | Stable ID for transition |
| Sequence Flow | `data-guard` | Guard function name |
| Sequence Flow | `data-actions` | Comma-separated side-effect names |
| End Event | `data-element-id` | Stable ID |
| Boundary Timer | `data-timer-id` | Timer ID |
| Boundary Timer | `data-timer-type` | `DURATION` or `DATE` |
| Boundary Timer | `data-iso` | ISO-8601 duration |
| Boundary Timer | `data-at` | ISO datetime |
| Boundary Timer | `data-event` | Event to trigger |
| Lane | Label text | Lane name |

---

## 🖥️ UI Components

### 1. **Modeler Canvas**
- Embeds `bpmn-js` modeler instance.  
- Supports zoom/pan, keyboard shortcuts, undo/redo.

### 2. **Toolbar**
Actions:
- `New` – load blank template  
- `Open BPMN` – load `.bpmn` from file  
- `Save BPMN` – export `.bpmn`  
- `Export MachineSpec` – export `.machine.json`  
- `Import MachineSpec` – import `.machine.json` → regenerate BPMN  
- `Validate` – run lint + structure validation  
- `Bundle Export` – ZIP BPMN + JSON + manifest (with SHA256 + timestamp)  

### 3. **Properties Panel**
- Shows editable fields from the Metadata table above.  
- Simple validation (required, format checks).  
- Stores data as BPMN element `$attrs`.

### 4. **Validation Pane**
- Displays lint + structural errors/warnings.  
- Clicking an item highlights the offending element.  
- Disables Export buttons if any error is present.

---

## 🔍 Validation & Rules

### bpmnlint rules
Implement custom rules (each as separate JS module):

| Rule | Description |
|------|--------------|
| `subset-only` | Disallow unsupported BPMN elements |
| `single-initial-task` | Exactly one task with no incoming flow |
| `deterministic-transitions` | No duplicate event from same state |
| `terminal-no-outgoing` | End event cannot have outgoing flows |
| `timer-valid` | Timers must have ISO duration/date and event |
| `unique-ids` | All element/timer/flow IDs unique |
| `state-name-valid` | `data-state-name` required and valid pattern |

### Custom modeling rules (runtime)
A rules provider to:
- Block creation of unsupported elements.  
- Prevent outgoing connections from End Events.  
- Prevent attaching Boundary Timers to non-Tasks.  
- Disallow duplicate event names on outgoing flows of the same Task.

---

## 🔄 Import / Export Mapping

### BPMN → MachineSpec
1. Parse XML, traverse elements.  
2. Identify **initial** = Task with no incoming flow.  
3. For each Task or EndEvent → create `states[stateName]`.  
4. For each Sequence Flow → add transition under `on[event]`.  
5. For each Boundary Timer → add timer object to owning state.  
6. Map lanes → `metadata.lanes`.  
7. Build and validate MachineSpec JSON.  
8. Offer download.

### MachineSpec → BPMN
1. Create new diagram from blank template.  
2. Add Tasks/EndEvents per `states`.  
3. Draw Sequence Flows per `on[event]`.  
4. Attach Boundary Timers per `timers`.  
5. Group states into Lanes.  
6. Export to BPMN XML.

---

## 🧪 Validation before Export

1. One `initial` state exactly.  
2. All transitions target existing states.  
3. No duplicate `(state,event)` pairs.  
4. End states have no outgoing flows.  
5. Timers valid (syntax + placement).  
6. Unique IDs.

If any check fails, show message and block export.

---

## 📦 Output Format

### File bundle
```
process.bpmn
process.machine.json
manifest.json
```

### Manifest example
```json
{
  "id": "quote",
  "version": 1,
  "exported_at": "2025-10-13T10:00:00Z",
  "hashes": {
    "bpmn": "sha256-...",
    "machine": "sha256-..."
  },
  "tool_version": "1.0.0"
}
```

---

## 🧠 MachineSpec JSON Structure

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
        "APPROVE": { "id": "flow_approve", "target": "approved", "guard": "isReviewer" }
      }
    },
    "approved": {
      "on": {
        "READY_FOR_COLLECTION": { "target": "ready_for_collection" }
      },
      "timers": [
        { "id": "timer_collection", "type": "DURATION", "iso": "P14D", "event": "COLLECTION_EXPIRED" }
      ]
    },
    "ready_for_collection": {
      "on": {
        "PAY_FULL": { "target": "paid_full", "actions": ["recordPayment"] }
      }
    },
    "paid_full": {
      "on": {
        "CLAIM": { "target": "claimed" }
      }
    },
    "claimed": {
      "on": {
        "PAYOUT": { "target": "paid_out", "actions": ["recordPayout"] }
      }
    },
    "paid_out": { "type": "end" }
  }
}
```

---

## 🧰 Development Tasks

| # | Task | Definition of Done |
|---|------|--------------------|
| 1 | Setup project scaffold with Vite + bpmn-js | `npm run dev` serves working canvas, blank.bpmn loads |
| 2 | Add Toolbar + basic file I/O | Open/Save BPMN works |
| 3 | Restrict Palette & Context Pad | Only allowed subset visible; blocked elements cannot be added |
| 4 | Add Properties Panel | All metadata fields editable and stored in `$attrs` |
| 5 | Integrate bpmnlint | Live lint results; `.bpmnlintrc` ruleset |
| 6 | Implement Mapping (BPMN ↔ JSON) | Round-trip preserves all semantics |
| 7 | Add Custom Rules Provider | Illegal actions blocked during modeling |
| 8 | Export bundle + manifest | Zip download with valid hashes |
| 9 | Validation & QA | Test typical flows; ensure generated JSON imports cleanly into web app |

---

## ✅ Definition of Done (System Level)

- Editor runs standalone (`npm run dev` or static host).  
- UI functional: modeling, editing, validation, import/export all working.  
- Only supported BPMN elements exist in diagrams.  
- MachineSpec JSON conforms to schema and imports directly into web app.  
- No JS errors; bundle size < 5 MB compressed.  
- Documentation (`README.md`) included.  

---

## 🪜 Suggested Milestones

1. **M1:** Base modeler + file import/export  
2. **M2:** Palette restriction + properties panel  
3. **M3:** Linting + validation pane  
4. **M4:** JSON mapping (BPMN ↔ MachineSpec)  
5. **M5:** Custom rules provider  
6. **M6:** Final packaging + polish

---

## ⚖️ License & Attribution

Use libraries under their respective MIT licenses:  
- `bpmn-js`, `bpmn-js-properties-panel`, `bpmnlint` — © bpmn.io / Camunda Services GmbH.  
All custom code authored here under the same license.

---

## 📚 References

- **bpmn-js Examples:** <https://github.com/bpmn-io/bpmn-js-examples>  
- **bpmn-js-properties-panel:** <https://github.com/bpmn-io/bpmn-js-properties-panel>  
- **bpmnlint:** <https://github.com/bpmn-io/bpmnlint>  
- **bpmn-js-bpmnlint Integration Example:** see `bpmn-js-examples/linting`  
- **Custom Modeling Rules:** see `bpmn-js-examples/custom-modeling-rules`

---

## 🚀 Next Action for Codex

1. Initialize new repository `process-editor`.  
2. Scaffold app using this document as blueprint.  
3. Implement modules in order (Tasks 1–9).  
4. Confirm generated MachineSpec JSON passes the web app’s importer tests.  
5. Deliver final bundle + README.
