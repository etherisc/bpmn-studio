---
layout: default
title: Live Demo
nav_order: 5
---

# Process Editor - Live Demo
{: .no_toc }

Try the Process Editor directly in your browser.
{: .fs-6 .fw-300 }

<div style="border: 2px solid #e1e5e9; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f8f9fa;">
  <h3 style="margin-top: 0;">🚀 Launch Process Editor</h3>
  <p>The Process Editor runs entirely in your browser - no installation required!</p>
  <a href="{{ site.baseurl }}/app/" class="btn btn-primary btn-lg">Open Process Editor</a>
</div>

## What You Can Do

### ✅ Create Process Flows
- Add **Tasks** for process states
- Add **End Events** for terminal states  
- Connect with **Sequence Flows** for transitions
- Use **Global Connect Tool** to draw connections

### ✅ Add Insurance Metadata
- Set **State Names** (snake_case: `created`, `approved`)
- Define **Event Names** (UPPER_SNAKE_CASE: `APPROVE`, `SUBMIT`)
- Add **Guards** for access control (`isReviewer`, `hasPermission`)
- Specify **Actions** for side effects (`recordPayment`, `sendEmail`)

### ✅ Configure Timers
- Right-click tasks to **"Add Timer Boundary Event"**
- Set **Duration Timers** (P14D for 14 days)
- Set **Date Timers** (2024-12-31T23:59:59Z)
- Define **Timer Events** (TIMEOUT, DEADLINE_REACHED)

### ✅ Validate & Export
- **Real-time validation** shows errors/warnings
- **Export BPMN** for visual documentation
- **Export MachineSpec** for application integration
- **Bundle Export** for complete packages

## Auto-Save Feature

Your work is automatically saved to browser localStorage:
- ✅ **Auto-saves** every 2 seconds after changes
- ✅ **Survives** page reloads and browser restarts
- ✅ **Visual feedback** with save notifications
- ✅ **Manual controls** with "Save Now" and "Clear Auto-save" buttons

## Sample Process

Try creating this simple quote process:

1. **Add Task**: Name it `created` (initial state)
2. **Right-click** → **"Append Task"** → Name it `approved`
3. **Right-click** → **"Append End Event"** → This becomes `completed`
4. **Click the flows** and set events: `APPROVE` and `COMPLETE`
5. **Add timer** to `approved` task: P14D duration, COLLECTION_EXPIRED event

## Need Help?

- 📖 [Getting Started Guide]({{ site.baseurl }}/guides/getting-started/) - Step-by-step tutorial
- 🔧 [Process Modeling Guide]({{ site.baseurl }}/guides/process-modeling/) - Advanced techniques
- ❓ [Validation Rules]({{ site.baseurl }}/guides/validation-rules/) - Error reference

<div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
  <strong>💡 Tip:</strong> The editor works best in modern browsers (Chrome, Firefox, Safari, Edge). Make sure JavaScript is enabled.
</div>
