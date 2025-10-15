/**
 * Event handler for automatic naming and synchronization
 */

export class NamingEventHandler {
  private eventBus: any;
  private namingService: any;
  private directEditing: any; // Injected service for direct editing
  private currentEditingElement: any = null;

  constructor(eventBus: any, namingService: any, directEditing: any) {
    this.eventBus = eventBus;
    this.namingService = namingService;
    this.directEditing = directEditing;
    
    // Reference to avoid TypeScript unused variable error
    void this.directEditing;
    
    this.init();
  }

  init(): void {
    // Listen for element creation after command execution is complete
    this.eventBus.on('commandStack.shape.create.executed', (event: any) => {
      // Defer initialization to avoid nested command execution
      setTimeout(() => {
        this.handleElementAdded(event.context.shape);
      }, 10);
    });

    // Listen for connection creation
    this.eventBus.on('commandStack.connection.create.executed', (event: any) => {
      // Defer initialization to avoid nested command execution
      setTimeout(() => {
        this.handleElementAdded(event.context.connection);
      }, 10);
    });

    // Listen for property updates to sync names
    this.eventBus.on('element.updateModdleProperties.executed', (event: any) => {
      this.handlePropertyUpdate(event.context);
    });

    // Listen for direct editing activation to capture the element
    this.eventBus.on('directEditing.activate', (event: any) => {
      this.currentEditingElement = event.active?.element;
    });

    // Listen for direct label editing completion
    this.eventBus.on('directEditing.complete', (_event: any) => {
      // Use the element we captured during activation
      if (this.currentEditingElement) {
        const element = this.currentEditingElement;
        const bpmnName = element.businessObject.name;
        
        if (bpmnName) {
          if (element.type === 'bpmn:Task') {
            // Sync state name for tasks
            setTimeout(() => {
              this.namingService.syncStateNameFromName(element, bpmnName);
              this.currentEditingElement = null;
            }, 10);
          } else if (element.type === 'bpmn:BoundaryEvent') {
            // Sync event name for timers (one-way: name → event)
            const eventDefinitions = element.businessObject.eventDefinitions || [];
            const isTimer = eventDefinitions.some((def: any) => def.$type === 'bpmn:TimerEventDefinition');
            
            if (isTimer) {
              setTimeout(() => {
                this.namingService.syncEventNameFromTimerName(element, bpmnName);
                this.currentEditingElement = null;
              }, 10);
            }
          } else if (element.type === 'bpmn:SequenceFlow') {
            // Sync event name for flows (bidirectional)
            setTimeout(() => {
              this.namingService.updateFlowEventName(element, this.namingService.nameToUpperSnakeCase(bpmnName));
              this.currentEditingElement = null;
            }, 10);
          } else if (element.type === 'bpmn:Lane') {
            // Sync custom lane name for lanes (bidirectional)
            setTimeout(() => {
              this.namingService.syncCustomNameFromLaneName(element, bpmnName);
              this.currentEditingElement = null;
            }, 10);
          }
        }
      }
    });
  }

  private handleElementAdded(element: any): void {
    // Initialize names for new tasks
    if (element.type === 'bpmn:Task') {
      // Always initialize if no custom state name exists
      if (!element.businessObject.get('data-state-name')) {
        this.namingService.initializeTaskNames(element);
      }
    }

    // Initialize names for new end events
    if (element.type === 'bpmn:EndEvent') {
      // Always initialize if no custom state name exists
      if (!element.businessObject.get('data-state-name')) {
        this.namingService.initializeEndEventNames(element);
      }
    }

    // Initialize names for new boundary timer events
    if (element.type === 'bpmn:BoundaryEvent') {
      const eventDefinitions = element.businessObject.eventDefinitions || [];
      const isTimer = eventDefinitions.some((def: any) => def.$type === 'bpmn:TimerEventDefinition');
      
      if (isTimer && !element.businessObject.get('data-event')) {
        this.namingService.initializeBoundaryTimerNames(element);
      }
    }

    // Initialize names for new sequence flows
    if (element.type === 'bpmn:SequenceFlow') {
      // Always initialize if no event name exists
      if (!element.businessObject.get('data-event')) {
        this.namingService.initializeSequenceFlowNames(element);
      }
    }

    // Initialize names for new lanes (handled by SwimlaneInitializer, but add fallback)
    if (element.type === 'bpmn:Lane') {
      // Only initialize if no name exists and no custom lane name exists
      if (!element.businessObject.name && !element.businessObject.get('data-lane-name')) {
        this.namingService.initializeLaneNames(element);
      }
    }
  }

