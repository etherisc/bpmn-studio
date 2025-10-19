# Process Editor Examples

This directory contains ready-to-use BPMN and MachineSpec examples for common insurance workflows.

## Available Examples

### 📋 **Simple Approval** (`simple-approval.*`)
- **Use Case**: Basic document or application approval
- **Features**: Submit → Review → Approve/Reject with 7-day timeout
- **Complexity**: ⭐ Beginner
- **Elements**: Tasks, End Events, Sequence Flows, Timer

### 💰 **Quote Process** (`quote-process.*`)
- **Use Case**: Insurance quote lifecycle management
- **Features**: Linear approval flow with collection timer
- **Complexity**: ⭐⭐ Intermediate
- **Elements**: Tasks, End Events, Flows, Timer, Guards, Actions

### 🏊 **Swimlane Process** (`swimlane-process.*`)
- **Use Case**: Multi-role insurance underwriting
- **Features**: Customer/Underwriter/System lanes with 30-day deadline
- **Complexity**: ⭐⭐⭐ Advanced
- **Elements**: Swimlanes, Multiple Tasks, Complex Flows, Timers

### ⏰ **Timer Workflow** (`timer-workflow.*`)
- **Use Case**: Payment processing with grace periods
- **Features**: Cascading timers (14D → 7D), multiple outcomes
- **Complexity**: ⭐⭐⭐ Advanced
- **Elements**: Multiple Timers, Complex Branching, Actions

## File Formats

Each example includes two files:

- **`.bpmn`** - BPMN XML diagram file (import with "Load BPMN")
- **`.machine.json`** - MachineSpec JSON file (import with "Import Spec")

## How to Use

### 1. Download Files
Right-click on any file link and select "Save As" to download.

### 2. Import into Editor
- **BPMN Files**: Use "Load BPMN" button in the toolbar
- **JSON Files**: Use "Import Spec" button in the toolbar

### 3. Customize
- Modify state names, event names, and timers for your use case
- Add or remove lanes based on your organization
- Adjust guard conditions and actions for your business logic

### 4. Export
- Use "Save BPMN" to export your customized diagram
- Use "Export Spec" to get the MachineSpec JSON for your application

## Contributing Examples

Have a useful process pattern? Consider contributing:

1. Create your process in the editor
2. Export both BPMN and MachineSpec files
3. Add documentation explaining the use case
4. Submit a pull request with your example

## Need Help?

- 📚 [Documentation](https://etherisc.github.io/bpmn-studio/)
- 🎯 [Live Demo](https://etherisc.github.io/bpmn-studio/app/)
- 🐛 [Issues](https://github.com/etherisc/bpmn-studio/issues)
- 💬 [Discussions](https://github.com/etherisc/bpmn-studio/discussions)


