/**
 * Naming service for automatic task naming and state name synchronization
 */

export class NamingService {
  private elementRegistry: any;
  private modeling: any;

  constructor(elementRegistry: any, modeling: any) {
    this.elementRegistry = elementRegistry;
    this.modeling = modeling;
  }

  /**
   * Generate next task name (Task 1, Task 2, etc.)
   */
  generateNextTaskName(): string {
    const allElements = this.elementRegistry.getAll();
    const taskElements = allElements.filter((el: any) => el.type === 'bpmn:Task');
    
    // Find highest number in existing "Task X" names
    let maxNumber = 0;
    taskElements.forEach((task: any) => {
      const name = task.businessObject.name || '';
      const match = name.match(/^Task (\d+)$/);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    return `Task ${maxNumber + 1}`;
  }

  /**
   * Generate next timer name (Timer 1, Timer 2, etc.)
   */
  generateNextTimerName(): string {
    const allElements = this.elementRegistry.getAll();
    const timerElements = allElements.filter((el: any) => 
      el.type === 'bpmn:BoundaryEvent' && 
      el.businessObject.eventDefinitions?.some((def: any) => def.$type === 'bpmn:TimerEventDefinition')
    );
    
    // Find highest number in existing "Timer X" names
    let maxNumber = 0;
    timerElements.forEach((timer: any) => {
      const name = timer.businessObject.name || '';
      const match = name.match(/^Timer (\d+)$/);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    return `Timer ${maxNumber + 1}`;
  }

  /**
   * Generate next flow name (Flow 1, Flow 2, etc.)
   */
  generateNextFlowName(): string {
    const allElements = this.elementRegistry.getAll();
    const flowElements = allElements.filter((el: any) => el.type === 'bpmn:SequenceFlow');
    
    // Find highest number in existing "Flow X" names
    let maxNumber = 0;
    flowElements.forEach((flow: any) => {
      const name = flow.businessObject.name || '';
      const match = name.match(/^Flow (\d+)$/);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    return `Flow ${maxNumber + 1}`;
  }

  /**
   * Convert BPMN name to snake_case state name
   */
  nameToSnakeCase(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .replace(/_+/g, '_'); // Replace multiple underscores with single
  }

  /**
   * Convert snake_case state name to Title Case BPMN name
   */
  snakeCaseToName(snakeCase: string): string {
    return snakeCase
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Convert Timer name to UPPER_SNAKE_CASE event name
   */
  timerNameToEventName(timerName: string): string {
    return timerName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }

  /**
   * Convert UPPER_SNAKE_CASE event name to Timer name
   */
  eventNameToTimerName(eventName: string): string {
    return eventName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Initialize a new task with auto-generated names
   */
  initializeTaskNames(element: any): void {
    const bpmnName = this.generateNextTaskName();
    const stateName = this.nameToSnakeCase(bpmnName);

    // Set BPMN name
    this.modeling.updateProperties(element, {
      name: bpmnName
    });

    // Set custom state name
    this.modeling.updateProperties(element, {
      'data-state-name': stateName
    });
  }

  /**
   * Initialize an end event with default state name
   */
  initializeEndEventNames(element: any): void {
    // Set default state name for end events
    this.modeling.updateProperties(element, {
      'data-state-name': 'end'
    });
  }

  /**
   * Initialize a boundary timer event with auto-generated names
   */
  initializeBoundaryTimerNames(element: any): void {
    const timerName = this.generateNextTimerName();
    const eventName = this.timerNameToEventName(timerName);

    // Set timer name
    this.modeling.updateProperties(element, {
      name: timerName
    });

    // Set timer event name
    this.modeling.updateProperties(element, {
      'data-event': eventName
    });

    // Set default timer type and duration
    this.modeling.updateProperties(element, {
      'data-timer-type': 'DURATION',
      'data-iso': 'P14D' // Default: 14 days
    });
  }

  /**
   * Initialize a sequence flow with auto-generated names
   */
  initializeSequenceFlowNames(element: any): void {
    const flowName = this.generateNextFlowName();
    const eventName = this.nameToUpperSnakeCase(flowName);

    // Set flow name
    this.modeling.updateProperties(element, {
      name: flowName
    });

    // Set event name
    this.modeling.updateProperties(element, {
      'data-event': eventName
    });
  }

  /**
   * Update BPMN name when state name changes
   */
  syncNameFromStateName(element: any, stateName: string): void {
    const bpmnName = this.snakeCaseToName(stateName);
    this.modeling.updateProperties(element, {
      name: bpmnName
    });
  }

  /**
   * Update state name when BPMN name changes
   */
  syncStateNameFromName(element: any, bpmnName: string): void {
    const stateName = this.nameToSnakeCase(bpmnName);
    this.modeling.updateProperties(element, {
      'data-state-name': stateName
    });
  }

  /**
   * Update timer event name when timer name changes
   */
  syncEventNameFromTimerName(element: any, timerName: string): void {
    const eventName = this.timerNameToEventName(timerName);
    this.modeling.updateProperties(element, {
      'data-event': eventName
    });
  }

  /**
   * Convert name to UPPER_SNAKE_CASE for events
   */
  nameToUpperSnakeCase(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }

  /**
   * Convert UPPER_SNAKE_CASE event name to flow name
   */
  eventNameToFlowName(eventName: string): string {
    return eventName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Update flow event name
   */
  updateFlowEventName(element: any, eventName: string): void {
    this.modeling.updateProperties(element, {
      'data-event': eventName
    });
  }

  /**
   * Update flow name
   */
  updateFlowName(element: any, flowName: string): void {
    this.modeling.updateProperties(element, {
      name: flowName
    });
  }
}

// Add injection annotation
(NamingService as any).$inject = ['elementRegistry', 'modeling'];

// Export as a module for bpmn-js
export default {
  __init__: ['namingService'],
  namingService: ['type', NamingService]
};
