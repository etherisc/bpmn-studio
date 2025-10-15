/**
 * Custom module for initializing swimlanes with proper dimensions and lanes
 */

export class SwimlaneInitializer {
  private eventBus: any;
  private modeling: any;
  private namingService: any;

  constructor(eventBus: any, modeling: any, elementFactory: any, namingService: any) {
    this.eventBus = eventBus;
    this.modeling = modeling;
    this.namingService = namingService;

    // Reference to avoid TypeScript unused variable error
    void elementFactory;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for participant creation to customize dimensions and add lanes
    this.eventBus.on('commandStack.shape.create.postExecuted', (event: any) => {
      const { context } = event;
      const { shape } = context;

      if (shape.type === 'bpmn:Participant') {
        // Use setTimeout to defer execution until after the current command completes
        setTimeout(() => {
          this.initializeParticipantWithLanes(shape);
        }, 0);
      }
    });

    // Listen for lane creation to initialize names
    this.eventBus.on('commandStack.shape.create.postExecuted', (event: any) => {
      const { context } = event;
      const { shape } = context;

      if (shape.type === 'bpmn:Lane') {
        // Use setTimeout to defer execution until after the current command completes
        setTimeout(() => {
          this.namingService.initializeLaneNames(shape);
        }, 0);
      }
    });
  }

  private initializeParticipantWithLanes(participant: any): void {
    try {
      // First, resize the participant to our desired dimensions (800x600)
      this.modeling.resizeShape(participant, {
        x: participant.x,
        y: participant.y,
        width: 800,
        height: 600
      });

      // Create two lanes within the participant, each 300px height
      const laneHeight = 300;
      const laneWidth = 800 - 30; // Account for participant indentation
      const laneX = participant.x + 30; // Participant indentation

      // Create first lane
      const lane1Bounds = {
        x: laneX,
        y: participant.y,
        width: laneWidth,
        height: laneHeight
      };

      const lane1 = this.modeling.createShape(
        {
          type: 'bpmn:Lane',
          isHorizontal: true
        },
        lane1Bounds,
        participant
      );

      // Create second lane
      const lane2Bounds = {
        x: laneX,
        y: participant.y + laneHeight,
        width: laneWidth,
        height: laneHeight
      };

      const lane2 = this.modeling.createShape(
        {
          type: 'bpmn:Lane',
          isHorizontal: true
        },
        lane2Bounds,
        participant
      );

      console.log('✅ Created participant with two lanes:', { lane1, lane2 });

    } catch (error) {
      console.error('❌ Error initializing participant with lanes:', error);
    }
  }
}

// Add injection annotation
(SwimlaneInitializer as any).$inject = ['eventBus', 'modeling', 'elementFactory', 'namingService'];

// Export as a module for bpmn-js
export default {
  __init__: ['swimlaneInitializer'],
  swimlaneInitializer: ['type', SwimlaneInitializer]
};
