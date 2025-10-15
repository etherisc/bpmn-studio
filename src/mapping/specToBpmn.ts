/**
 * MachineSpec v2 JSON to BPMN XML conversion
 */

import { MachineSpec, StateNode, TransitionSpec, TimerSpec, CommentSpec } from '../types/machine-spec';
import { generateUUID } from '../lib/files';

export class SpecToBpmnMapper {

  async convertSpecToBpmn(spec: MachineSpec): Promise<string> {
    // Create BPMN XML document structure
    const bpmnDoc = this.createBpmnDocument(spec.id);
    
    // Add process elements
    const processElement = this.createProcessElement(bpmnDoc, spec.id);
    
    // Track element positions for layout
    const positions = new Map<string, { x: number, y: number }>();
    let currentX = 100;
    let currentY = 100;

    // Create Start Event first (visual only)
    const startEventId = generateUUID();
    this.createStartEvent(processElement, startEventId);
    positions.set(startEventId, { x: currentX, y: currentY });
    currentX += 200;

    // Create tasks and end events
    const elementMap = new Map<string, string>(); // stateName -> elementId
    
    Object.entries(spec.states).forEach(([stateName, state]) => {
      const elementId = state.id || generateUUID();
      elementMap.set(stateName, elementId);
      
      if (state.type === 'end') {
        this.createEndEvent(processElement, elementId, stateName, state);
      } else {
        this.createTask(processElement, elementId, stateName, state);
      }
      
      positions.set(elementId, { x: currentX, y: currentY });
      currentX += 200;
      if (currentX > 800) {
        currentX = 100;
        currentY += 150;
      }
    });

    // Create sequence flow from Start Event to initial state
    const initialStateId = elementMap.get(spec.initial);
    if (initialStateId) {
      this.createSequenceFlow(processElement, startEventId, initialStateId, 'START', { target: spec.initial });
    }

    // Create sequence flows
    Object.entries(spec.states).forEach(([stateName, state]) => {
      if (state.on) {
        Object.entries(state.on).forEach(([eventName, transition]) => {
          const sourceId = elementMap.get(stateName);
          const targetStateName = typeof transition === 'string' ? transition : transition.target;
          const targetId = elementMap.get(targetStateName);
          
          if (sourceId && targetId) {
            this.createSequenceFlow(processElement, sourceId, targetId, eventName, transition);
          }
        });
      }
    });

    // Create boundary events for timers
    Object.entries(spec.states).forEach(([stateName, state]) => {
      if (state.timers && state.timers.length > 0) {
        const hostId = elementMap.get(stateName);
        if (hostId) {
          state.timers.forEach(timer => {
            this.createBoundaryEvent(processElement, hostId, timer);
          });
        }
      }
    });

    // Create lanes if specified
    if (spec.metadata?.lanes) {
      this.createLanes(bpmnDoc, spec.metadata.lanes, elementMap);
    }

    // Create text annotations (comments) if specified
    if (spec.metadata?.comments) {
      this.createTextAnnotations(processElement, spec.metadata.comments, elementMap);
    }

    // Add diagram elements
    this.createDiagramElements(bpmnDoc, processElement, positions, elementMap);

    // Serialize to XML
    const serializer = new XMLSerializer();
    return serializer.serializeToString(bpmnDoc);
  }

  private createBpmnDocument(_processId: string): Document {
    const doc = document.implementation.createDocument(
      'http://www.omg.org/spec/BPMN/20100524/MODEL',
      'bpmn:definitions',
      null
    );

    const definitions = doc.documentElement;
    definitions.setAttribute('xmlns:bpmn', 'http://www.omg.org/spec/BPMN/20100524/MODEL');
    definitions.setAttribute('xmlns:bpmndi', 'http://www.omg.org/spec/BPMN/20100524/DI');
    definitions.setAttribute('xmlns:dc', 'http://www.omg.org/spec/DD/20100524/DC');
    definitions.setAttribute('xmlns:di', 'http://www.omg.org/spec/DD/20100524/DI');
    definitions.setAttribute('id', 'Definitions_' + generateUUID());
    definitions.setAttribute('targetNamespace', 'http://bpmn.io/schema/bpmn');
    definitions.setAttribute('exporter', 'process-editor');
    definitions.setAttribute('exporterVersion', '1.0.0');

    return doc;
  }

