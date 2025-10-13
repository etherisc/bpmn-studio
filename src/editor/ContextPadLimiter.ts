/**
 * Custom context pad provider that restricts available actions
 * to our supported BPMN subset
 */

export class ContextPadLimiter {
  static $inject = ['contextPad', 'modeling', 'elementFactory', 'connect', 'create'];

  constructor(
    private contextPad: any,
    private modeling: any,
    private elementFactory: any,
    private connect: any,
    private create: any
  ) {
    this.contextPad.registerProvider(this);
  }

  getContextPadEntries(element: any): any {
    const actions: any = {};

    if (this.isTask(element)) {
      // For tasks, allow connecting to other elements and adding boundary timers
      Object.assign(actions, {
        'connect': {
          group: 'connect',
          className: 'bpmn-icon-connection-multi',
          title: 'Connect using Sequence Flow',
          action: {
            click: this.startConnect.bind(this),
            dragstart: this.startConnect.bind(this)
          }
        },
        'append.end-event': {
          group: 'model',
          className: 'bpmn-icon-end-event-none',
          title: 'Append End Event',
          action: {
            click: this.appendEndEvent.bind(this),
            dragstart: this.appendEndEvent.bind(this)
          }
        },
        'append.task': {
          group: 'model',
          className: 'bpmn-icon-task',
          title: 'Append Task',
          action: {
            click: this.appendTask.bind(this),
            dragstart: this.appendTask.bind(this)
          }
        },
        'append.boundary-timer': {
          group: 'model',
          className: 'bpmn-icon-intermediate-event-catch-timer',
          title: 'Add Boundary Timer',
          action: {
            click: this.addBoundaryTimer.bind(this)
          }
        }
      });
    }

    if (this.isEndEvent(element)) {
      // End events can only be connected FROM (no outgoing flows allowed)
      // We don't add any connection actions for end events
    }

    if (this.isSequenceFlow(element)) {
      // Sequence flows don't need special context pad entries
    }

    // Common actions for all elements
    Object.assign(actions, {
      'delete': {
        group: 'edit',
        className: 'bpmn-icon-trash',
        title: 'Remove',
        action: {
          click: this.removeElement.bind(this)
        }
      }
    });

    return actions;
  }

  private isTask(element: any): boolean {
    return element.type === 'bpmn:Task';
  }

  private isEndEvent(element: any): boolean {
    return element.type === 'bpmn:EndEvent';
  }

  private isSequenceFlow(element: any): boolean {
    return element.type === 'bpmn:SequenceFlow';
  }

  private startConnect(event: any, element: any): void {
    this.connect.start(event, element);
  }

  private appendEndEvent(_event: any, element: any): any {
    const endEvent = this.elementFactory.createShape({
      type: 'bpmn:EndEvent'
    });

    return this.create.start(_event, endEvent, element);
  }

  private appendTask(_event: any, element: any): any {
    const task = this.elementFactory.createShape({
      type: 'bpmn:Task'
    });

    return this.create.start(_event, task, element);
  }

  private addBoundaryTimer(_event: any, element: any): void {
    const boundaryEvent = this.elementFactory.createShape({
      type: 'bpmn:BoundaryEvent',
      eventDefinitionType: 'bpmn:TimerEventDefinition'
    });

    // Attach the boundary event to the task
    this.modeling.createShape(
      boundaryEvent,
      { x: element.x + element.width, y: element.y + element.height / 2 },
      element
    );
  }

  private removeElement(_event: any, element: any): void {
    this.modeling.removeElements([element]);
  }
}

// Export as a module for bpmn-js
export default {
  __init__: ['contextPadLimiter'],
  contextPadLimiter: ['type', ContextPadLimiter]
};
