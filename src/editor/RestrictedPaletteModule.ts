/**
 * Custom palette provider that REPLACES the default palette
 * Based on official bpmn-js examples
 */

function CustomPaletteProvider(
  palette, create, elementFactory, 
  spaceTool, lassoTool, globalConnect, translate
) {
  this._palette = palette;
  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;
  this._globalConnect = globalConnect;
  this._translate = translate;

  palette.registerProvider(this);
}

CustomPaletteProvider.$inject = [
  'palette', 'create', 'elementFactory',
  'spaceTool', 'lassoTool', 'globalConnect', 'translate'
];

CustomPaletteProvider.prototype.getPaletteEntries = function() {
  const actions = {};
  const create = this._create;
  const elementFactory = this._elementFactory;
  const spaceTool = this._spaceTool;
  const lassoTool = this._lassoTool;
  const globalConnect = this._globalConnect;
  const translate = this._translate;

  function createAction(type, group, className, title) {
    function createListener(event) {
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

  // ONLY return our allowed elements - this completely replaces the default palette
  Object.assign(actions, {
    'create.task': createAction(
      'bpmn:Task', 'activity', 'bpmn-icon-task', 'Create Task'
    ),
    'create.end-event': createAction(
      'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none', 'Create End Event'
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
        click: function(event) {
          lassoTool.activateSelection(event);
        }
      }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: 'Activate Space Tool',
      action: {
        click: function(event) {
          spaceTool.activateSelection(event);
        }
      }
    },
    'global-connect-tool': {
      group: 'tools',
      className: 'bpmn-icon-connection-multi',
      title: 'Connect Elements',
      action: {
        click: function(event) {
          globalConnect.start(event);
        }
      }
    }
  });

  return actions;
};

// The key is to REPLACE the paletteProvider service, not just add a new one
export default {
  __init__: [],
  // This replaces the default paletteProvider
  paletteProvider: ['type', CustomPaletteProvider]
};