  private createProcessElement(doc: Document, processId: string): Element {
    const process = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:process');
    process.setAttribute('id', processId);
    process.setAttribute('isExecutable', 'true');
    
    doc.documentElement.appendChild(process);
    return process;
  }

  private createStartEvent(processElement: Element, elementId: string): void {
    const startEvent = processElement.ownerDocument!.createElementNS(
      'http://www.omg.org/spec/BPMN/20100524/MODEL', 
      'bpmn:startEvent'
    );
    
    startEvent.setAttribute('id', elementId);
    startEvent.setAttribute('name', 'Start');
    
    processElement.appendChild(startEvent);
  }

  private createTask(processElement: Element, elementId: string, stateName: string, state: StateNode): void {
    const task = processElement.ownerDocument!.createElementNS(
      'http://www.omg.org/spec/BPMN/20100524/MODEL', 
      'bpmn:task'
    );
    
    task.setAttribute('id', elementId);
    task.setAttribute('name', stateName);
    
    // Add custom attributes
    task.setAttribute('data-state-name', stateName);
    if (state.id) {
      task.setAttribute('data-element-id', state.id);
    }

    processElement.appendChild(task);
  }

  private createEndEvent(processElement: Element, elementId: string, stateName: string, state: StateNode): void {
    const endEvent = processElement.ownerDocument!.createElementNS(
      'http://www.omg.org/spec/BPMN/20100524/MODEL', 
      'bpmn:endEvent'
    );
    
    endEvent.setAttribute('id', elementId);
    endEvent.setAttribute('name', stateName);
    
    // Add custom attributes
    if (state.id) {
      endEvent.setAttribute('data-element-id', state.id);
    }

    processElement.appendChild(endEvent);
  }

  private createSequenceFlow(
    processElement: Element, 
    sourceId: string, 
    targetId: string, 
    eventName: string, 
    transition: TransitionSpec
  ): void {
    const flow = processElement.ownerDocument!.createElementNS(
      'http://www.omg.org/spec/BPMN/20100524/MODEL', 
      'bpmn:sequenceFlow'
    );
    
    const flowId = generateUUID();
    flow.setAttribute('id', flowId);
    flow.setAttribute('sourceRef', sourceId);
    flow.setAttribute('targetRef', targetId);
    flow.setAttribute('name', eventName);
    
    // Add custom attributes
    flow.setAttribute('data-event', eventName);
    
    if (typeof transition === 'object') {
      if (transition.id) {
        flow.setAttribute('data-flow-id', transition.id);
      }
      if (transition.guard) {
        flow.setAttribute('data-guard', transition.guard);
      }
      if (transition.actions && transition.actions.length > 0) {
        flow.setAttribute('data-actions', transition.actions.join(','));
      }
    }

    processElement.appendChild(flow);
  }

  private createBoundaryEvent(processElement: Element, hostId: string, timer: TimerSpec): void {
    const boundaryEvent = processElement.ownerDocument!.createElementNS(
      'http://www.omg.org/spec/BPMN/20100524/MODEL', 
      'bpmn:boundaryEvent'
    );
    
    const eventId = generateUUID();
    boundaryEvent.setAttribute('id', eventId);
    boundaryEvent.setAttribute('attachedToRef', hostId);
    boundaryEvent.setAttribute('name', timer.event);
    
    // Add timer event definition
    const timerEventDef = processElement.ownerDocument!.createElementNS(
      'http://www.omg.org/spec/BPMN/20100524/MODEL', 
      'bpmn:timerEventDefinition'
    );
    boundaryEvent.appendChild(timerEventDef);
    
    // Add custom attributes
    boundaryEvent.setAttribute('data-timer-id', timer.id);
    boundaryEvent.setAttribute('data-timer-type', timer.type);
    boundaryEvent.setAttribute('data-event', timer.event);
    
    if (timer.type === 'DURATION' && timer.iso) {
      boundaryEvent.setAttribute('data-iso', timer.iso);
    } else if (timer.type === 'DATE' && timer.at) {
      boundaryEvent.setAttribute('data-at', timer.at);
    }

    processElement.appendChild(boundaryEvent);
  }