  private handlePropertyUpdate(context: any): void {
    const { element, properties } = context;

    // Sync BPMN name when state name changes (but avoid infinite loops)
    if (properties['data-state-name'] && element.type === 'bpmn:Task') {
      const stateName = properties['data-state-name'];
      // Only sync if this wasn't triggered by our own name sync
      if (!this.isInternalUpdate) {
        this.isInternalUpdate = true;
        setTimeout(() => {
          this.namingService.syncNameFromStateName(element, stateName);
          this.isInternalUpdate = false;
        }, 10);
      }
    }

    // Sync timer event name when timer name changes
    if (properties.name && element.type === 'bpmn:BoundaryEvent') {
      const eventDefinitions = element.businessObject.eventDefinitions || [];
      const isTimer = eventDefinitions.some((def: any) => def.$type === 'bpmn:TimerEventDefinition');
      
      if (isTimer && !this.isInternalUpdate) {
        const timerName = properties.name;
        this.isInternalUpdate = true;
        setTimeout(() => {
          this.namingService.syncEventNameFromTimerName(element, timerName);
          this.isInternalUpdate = false;
        }, 10);
      }
    }

    // For sequence flows: sync event name when flow name changes (bidirectional)
    if (properties.name && element.type === 'bpmn:SequenceFlow') {
      if (!this.isInternalUpdate) {
        const flowName = properties.name;
        const eventName = this.namingService.nameToUpperSnakeCase(flowName);
        this.isInternalUpdate = true;
        setTimeout(() => {
          this.namingService.updateFlowEventName(element, eventName);
          this.isInternalUpdate = false;
        }, 10);
      }
    }

    // For sequence flows: sync flow name when event name changes (bidirectional)
    if (properties['data-event'] && element.type === 'bpmn:SequenceFlow') {
      if (!this.isInternalUpdate) {
        const eventName = properties['data-event'];
        const flowName = this.namingService.eventNameToFlowName(eventName);
        this.isInternalUpdate = true;
        setTimeout(() => {
          this.namingService.updateFlowName(element, flowName);
          this.isInternalUpdate = false;
        }, 10);
      }
    }

    // For lanes: sync BPMN name when custom lane name changes (bidirectional)
    if (properties['data-lane-name'] && element.type === 'bpmn:Lane') {
      if (!this.isInternalUpdate) {
        const customLaneName = properties['data-lane-name'];
        this.isInternalUpdate = true;
        setTimeout(() => {
          this.namingService.syncLaneNameFromCustomName(element, customLaneName);
          this.isInternalUpdate = false;
        }, 10);
      }
    }

    // For lanes: sync custom lane name when BPMN name changes (bidirectional)
    if (properties.name && element.type === 'bpmn:Lane') {
      if (!this.isInternalUpdate) {
        const laneName = properties.name;
        this.isInternalUpdate = true;
        setTimeout(() => {
          this.namingService.syncCustomNameFromLaneName(element, laneName);
          this.isInternalUpdate = false;
        }, 10);
      }
    }
  }

  private isInternalUpdate = false;
}

(NamingEventHandler as any).$inject = ['eventBus', 'namingService', 'directEditing'];

// Export as a module for bpmn-js
export default {
  __init__: ['namingEventHandler'],
  namingEventHandler: ['type', NamingEventHandler]
};
