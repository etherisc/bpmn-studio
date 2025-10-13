---
layout: default
title: Home
nav_order: 1
description: "Process Editor - Standalone visual BPMN editor for insurance process flows"
permalink: /
---

# Process Editor
{: .fs-9 }

A standalone visual BPMN editor for defining insurance process flows that produces BPMN XML and MachineSpec v2 JSON definitions.
{: .fs-6 .fw-300 }

[Try the Live Demo]({{ site.baseurl }}/app/){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[View on GitHub](https://github.com/etherisc/bpmn-studio){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## Features

- **Visual BPMN Editor**: Browser-based modeler with restricted BPMN subset
- **Insurance Process Support**: Custom metadata for states, events, timers, guards, and actions
- **Real-time Validation**: Live linting with custom rules for process integrity
- **Dual Export**: Generate both BPMN XML and MachineSpec v2 JSON
- **Bundle Export**: ZIP packages with BPMN, JSON, and manifest with SHA256 hashes
- **Auto-save**: Work is preserved across browser reloads
- **Self-contained**: No backend required, runs entirely in the browser

## Quick Start

### Try the Live Demo

The easiest way to get started is to try our [live demo]({{ site.baseurl }}/app/) hosted on GitHub Pages.

### Local Development

```bash
# Clone the repository
git clone https://github.com/etherisc/bpmn-studio.git
cd bpmn-studio

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Open http://localhost:3000
```

## Supported BPMN Elements

| Element | Use | Notes |
|---------|-----|-------|
| **Task** | Represents a state | Must have `data-state-name` |
| **End Event** | Terminal state | No outgoing flows allowed |
| **Sequence Flow** | Transition | Must have `data-event` |
| **Boundary Timer** | Timer on a state | Must have `data-event` and ISO duration/date |
| **Lane** | Responsibility lane | Optional, maps to metadata |

All other BPMN elements are blocked and will trigger validation errors.

## Architecture Overview

The Process Editor is built with:

- **Frontend**: TypeScript + Vite
- **BPMN Engine**: bpmn-js with custom modules
- **Validation**: Custom bpmnlint rules
- **Export**: BPMN XML and MachineSpec v2 JSON
- **Storage**: localStorage for auto-save

## Getting Help

- 📖 [User Guide]({{ site.baseurl }}/guides/) - Step-by-step tutorials
- 🔧 [API Reference]({{ site.baseurl }}/api/) - Technical documentation
- 🐛 [Issues](https://github.com/etherisc/bpmn-studio/issues) - Report bugs or request features
- 💬 [Discussions](https://github.com/etherisc/bpmn-studio/discussions) - Community support
