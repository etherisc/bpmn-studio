/**
 * Simple properties provider for insurance process metadata
 * Compatible with bpmn-js-properties-panel
 */

export class ProcessPropertiesProvider {
  static $inject = ['eventBus', 'modeling'];

  constructor(
    private eventBus: any, 
    private modeling: any
  ) {
    this.init();
  }

  init(): void {
    // Create a simple properties panel in the DOM
    this.createPropertiesPanel();
    
    // Listen for selection changes
    this.eventBus.on('selection.changed', (event: any) => {
      this.updatePropertiesPanel(event.newSelection);
    });
  }

  private createPropertiesPanel(): void {
    const container = document.querySelector('#properties-panel');
    if (!container) return;

    container.innerHTML = `
      <div class="properties-panel-content">
        <div id="properties-content">
          <p>Select an element to edit its properties</p>
        </div>
      </div>
    `;
  }

  private updatePropertiesPanel(selection: any[]): void {
    const container = document.querySelector('#properties-content');
    if (!container || selection.length === 0) {
      if (container) {
        container.innerHTML = '<p>Select an element to edit its properties</p>';
      }
      return;
    }

    const element = selection[0];
    this.renderElementProperties(element, container);
  }

  private renderElementProperties(element: any, container: Element): void {
    let html = `<h3>Properties: ${element.type}</h3>`;

    if (this.isTask(element)) {
      html += this.createTaskProperties(element);
    } else if (this.isSequenceFlow(element)) {
      html += this.createSequenceFlowProperties(element);
    } else if (this.isBoundaryEvent(element)) {
      html += this.createBoundaryEventProperties(element);
    } else if (this.isEndEvent(element)) {
      html += this.createEndEventProperties(element);
    } else {
      html += '<p>No custom properties available for this element type.</p>';
    }

    container.innerHTML = html;
    this.attachEventListeners(element);
  }

  private isTask(element: any): boolean {
    return element.type === 'bpmn:Task';
  }

  private isSequenceFlow(element: any): boolean {
    return element.type === 'bpmn:SequenceFlow';
  }

  private isBoundaryEvent(element: any): boolean {
    return element.type === 'bpmn:BoundaryEvent';
  }

  private isEndEvent(element: any): boolean {
    return element.type === 'bpmn:EndEvent';
  }

  private createTaskProperties(element: any): string {
    const stateName = this.getProperty(element, 'data-state-name');
    const elementId = this.getProperty(element, 'data-element-id');
    const description = this.getProperty(element, 'data-description');

    return `
      <div class="property-group">
        <h3>Task Properties</h3>
        <div class="property-field">
          <label>State Name (snake_case)</label>
          <input type="text" id="state-name" value="${stateName}" placeholder="e.g., created, approved">
        </div>
        <div class="property-field">
          <label>Element ID</label>
          <input type="text" id="element-id" value="${elementId}" placeholder="e.g., task_created">
        </div>
        <div class="property-field">
          <label>Description</label>
          <textarea id="description" placeholder="Optional description">${description}</textarea>
        </div>
      </div>
    `;
  }

  private createSequenceFlowProperties(element: any): string {
    const eventName = this.getProperty(element, 'data-event');
    const flowId = this.getProperty(element, 'data-flow-id');
    const guard = this.getProperty(element, 'data-guard');
    const actions = this.getProperty(element, 'data-actions');

    return `
      <div class="property-group">
        <h3>Flow Properties</h3>
        <div class="property-field">
          <label>Event Name (UPPER_SNAKE_CASE)</label>
          <input type="text" id="event-name" value="${eventName}" placeholder="e.g., APPROVE, SUBMIT">
        </div>
        <div class="property-field">
          <label>Flow ID</label>
          <input type="text" id="flow-id" value="${flowId}" placeholder="e.g., flow_approve">
        </div>
        <div class="property-field">
          <label>Guard Function</label>
          <input type="text" id="guard" value="${guard}" placeholder="e.g., isReviewer">
        </div>
        <div class="property-field">
          <label>Actions (comma-separated)</label>
          <input type="text" id="actions" value="${actions}" placeholder="e.g., recordPayment, sendEmail">
        </div>
      </div>
    `;
  }

  private createBoundaryEventProperties(element: any): string {
    const timerId = this.getProperty(element, 'data-timer-id');
    const timerType = this.getProperty(element, 'data-timer-type');
    const iso = this.getProperty(element, 'data-iso');
    const at = this.getProperty(element, 'data-at');
    const event = this.getProperty(element, 'data-event');

    return `
      <div class="property-group">
        <h3>Timer Properties</h3>
        <div class="property-field">
          <label>Timer ID</label>
          <input type="text" id="timer-id" value="${timerId}" placeholder="e.g., timeout">
        </div>
        <div class="property-field">
          <label>Timer Type</label>
          <select id="timer-type">
            <option value="DURATION" ${timerType === 'DURATION' ? 'selected' : ''}>Duration</option>
            <option value="DATE" ${timerType === 'DATE' ? 'selected' : ''}>Date</option>
          </select>
        </div>
        <div class="property-field">
          <label>ISO Duration (e.g., P14D, PT2H30M)</label>
          <input type="text" id="iso-duration" value="${iso}" placeholder="P14D">
        </div>
        <div class="property-field">
          <label>At DateTime (ISO format)</label>
          <input type="text" id="at-datetime" value="${at}" placeholder="2024-12-31T23:59:59Z">
        </div>
        <div class="property-field">
          <label>Timer Event</label>
          <input type="text" id="timer-event" value="${event}" placeholder="e.g., TIMEOUT">
        </div>
      </div>
    `;
  }

  private createEndEventProperties(element: any): string {
    const elementId = this.getProperty(element, 'data-element-id');

    return `
      <div class="property-group">
        <h3>End Event Properties</h3>
        <div class="property-field">
          <label>Element ID</label>
          <input type="text" id="element-id" value="${elementId}" placeholder="e.g., end_completed">
        </div>
      </div>
    `;
  }

  private attachEventListeners(element: any): void {
    // Add event listeners for input changes
    const inputs = document.querySelectorAll('#properties-content input, #properties-content select, #properties-content textarea');
    
    inputs.forEach(input => {
      input.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        const attributeName = this.getAttributeNameFromId(target.id);
        if (attributeName) {
          this.setProperty(element, attributeName, target.value);
        }
      });
    });
  }

  private getAttributeNameFromId(id: string): string | null {
    const mapping: Record<string, string> = {
      'state-name': 'data-state-name',
      'element-id': 'data-element-id',
      'description': 'data-description',
      'event-name': 'data-event',
      'flow-id': 'data-flow-id',
      'guard': 'data-guard',
      'actions': 'data-actions',
      'timer-id': 'data-timer-id',
      'timer-type': 'data-timer-type',
      'iso-duration': 'data-iso',
      'at-datetime': 'data-at',
      'timer-event': 'data-event'
    };
    return mapping[id] || null;
  }

  private getProperty(element: any, propertyName: string): string {
    const businessObject = element.businessObject;
    return businessObject.get(propertyName) || '';
  }

  private setProperty(element: any, propertyName: string, value: string): void {
    // Update the element's business object properties
    this.modeling.updateProperties(element, {
      [propertyName]: value || undefined
    });
  }

  // Validation methods removed - handled by bpmnlint rules instead
}

// Export as a module for bpmn-js
export default {
  __init__: ['processPropertiesProvider'],
  processPropertiesProvider: ['type', ProcessPropertiesProvider]
};