  private createLanes(
    doc: Document, 
    lanes: Record<string, string[]>, 
    _elementMap: Map<string, string>
  ): void {
    const collaboration = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:collaboration');
    collaboration.setAttribute('id', 'Collaboration_' + generateUUID());
    
    const participant = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:participant');
    participant.setAttribute('id', 'Participant_' + generateUUID());
    participant.setAttribute('processRef', 'Process_1');
    
    const laneSet = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:laneSet');
    laneSet.setAttribute('id', 'LaneSet_' + generateUUID());
    
    Object.entries(lanes).forEach(([laneName, stateNames]) => {
      const lane = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:lane');
      lane.setAttribute('id', 'Lane_' + generateUUID());
      lane.setAttribute('name', laneName);
      
      stateNames.forEach(stateName => {
        const elementId = _elementMap.get(stateName);
        if (elementId) {
          const flowNodeRef = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'bpmn:flowNodeRef');
          flowNodeRef.textContent = elementId;
          lane.appendChild(flowNodeRef);
        }
      });
      
      laneSet.appendChild(lane);
    });
    
    participant.appendChild(laneSet);
    collaboration.appendChild(participant);
    
    // Insert collaboration before process
    const process = doc.querySelector('bpmn\\:process');
    if (process) {
      doc.documentElement.insertBefore(collaboration, process);
    }
  }

  private createTextAnnotations(
    processElement: Element, 
    comments: CommentSpec[], 
    elementMap: Map<string, string>
  ): void {
    comments.forEach(comment => {
      // Create text annotation element
      const textAnnotation = processElement.ownerDocument!.createElementNS(
        'http://www.omg.org/spec/BPMN/20100524/MODEL', 
        'bpmn:textAnnotation'
      );
      
      textAnnotation.setAttribute('id', comment.id);
      textAnnotation.setAttribute('text', comment.text);
      textAnnotation.textContent = comment.text;
      
      processElement.appendChild(textAnnotation);

      // Create association if the comment is attached to an element
      if (comment.attachedTo) {
        const targetElementId = elementMap.get(comment.attachedTo) || comment.attachedTo;
        
        const association = processElement.ownerDocument!.createElementNS(
          'http://www.omg.org/spec/BPMN/20100524/MODEL', 
          'bpmn:association'
        );
        
        const associationId = generateUUID();
        association.setAttribute('id', associationId);
        association.setAttribute('sourceRef', comment.id);
        association.setAttribute('targetRef', targetElementId);
        
        processElement.appendChild(association);
      }
    });
  }

  private createDiagramElements(
    doc: Document, 
    processElement: Element, 
    positions: Map<string, { x: number, y: number }>,
    _elementMap: Map<string, string>
  ): void {
    const diagram = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNDiagram');
    diagram.setAttribute('id', 'BPMNDiagram_' + generateUUID());
    
    const plane = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNPlane');
    plane.setAttribute('id', 'BPMNPlane_' + generateUUID());
    plane.setAttribute('bpmnElement', processElement.getAttribute('id') || 'Process_1');
    
    // Add shapes for elements
    positions.forEach((position, elementId) => {
      const shape = doc.createElementNS('http://www.omg.org/spec/BPMN/20100524/DI', 'bpmndi:BPMNShape');
      shape.setAttribute('id', 'BPMNShape_' + elementId);
      shape.setAttribute('bpmnElement', elementId);
      
      const bounds = doc.createElementNS('http://www.omg.org/spec/DD/20100524/DC', 'dc:Bounds');
      bounds.setAttribute('x', position.x.toString());
      bounds.setAttribute('y', position.y.toString());
      bounds.setAttribute('width', '100');
      bounds.setAttribute('height', '80');
      
      shape.appendChild(bounds);
      plane.appendChild(shape);
    });
    
    diagram.appendChild(plane);
    doc.documentElement.appendChild(diagram);
  }
}
