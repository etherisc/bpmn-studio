/**
 * Custom palette provider that completely replaces the default BPMN palette
 * with only our allowed elements
 */

export class CustomPaletteProvider {
  static $inject = ['create', 'elementFactory', 'spaceTool', 'lassoTool', 'globalConnect'];

  constructor(
    private create: any,
    private elementFactory: any,
    private spaceTool: any,
    private lassoTool: any,
    private globalConnect: any
  ) {}

  getPaletteEntries(): any {
    const actions: any = {};
    const create = this.create;
    const elementFactory = this.elementFactory;
    const spaceTool = this.spaceTool;
    const lassoTool = this.lassoTool;
    const globalConnect = this.globalConnect;

    function createAction(type: string, group: string, className: string, title: string, options?: any) {
      function createListener(event: any) {
        const shape = elementFactory.createShape(Object.assign({ type: type }, options));
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

    // Only our allowed elements
    Object.assign(actions, {
      'create.task': createAction(
        'bpmn:Task', 'activity', 'bpmn-icon-task',
        'Create Task (Initial state if no incoming flows)'
      ),
      'create.end-event': createAction(
        'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none',
        'Create End Event (Terminal state)'
      ),
      'activity-separator': {
        group: 'activity',
        separator: true
      },
      'lasso-tool': {
        group: 'tools',
        className: 'bpmn-icon-lasso-tool',
        title: 'Activate the lasso tool',
        action: {
          click: function(event: any) {
            lassoTool.activateSelection(event);
          }
        }
      },
      'space-tool': {
        group: 'tools',
        className: 'bpmn-icon-space-tool',
        title: 'Activate the create/remove space tool',
        action: {
          click: function(event: any) {
            spaceTool.activateSelection(event);
          }
        }
      },
      'global-connect-tool': {
        group: 'tools',
        className: 'bpmn-icon-connection-multi',
        title: 'Activate the global connect tool',
        action: {
          click: function(event: any) {
            globalConnect.start(event);
          }
        }
      },
      'tool-separator': {
        group: 'tools',
        separator: true
      }
    });

    return actions;
  }
}

// Export as a module for bpmn-js
export default {
  __init__: ['customPaletteProvider'],
  customPaletteProvider: ['type', CustomPaletteProvider],
  // Override the default palette provider
  paletteProvider: ['type', CustomPaletteProvider]
};
