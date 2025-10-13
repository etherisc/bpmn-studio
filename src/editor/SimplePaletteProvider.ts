/**
 * Simple palette provider that only shows our allowed elements
 */

export default function PaletteProvider(
  palette: any,
  create: any,
  elementFactory: any,
  spaceTool: any,
  lassoTool: any,
  globalConnect: any
) {
  
  this.getPaletteEntries = function() {
    
    function createAction(type: string, group: string, className: string, title: string) {
      function createListener(event: any) {
        const shape = elementFactory.createShape({ type: type });
        create.start(event, shape);
      }

      return {
        group: group,
        className: className,
        title: title,
        action: {
          dragstart: createListener,
          click: createListener
        }
      };
    }

    return {
      // Only our allowed elements
      'create.task': createAction(
        'bpmn:Task',
        'activity',
        'bpmn-icon-task',
        'Create Task'
      ),
      'create.end-event': createAction(
        'bpmn:EndEvent',
        'event', 
        'bpmn-icon-end-event-none',
        'Create End Event'
      ),
      'palette-separator': {
        group: 'activity',
        separator: true
      },
      'lasso-tool': {
        group: 'tools',
        className: 'bpmn-icon-lasso-tool',
        title: 'Activate Lasso Tool',
        action: {
          click: function(event: any) {
            lassoTool.activateSelection(event);
          }
        }
      },
      'space-tool': {
        group: 'tools',
        className: 'bpmn-icon-space-tool', 
        title: 'Activate Space Tool',
        action: {
          click: function(event: any) {
            spaceTool.activateSelection(event);
          }
        }
      },
      'global-connect-tool': {
        group: 'tools',
        className: 'bpmn-icon-connection-multi',
        title: 'Connect Elements',
        action: {
          click: function(event: any) {
            globalConnect.start(event);
          }
        }
      }
    };
  };
}

PaletteProvider.$inject = [
  'palette',
  'create', 
  'elementFactory',
  'spaceTool',
  'lassoTool',
  'globalConnect'
];
