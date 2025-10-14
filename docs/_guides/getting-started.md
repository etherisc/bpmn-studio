---
layout: default
title: Getting Started
parent: User Guide
nav_order: 1
permalink: /guides/getting-started/
---

# Getting Started
{: .no_toc }

Learn how to create your first insurance process flow with the Process Editor.
{: .fs-6 .fw-300 }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Opening the Editor

1. **Live Demo**: Visit [the live demo]({{ site.baseurl }}/app/) to start immediately
2. **Local Development**: Run `pnpm run dev` and open `http://localhost:3000`

## Creating Your First Process

### Step 1: Add the Initial Task

1. From the **palette** (left side), drag a **Task** onto the canvas
2. This task will automatically become your **initial state** (since it has no incoming flows)
3. Click the task to select it and view its properties in the **Properties Panel** (right side)

### Step 2: Set Task Properties

In the Properties Panel, configure:
- **State Name**: Use snake_case format (e.g., `created`, `waiting_approval`)
- **Element ID**: Unique identifier (e.g., `task_created`)
- **Description**: Optional documentation

### Step 3: Add More States

1. **Right-click** your first task
2. Choose **"Append Task"** to add a connected task, or
3. Choose **"Append End Event"** to add a terminal state
4. The connection (sequence flow) is created automatically

### Step 4: Configure Transitions

1. **Click a sequence flow** (the arrow between elements)
2. In the Properties Panel, set:
   - **Event Name**: UPPER_SNAKE_CASE (e.g., `APPROVE`, `SUBMIT`)
   - **Flow ID**: Unique identifier (e.g., `flow_approve`)
   - **Guard**: Optional guard function (e.g., `isReviewer`)
   - **Actions**: Comma-separated side effects (e.g., `recordPayment, sendEmail`)

### Step 5: Add Timers (Optional)

1. **Right-click a task**
2. Choose **"Add Timer Boundary Event"**
3. Configure the timer in Properties Panel:
   - **Timer ID**: Unique identifier
   - **Timer Type**: Choose `DURATION` or `DATE`
   - **ISO Duration**: For duration timers (e.g., `P14D` for 14 days)
   - **At DateTime**: For date timers (ISO format)
   - **Timer Event**: Event to trigger when timer fires

## Example: Simple Quote Process

Let's create a basic insurance quote process:

1. **Create Task**: `created` (initial state)
2. **Append Task**: `approved` 
3. **Append End Event**: `completed`
4. **Configure Flows**:
   - `created` → `approved`: Event `APPROVE`, Guard `isReviewer`
   - `approved` → `completed`: Event `COMPLETE`
5. **Add Timer**: 14-day timer on `approved` task for `COLLECTION_EXPIRED`

## Validation

The editor validates your process in real-time:

- **Green**: No issues found
- **Yellow Warning**: Non-critical issues
- **Red Error**: Must be fixed before export

Common validation rules:
- Exactly one initial task (no incoming flows)
- All tasks must have state names
- Event names must be UPPER_SNAKE_CASE
- No duplicate events from the same state
- End events cannot have outgoing flows

## Saving Your Work

### Auto-save
- **Automatic**: Saves to browser localStorage every 2 seconds after changes
- **Persistent**: Survives page reloads and browser restarts
- **Visual Feedback**: Shows "Auto-saved" notifications

### Manual Export
- **Save BPMN**: Export as `.bpmn` XML file
- **Export MachineSpec**: Export as `.machine.json` for your web application
- **Bundle Export**: ZIP package with BPMN + JSON + manifest

## Next Steps

- [Process Modeling Guide]({{ site.baseurl }}/guides/process-modeling/) - Advanced modeling techniques
- [MachineSpec Format]({{ site.baseurl }}/guides/machinespec-format/) - Understanding the JSON output
- [Validation Rules]({{ site.baseurl }}/guides/validation-rules/) - Complete rule reference
