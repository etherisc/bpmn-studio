/**
 * Custom rules provider that enforces our BPMN subset restrictions
 * and prevents invalid modeling operations
 */

export class ProcessEditorRulesProvider {
  static $inject = ['eventBus'];

  constructor(private eventBus: any) {
    this.init();
  }

  init(): void {
    // Use canExecute events instead of preExecute to properly prevent actions
    this.eventBus.on('commandStack.shape.create.canExecute', this.canCreateShape.bind(this));
    this.eventBus.on('commandStack.connection.create.canExecute', this.canCreateConnection.bind(this));
    this.eventBus.on('commandStack.shape.attach.canExecute', this.canAttachShape.bind(this));
  }

  private canCreateShape(event: any): void {
    const context = event.context;
    const shape = context.shape;

    // Only allow our supported element types
    const allowedTypes = [
      'bpmn:StartEvent', // Visual only - for usability
      'bpmn:Task',
      'bpmn:EndEvent',
      'bpmn:BoundaryEvent',
      'bpmn:Lane',
      'bpmn:Participant',
      'bpmn:Process'
    ];

    if (!allowedTypes.includes(shape.type)) {
      console.warn(`Element type ${shape.type} is not allowed in this editor. Allowed types: ${allowedTypes.join(', ')}`);
      throw new Error(`Element type ${shape.type} is not allowed in this editor`);
    }

    // Special validation for Start Events
    if (shape.type === 'bpmn:StartEvent') {
      this.validateSingleStartEvent(context);
    }

    // Additional validation for boundary events
    if (shape.type === 'bpmn:BoundaryEvent') {
      const host = context.host;
      if (!host || host.type !== 'bpmn:Task') {
        throw new Error('Boundary events can only be attached to Tasks');
      }

      // Only allow timer boundary events
      if (!this.isTimerBoundaryEvent(shape)) {
        throw new Error('Only Timer Boundary Events are allowed');
      }
    }
  }

  private canCreateConnection(event: any): void {
    const context = event.context;
    const connection = context.connection;
    const source = context.source;
    const target = context.target;

    // Only allow sequence flows
    if (connection.type !== 'bpmn:SequenceFlow') {
      throw new Error('Only Sequence Flows are allowed as connections');
    }

    // End events cannot have outgoing flows
    if (source.type === 'bpmn:EndEvent') {
      throw new Error('End Events cannot have outgoing flows');
    }

    // Start events can only connect to Tasks and can only have one outgoing flow
    if (source.type === 'bpmn:StartEvent') {
      if (target.type !== 'bpmn:Task') {
        throw new Error('Start Events can only connect to Tasks');
      }
      
      // Check if start event already has an outgoing flow
      const outgoing = source.businessObject?.outgoing || [];
      if (outgoing.length > 0) {
        throw new Error('Start Events can only have one outgoing flow');
      }
    }

    // Validate source and target types
    const allowedSourceTypes = ['bpmn:StartEvent', 'bpmn:Task', 'bpmn:BoundaryEvent'];
    const allowedTargetTypes = ['bpmn:Task', 'bpmn:EndEvent'];

    if (!allowedSourceTypes.includes(source.type)) {
      throw new Error(`${source.type} cannot be a source of Sequence Flow`);
    }

    if (!allowedTargetTypes.includes(target.type)) {
      throw new Error(`${target.type} cannot be a target of Sequence Flow`);
    }

    // Check for duplicate events from the same source
    this.validateNoDuplicateEvents(source, connection);
  }

  private canAttachShape(event: any): void {
    const context = event.context;
    const shape = context.shape;
    const host = context.host;

    // Only allow boundary events to be attached, and only to tasks
    if (shape.type === 'bpmn:BoundaryEvent') {
      if (!host || host.type !== 'bpmn:Task') {
        throw new Error('Boundary events can only be attached to Tasks');
      }

      if (!this.isTimerBoundaryEvent(shape)) {
        throw new Error('Only Timer Boundary Events are allowed');
      }
    } else {
      throw new Error('Only Boundary Events can be attached to other elements');
    }
  }

  private isTimerBoundaryEvent(shape: any): boolean {
    const businessObject = shape.businessObject;
    if (!businessObject.eventDefinitions) {
      return false;
    }

    return businessObject.eventDefinitions.some((def: any) => 
      def.$type === 'bpmn:TimerEventDefinition'
    );
  }

  private validateNoDuplicateEvents(source: any, newConnection: any): void {
    // Get the event name from the new connection
    const newEvent = newConnection.businessObject?.get('data-event');
    if (!newEvent) {
      return; // No event defined yet, will be validated later
    }

    // Check existing outgoing flows from the same source
    const outgoing = source.businessObject?.outgoing || [];
    for (const flow of outgoing) {
      const existingEvent = flow.get('data-event');
      if (existingEvent === newEvent) {
        throw new Error(`Duplicate event '${newEvent}' from the same state is not allowed`);
      }
    }
  }

  private validateSingleStartEvent(context: any): void {
    // Check if there's already a start event in the process
    const elementRegistry = context.elementRegistry || this.getElementRegistry();
    if (elementRegistry) {
      const existingStartEvents = elementRegistry.filter((element: any) => 
        element.type === 'bpmn:StartEvent'
      );
      
      if (existingStartEvents.length > 0) {
        throw new Error('Only one Start Event is allowed per diagram');
      }
    }
  }

  private getElementRegistry(): any {
    // Helper to get element registry from the modeler
    try {
      return this.eventBus._injector?.get?.('elementRegistry');
    } catch {
      return null;
    }
  }
}

// Export as a module for bpmn-js
export default {
  __init__: ['processEditorRulesProvider'],
  processEditorRulesProvider: ['type', ProcessEditorRulesProvider]
};
