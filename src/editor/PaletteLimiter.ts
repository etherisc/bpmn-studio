/**
 * Custom palette provider that restricts available BPMN elements
 * to our supported subset: Task, End Event, Sequence Flow, Boundary Timer, Lane
 */

export class PaletteLimiter {
  static $inject = ['palette', 'create', 'elementFactory', 'spaceTool', 'lassoTool', 'globalConnect'];

  constructor(
    private palette: any,
    private create: any,
    private elementFactory: any,
    private spaceTool: any,
    private lassoTool: any,
    private globalConnect: any
  ) {
    // Register with very high priority to override default providers
    this.palette.registerProvider(1000, this);
  }

  // This method completely replaces all palette entries
  getPaletteEntries(element?: any): any {
    // Return ONLY our allowed elements - this completely replaces the default palette
    return {
      'create.task': {
        group: 'activity',
        className: 'bpmn-icon-task',
        title: 'Create Task (Initial state if no incoming flows)',
        action: {
          dragstart: this.createTask.bind(this),
          click: this.createTask.bind(this)
        }
      },
      'create.end-event': {
        group: 'event',
        className: 'bpmn-icon-end-event-none',
        title: 'Create End Event (Terminal state)',
        action: {
          dragstart: this.createEndEvent.bind(this),
          click: this.createEndEvent.bind(this)
        }
      },
      'palette-separator-1': {
        group: 'activity',
        separator: true
      },
      'create.participant-expanded': {
        group: 'collaboration',
        className: 'bpmn-icon-participant',
        title: 'Create Pool/Participant',
        action: {
          dragstart: this.createParticipant.bind(this),
          click: this.createParticipant.bind(this)
        }
      },
      'create.lane': {
        group: 'collaboration',
        className: 'bpmn-icon-lane',
        title: 'Create Lane (Responsibility grouping)',
        action: {
          dragstart: this.createLane.bind(this),
          click: this.createLane.bind(this)
        }
      },
      'palette-separator-2': {
        group: 'collaboration',
        separator: true
      },
      'lasso-tool': {
        group: 'tools',
        className: 'bpmn-icon-lasso-tool',
        title: 'Activate Lasso Tool',
        action: {
          click: this.activateLassoTool.bind(this)
        }
      },
      'space-tool': {
        group: 'tools',
        className: 'bpmn-icon-space-tool',
        title: 'Activate Space Tool',
        action: {
          click: this.activateSpaceTool.bind(this)
        }
      },
      'global-connect-tool': {
        group: 'tools',
        className: 'bpmn-icon-connection-multi',
        title: 'Activate Global Connect Tool (Create Sequence Flows)',
        action: {
          click: this.activateGlobalConnectTool.bind(this)
        }
      }
    };
  }

  private createTask(event: any): any {
    const taskShape = this.elementFactory.createShape({
      type: 'bpmn:Task'
    });

    if (event.type === 'click') {
      this.create.start(event, taskShape);
    } else {
      return taskShape;
    }
  }

  private createEndEvent(event: any): any {
    const endEventShape = this.elementFactory.createShape({
      type: 'bpmn:EndEvent'
    });

    if (event.type === 'click') {
      this.create.start(event, endEventShape);
    } else {
      return endEventShape;
    }
  }

  private createParticipant(event: any): any {
    const participantShape = this.elementFactory.createParticipantShape({
      type: 'bpmn:Participant'
    });

    if (event.type === 'click') {
      this.create.start(event, participantShape);
    } else {
      return participantShape;
    }
  }

  private createLane(event: any): any {
    const laneShape = this.elementFactory.createShape({
      type: 'bpmn:Lane'
    });

    if (event.type === 'click') {
      this.create.start(event, laneShape);
    } else {
      return laneShape;
    }
  }

  private activateLassoTool(): void {
    this.lassoTool.activateSelection();
  }

  private activateSpaceTool(): void {
    this.spaceTool.activateSelection();
  }

  private activateGlobalConnectTool(): void {
    this.globalConnect.toggle();
  }
}

// Export as a module for bpmn-js
export default {
  __init__: ['paletteLimiter'],
  paletteLimiter: ['type', PaletteLimiter]
};
