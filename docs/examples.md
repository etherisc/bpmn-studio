---
layout: default
title: Examples
nav_order: 4
permalink: /examples/
---

# Process Examples
{: .no_toc }

Ready-to-use BPMN and MachineSpec examples for common insurance workflows.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Quick Start Examples

### Simple Quote Process

A basic insurance quote lifecycle with approval workflow.

**Features:**
- Linear approval flow
- Guard conditions for reviewer access
- Timer-based collection expiration
- Action execution on payment

**Download:**
- [📄 quote-process.bpmn](../examples/quote-process.bpmn) - BPMN diagram file
- [📋 quote-process.machine.json](../examples/quote-process.machine.json) - MachineSpec JSON

**Use Case:** Basic insurance product quote and approval process.

---

### Simple Approval Workflow

A straightforward approval process with timeout handling.

**Features:**
- Submit → Review → Approve/Reject flow
- 7-day review timeout
- Guard-protected reviewer actions
- Multiple end states

**Download:**
- [📄 simple-approval.bpmn](../examples/simple-approval.bpmn) - BPMN diagram file
- [📋 simple-approval.machine.json](../examples/simple-approval.machine.json) - MachineSpec JSON

**Use Case:** Document approval, application review, or any binary decision process.

---

## Advanced Examples

### Swimlane Process

A comprehensive process demonstrating swimlane organization across different roles.

**Features:**
- **Customer Lane**: Quote creation and document submission
- **Underwriter Lane**: Application review and premium calculation  
- **System Lane**: Final policy issuance
- 30-day review deadline timer
- Multi-step approval workflow

**Download:**
- [📄 swimlane-process.bpmn](../examples/swimlane-process.bpmn) - BPMN diagram file
- [📋 swimlane-process.machine.json](../examples/swimlane-process.machine.json) - MachineSpec JSON

**Use Case:** Complex insurance underwriting with clear role separation.

---

### Timer Workflow

Advanced timer handling with multiple deadlines and grace periods.

**Features:**
- **Payment deadline**: 14-day timer for initial payment
- **Grace period**: 7-day extension for late payments
- **Multiple timer events**: Cascading timeouts
- **Action sequences**: Payment recording, receipts, late fees

**Download:**
- [📄 timer-workflow.bpmn](../examples/timer-workflow.bpmn) - BPMN diagram file
- [📋 timer-workflow.machine.json](../examples/timer-workflow.machine.json) - MachineSpec JSON

**Use Case:** Payment processing with flexible deadline management.

---

## How to Use Examples

### 1. Import BPMN Files

1. **Download** the `.bpmn` file
2. **Open** the Process Editor
3. **Click** "Load BPMN" in the toolbar
4. **Select** the downloaded file
5. **Edit** as needed for your use case

### 2. Import MachineSpec JSON

1. **Download** the `.machine.json` file  
2. **Open** the Process Editor
3. **Click** "Import Spec" in the toolbar
4. **Paste** the JSON content
5. **Click** "Import" to load the process

### 3. Export Your Own

After creating or modifying a process:

1. **Click** "Export Spec" to get MachineSpec JSON
2. **Click** "Save BPMN" to get the BPMN file
3. **Save** both files for version control
4. **Share** with your team or documentation

---

## Example Patterns

### Basic Linear Flow
```
created → [SUBMIT] → submitted → [APPROVE] → approved
```
- **Use for**: Simple approval processes
- **Example**: Document review, basic applications

### Branching Decision
```
review → [APPROVE] → approved
       → [REJECT] → rejected
```
- **Use for**: Binary decisions with different outcomes
- **Example**: Credit approval, risk assessment

### Timer with Fallback
```
waiting → [PAY] → paid
        → [TIMEOUT] → expired
```
- **Use for**: Time-sensitive processes
- **Example**: Payment deadlines, response timeouts

### Multi-Stage with Lanes
```
Customer: create → submit
Reviewer: review → approve
System:   issue → complete
```
- **Use for**: Cross-departmental processes
- **Example**: Insurance underwriting, loan processing

---

## Customization Tips

### Adapting Examples

1. **Change state names** to match your domain
2. **Update event names** for your business logic
3. **Modify timer durations** for your requirements
4. **Add/remove lanes** based on your organization
5. **Customize actions** for your system integration

### Best Practices

- **Start simple**: Begin with basic examples and add complexity
- **Test thoroughly**: Use the validation features to catch errors
- **Document well**: Add descriptions to your metadata
- **Version control**: Save both BPMN and JSON for each version
- **Team review**: Share examples with stakeholders for feedback

---

## Need More Examples?

Can't find what you need? Consider:

1. **Combining patterns** from multiple examples
2. **Starting with the closest match** and customizing
3. **Using the validation features** to ensure correctness
4. **Checking the [API Reference](../api-reference/)** for advanced features
5. **Contributing your examples** back to the project

The Process Editor's flexibility allows you to model virtually any insurance workflow using these foundational patterns! 🎯


