/**
 * Process Properties Provider for insurance process metadata
 * Properly integrates with bpmn-js-properties-panel using React components
 */

import { is } from 'bpmn-js/lib/util/ModelUtil';
import { TextFieldEntry } from '@bpmn-io/properties-panel';

const LOW_PRIORITY = 500;

// Create a proper TextFieldEntry component
function createTextFieldEntry(options: {
  id: string;
  label: string;
  property: string;
  element: any;
  injector: any;
  validate?: (value: string) => string | undefined;
  onUpdate?: (value: string, element: any, injector: any) => void;
}) {
  const { id, label, property, element, injector, validate, onUpdate } = options;
  const commandStack = injector.get('commandStack');
  const debounce = injector.get('debounceInput');
  const businessObject = element.businessObject;

  return {
    id,
    component: TextFieldEntry,
    element,
    label,
    getValue: () => businessObject.get(property) || '',
    setValue: (value: string) => {
      commandStack.execute('element.updateModdleProperties', {
        element,
        moddleElement: businessObject,
        properties: {
          [property]: value || undefined
        }
      });

      // Call custom update handler if provided
      if (onUpdate) {
        onUpdate(value, element, injector);
      }
    },
    validate,
    debounce
  };
}

// Properties provider class
function ProcessPropertiesProvider(propertiesPanel: any, injector: any) {
  // Register this provider with the properties panel
  propertiesPanel.registerProvider(LOW_PRIORITY, this);
  
  this._injector = injector;
}

ProcessPropertiesProvider.prototype.getGroups = function(element: any) {
  return function(groups: any[]) {
    // commandStack is accessed through injector in createTextFieldEntry
    
    // Add custom groups based on element type
    if (is(element, 'bpmn:Lane')) {
      groups.push({
        id: 'process-lane',
        label: 'Process Lane',
        shouldOpen: true,
        entries: [
          createTextFieldEntry({
            id: 'laneName',
            label: 'Lane Name',
            property: 'name',
            element,
            injector: this._injector,
            validate: (value: string) => {
              if (!value) return 'Lane name is required';
              return undefined;
            }
          })
        ]
      });
    }
    
    if (is(element, 'bpmn:Task')) {
      groups.push({
        id: 'process-task',
        label: 'Process Task',
        shouldOpen: true,
        entries: [
          createTextFieldEntry({
            id: 'stateName',
            label: 'State Name (snake_case)',
            property: 'data-state-name',
            element,
            injector: this._injector,
            validate: (value: string) => {
              if (!value) return 'State name is required';
              if (!/^[a-z][a-z0-9_]*$/.test(value)) {
                return 'Must be snake_case';
              }
              return undefined;
            },
            onUpdate: (value: string, element: any, injector: any) => {
              // Sync BPMN name when state name changes
              const namingService = injector.get('namingService');
              if (namingService && value) {
                namingService.syncNameFromStateName(element, value);
              }
            }
          })
        ]
      });
    }
    
    if (is(element, 'bpmn:SequenceFlow')) {
      groups.push({
        id: 'process-flow',
        label: 'Process Flow',
        shouldOpen: true,
        entries: [
          createTextFieldEntry({
            id: 'eventName',
            label: 'Event Name (UPPER_SNAKE_CASE)',
            property: 'data-event',
            element,
            injector: this._injector,
            validate: (value: string) => {
              if (!value) return 'Event name is required';
              if (!/^[A-Z][A-Z0-9_]*$/.test(value)) {
                return 'Must be UPPER_SNAKE_CASE';
              }
              return undefined;
            },
            onUpdate: (value: string, element: any, injector: any) => {
              // Sync flow name when event name changes (bidirectional for flows)
              const namingService = injector.get('namingService');
              if (namingService && value) {
                namingService.updateFlowName(element, namingService.eventNameToFlowName(value));
              }
            }
          }),
          createTextFieldEntry({
            id: 'guard',
            label: 'Guard Function',
            property: 'data-guard',
            element,
            injector: this._injector
          }),
          createTextFieldEntry({
            id: 'actions',
            label: 'Actions (comma-separated)',
            property: 'data-actions',
            element,
            injector: this._injector
          })
        ]
      });
    }
    
    if (is(element, 'bpmn:EndEvent')) {
      groups.push({
        id: 'process-end',
        label: 'Process End Event',
        shouldOpen: true,
        entries: [
          createTextFieldEntry({
            id: 'endStateName',
            label: 'State Name (snake_case)',
            property: 'data-state-name',
            element,
            injector: this._injector,
            validate: (value: string) => {
              if (!value) return 'State name is required';
              if (!/^[a-z][a-z0-9_]*$/.test(value)) {
                return 'Must be snake_case';
              }
              return undefined;
            }
          })
        ]
      });
    }
    
    if (is(element, 'bpmn:BoundaryEvent')) {
      const businessObject = element.businessObject;
      const eventDefinitions = businessObject.eventDefinitions || [];
      const isTimer = eventDefinitions.some((def: any) => def.$type === 'bpmn:TimerEventDefinition');
      
      if (isTimer) {
        groups.push({
          id: 'process-timer',
          label: 'Process Timer',
          shouldOpen: true,
          entries: [
            createTextFieldEntry({
              id: 'timerId',
              label: 'Timer ID',
              property: 'data-timer-id',
              element,
              injector: this._injector
            }),
            createTextFieldEntry({
              id: 'timerType',
              label: 'Timer Type',
              property: 'data-timer-type',
              element,
              injector: this._injector
            }),
            createTextFieldEntry({
              id: 'timerIso',
              label: 'ISO Duration/Date',
              property: 'data-iso',
              element,
              injector: this._injector,
              validate: (value: string) => {
                if (!value) return 'ISO duration or date is required';
                return undefined;
              }
            }),
            createTextFieldEntry({
              id: 'timerEvent',
              label: 'Timer Event (UPPER_SNAKE_CASE)',
              property: 'data-event',
              element,
              injector: this._injector,
              validate: (value: string) => {
                if (!value) return 'Timer event is required';
                if (!/^[A-Z][A-Z0-9_]*$/.test(value)) {
                  return 'Must be UPPER_SNAKE_CASE';
                }
                return undefined;
              },
            })
          ]
        });
      }
    }
    
    return groups;
  }.bind(this);
};

ProcessPropertiesProvider.$inject = ['propertiesPanel', 'injector'];

// Export as a module for bpmn-js
export default {
  __init__: ['processPropertiesProvider'],
  processPropertiesProvider: ['type', ProcessPropertiesProvider]
};