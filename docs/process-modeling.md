---
layout: default
title: Process Modeling
parent: User Guide
nav_order: 2
permalink: /process-modeling/
---

# Process Modeling Guide
{: .no_toc }

Advanced techniques for modeling insurance processes with the Process Editor.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Process Design Principles

### State-Based Modeling

The Process Editor uses a **state-based approach** where:
- **Tasks represent states** where the process waits
- **Events trigger transitions** between states
- **Guards control access** to transitions
- **Actions execute side effects** during transitions

### Deterministic Flows

Every process must be **deterministic**:
- Each state can only have **one transition per event**
- No ambiguous paths or race conditions
- Clear initial and terminal states

## Advanced Modeling Techniques

### Using Guards

Guards control when transitions can occur:

```json
{
  "on": {
    "APPROVE": {
      "target": "approved",
      "guard": "isReviewer"
    }
  }
}
```

**Best Practices:**
- Use descriptive guard names (`isReviewer`, `hasValidPayment`)
- Keep guards simple and testable
- Document guard logic in your application

### Using Actions

Actions execute side effects during transitions:

```json
{
  "on": {
    "PAY": {
      "target": "paid",
      "actions": ["recordPayment", "sendReceipt", "updateInventory"]
    }
  }
}
```

**Best Practices:**
- Use action names that describe what happens
- Keep actions atomic and idempotent
- Order actions by dependency (if any)

### Timer Events

Timers trigger automatic transitions after time periods:

#### Duration Timers
Use for relative time periods:
- **P14D** - 14 days
- **PT2H30M** - 2 hours 30 minutes
- **P1M** - 1 month

#### Date Timers
Use for absolute deadlines:
- **2024-12-31T23:59:59Z** - End of year
- **2024-06-15T09:00:00Z** - Specific date/time

### Responsibility Lanes

Use lanes to group states by responsibility:

```json
{
  "metadata": {
    "lanes": {
      "Customer": ["created", "submitted"],
      "Reviewer": ["under_review", "approved"],
      "Finance": ["payment_pending", "paid"]
    }
  }
}
```

## Common Patterns

### Approval Workflow

```
submitted → [SUBMIT] → under_review → [APPROVE/REJECT] → approved/rejected
```

**Key features:**
- Initial state: `submitted`
- Review state with timer: `under_review` (P7D timeout)
- Multiple outcomes: `approved` or `rejected`
- Guard-protected reviewer actions

**📄 Download Example:**
- [simple-approval.bpmn]({{ site.baseurl }}/examples/simple-approval.bpmn) - Complete BPMN diagram
- [simple-approval.machine.json]({{ site.baseurl }}/examples/simple-approval.machine.json) - MachineSpec JSON

### Quote Lifecycle Process

```
created → [APPROVE] → approved → [READY] → ready_for_collection → [PAY] → paid_full
```

**Key features:**
- Linear progression through approval stages
- Collection timer with expiration (P14D)
- Action on payment: `recordPayment`
- Guard conditions for reviewer access

**📄 Download Example:**
- [quote-process.bpmn]({{ site.baseurl }}/examples/quote-process.bpmn) - Complete BPMN diagram
- [quote-process.machine.json]({{ site.baseurl }}/examples/quote-process.machine.json) - MachineSpec JSON

### Swimlane Organization

```
Customer:    create_quote → submit_documents
Underwriter: review_application → calculate_premium  
System:      policy_issued / application_rejected
```

**Key features:**
- Clear role separation with swimlanes
- Cross-lane transitions
- 30-day review deadline timer
- Multiple end states for different outcomes

**📄 Download Example:**
- [swimlane-process.bpmn]({{ site.baseurl }}/examples/swimlane-process.bpmn) - Complete BPMN diagram
- [swimlane-process.machine.json]({{ site.baseurl }}/examples/swimlane-process.machine.json) - MachineSpec JSON

### Timer-Based Workflow

```
waiting_payment → [PAY] → paid
                → [DEADLINE] → grace_period → [LATE_PAY] → paid
                                           → [EXPIRE] → expired
```

**Key features:**
- Multiple cascading timers (14D → 7D)
- Grace period handling
- Different actions for on-time vs late payment
- Automatic expiration after grace period

**📄 Download Example:**
- [timer-workflow.bpmn]({{ site.baseurl }}/examples/timer-workflow.bpmn) - Complete BPMN diagram
- [timer-workflow.machine.json]({{ site.baseurl }}/examples/timer-workflow.machine.json) - MachineSpec JSON

## Validation Best Practices

### Required Fields

Always set these required fields:
- **Tasks**: `data-state-name` (snake_case)
- **Sequence Flows**: `data-event` (UPPER_SNAKE_CASE)
- **Timers**: `data-timer-id`, `data-timer-type`, `data-event`

### Naming Conventions

Follow these conventions for consistency:
- **State Names**: `snake_case` (created, waiting_approval)
- **Event Names**: `UPPER_SNAKE_CASE` (APPROVE, SUBMIT)
- **IDs**: Descriptive prefixes (task_created, flow_approve, timer_deadline)

### Process Structure

Ensure your process has:
- **Exactly one initial state** (task with no incoming flows)
- **At least one terminal state** (end event)
- **Connected flow** from initial to terminal states
- **Unique event names** from each state

## Troubleshooting

### Common Validation Errors

**"No initial state found"**
- Add a task with no incoming sequence flows

**"Duplicate event from same state"**
- Each outgoing flow from a state must have a unique event name

**"State name must be snake_case"**
- Use lowercase letters, numbers, and underscores only

**"Event name must be UPPER_SNAKE_CASE"**
- Use uppercase letters, numbers, and underscores only

### Performance Tips

- **Keep processes focused**: Break complex processes into smaller ones
- **Use meaningful names**: Makes debugging easier
- **Document with descriptions**: Add context for future maintainers
- **Test round-trips**: Export and re-import to verify integrity
