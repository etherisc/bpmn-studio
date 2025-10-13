/**
 * Custom context pad provider that REPLACES the default context pad
 * Based on official bpmn-js examples
 */

function CustomContextPadProvider(
  contextPad: any, modeling: any, connect: any, create: any, elementFactory: any, autoPlace: any, translate: any
): void {
  this._contextPad = contextPad;
  this._modeling = modeling;
  this._connect = connect;
  this._create = create;
  this._elementFactory = elementFactory;
  this._autoPlace = autoPlace;
  this._translate = translate;

  contextPad.registerProvider(this);
}

CustomContextPadProvider.$inject = [
  'contextPad', 'modeling', 'connect', 'create', 'elementFactory', 'autoPlace', 'translate'
];

CustomContextPadProvider.prototype.getContextPadEntries = function(element: any) {
  const actions = {};
  const modeling = this._modeling;
  const connect = this._connect;
  // const create = this._create;
  const elementFactory = this._elementFactory;
  const autoPlace = this._autoPlace;
  // const translate = this._translate;

  function appendAction(type: any, className: any, title: any, options?: any) {
    function appendListener(_event: any, element: any) {
      const shape = elementFactory.createShape(Object.assign({ type: type }, options));
      
      // Use autoPlace to properly position and connect the new element
      const newElement = autoPlace.append(element, shape);
      
      return newElement;
    }

    return {
      group: 'model',
      className: className,
      title: title,
      action: {
        click: appendListener,
        dragstart: appendListener
      }
    };
  }

  // Actions for Start Events
  if (element.type === 'bpmn:StartEvent') {
    Object.assign(actions, {
      'append.task': appendAction(
        'bpmn:Task', 'bpmn-icon-task', 'Append Task', {}
      ),
      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: 'Connect to Task',
        action: {
          click: function(event: any, element: any) {
            connect.start(event, element);
          }
        }
      }
    });
  }

  // Actions for Tasks
  if (element.type === 'bpmn:Task') {
    Object.assign(actions, {
      'append.task': appendAction(
        'bpmn:Task', 'bpmn-icon-task', 'Append Task', {}
      ),
      'append.end-event': appendAction(
        'bpmn:EndEvent', 'bpmn-icon-end-event-none', 'Append End Event', {}
      ),
      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: 'Connect using Sequence Flow',
        action: {
          click: function(event: any, element: any) {
            connect.start(event, element);
          }
        }
      },
      'append.boundary-timer': {
        group: 'model',
        className: 'bpmn-icon-intermediate-event-catch-timer',
        title: 'Add Timer Boundary Event',
        action: {
          click: function(_event: any, element: any) {
            const boundaryEvent = elementFactory.createShape({
              type: 'bpmn:BoundaryEvent',
              eventDefinitionType: 'bpmn:TimerEventDefinition'
            });
            
            // Position the boundary event on the task
            const position = {
              x: element.x + element.width - 12,
              y: element.y + element.height - 12
            };
            
            modeling.createShape(boundaryEvent, position, element);
          }
        }
      }
    });
  }

  // Actions for End Events (minimal - they're terminal)
  if (element.type === 'bpmn:EndEvent') {
    Object.assign(actions, {
      // End events typically don't have outgoing connections
      // but we can allow connecting TO them
    });
  }

  // Actions for Sequence Flows
  if (element.type === 'bpmn:SequenceFlow') {
    Object.assign(actions, {
      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: 'Connect using Sequence Flow',
        action: {
          click: function(event: any, element: any) {
            connect.start(event, element);
          }
        }
      }
    });
  }

  // Actions for Boundary Events (Timers)
  if (element.type === 'bpmn:BoundaryEvent') {
    Object.assign(actions, {
      'append.task': appendAction(
        'bpmn:Task', 'bpmn-icon-task', 'Append Task', {}
      ),
      'append.end-event': appendAction(
        'bpmn:EndEvent', 'bpmn-icon-end-event-none', 'Append End Event', {}
      ),
      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connection-multi',
        title: 'Connect using Sequence Flow',
        action: {
          click: function(event: any, element: any) {
            connect.start(event, element);
          }
        }
      }
    });
  }

  // Common actions for all elements
  Object.assign(actions, {
    'delete': {
      group: 'edit',
      className: 'bpmn-icon-trash',
      title: 'Remove',
      action: {
        click: function(_event: any, element: any) {
          modeling.removeElements([element]);
        }
      }
    }
  });

  return actions;
};

// Replace the default contextPadProvider service
export default {
  __init__: [],
  // This replaces the default contextPadProvider
  contextPadProvider: ['type', CustomContextPadProvider]
};
