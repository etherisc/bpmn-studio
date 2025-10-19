/**
 * BPMN XML to MachineSpec v2 JSON conversion
 */

import { MachineSpec, StateNode, TransitionSpec, TimerSpec } from '../types/machine-spec';

export class BpmnToSpecMapper {
  
  async convertBpmnToSpec(bpmnXml: string, processId?: string, version: number = 1): Promise<MachineSpec> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(bpmnXml, 'application/xml');
    
    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid BPMN XML: ' + parserError.textContent);
    }

    // Find the process element
    const processElement = this.findProcessElement(doc);
    if (!processElement) {
      throw new Error('No process element found in BPMN');
    }

    // Extract process ID
    const actualProcessId = processId || processElement.getAttribute('id') || 'process';

    // Parse elements
    const tasks = this.extractTasks(processElement);
    const endEvents = this.extractEndEvents(processElement);
    const sequenceFlows = this.extractSequenceFlows(processElement);
    const boundaryEvents = this.extractBoundaryEvents(processElement);
    const lanes = this.extractLanes(doc);
    const textAnnotations = this.extractTextAnnotations(processElement);
    const associations = this.extractAssociations(processElement);


    // Find initial state (task with no incoming flows)
    const initial = this.findInitialState(tasks, sequenceFlows, processElement);
    if (!initial) {
      throw new Error('No initial state found (task with no incoming flows)');
    }

    // Build states
    const states = this.buildStates(tasks, endEvents, sequenceFlows, boundaryEvents, textAnnotations, associations);

    // Build metadata
    const metadata = this.buildMetadata(lanes, tasks, textAnnotations, associations);

    return {
      id: actualProcessId,
      version,
      initial,
      metadata,
      states
    };
  }

  private findProcessElement(doc: Document): Element | null {
    // Try different namespaces
    let processElement = doc.querySelector('process');
    if (!processElement) {
      processElement = doc.querySelector('bpmn\\:process, bpmn2\\:process');
    }
    
    
    return processElement;
  }

  private extractTasks(processElement: Element): Array<{ id: string, element: Element }> {
    const tasks: Array<{ id: string, element: Element }> = [];
    const taskElements = processElement.querySelectorAll('task, bpmn\\:task, bpmn2\\:task');
    
    taskElements.forEach(task => {
      const id = task.getAttribute('id');
      if (id) {
        tasks.push({ id, element: task });
      }
    });

    return tasks;
  }

  private extractEndEvents(processElement: Element): Array<{ id: string, element: Element }> {
    const endEvents: Array<{ id: string, element: Element }> = [];
    const endEventElements = processElement.querySelectorAll('endEvent, bpmn\\:endEvent, bpmn2\\:endEvent');
    
    endEventElements.forEach(endEvent => {
      const id = endEvent.getAttribute('id');
      if (id) {
        endEvents.push({ id, element: endEvent });
      }
    });

    return endEvents;
  }

  private extractSequenceFlows(processElement: Element): Array<{ id: string, source: string, target: string, element: Element }> {
    const flows: Array<{ id: string, source: string, target: string, element: Element }> = [];
    const flowElements = processElement.querySelectorAll('sequenceFlow, bpmn\\:sequenceFlow, bpmn2\\:sequenceFlow');
    
    flowElements.forEach(flow => {
      const id = flow.getAttribute('id');
      const source = flow.getAttribute('sourceRef');
      const target = flow.getAttribute('targetRef');
      
      if (id && source && target) {
        flows.push({ id, source, target, element: flow });
      }
    });

    return flows;
  }

  private extractBoundaryEvents(processElement: Element): Array<{ id: string, attachedTo: string, element: Element }> {
    const boundaryEvents: Array<{ id: string, attachedTo: string, element: Element }> = [];
    const boundaryElements = processElement.querySelectorAll('boundaryEvent, bpmn\\:boundaryEvent, bpmn2\\:boundaryEvent');
    
    
    boundaryElements.forEach(boundary => {
      const id = boundary.getAttribute('id');
      const attachedTo = boundary.getAttribute('attachedToRef');
      
      
      if (id && attachedTo) {
        boundaryEvents.push({ id, attachedTo, element: boundary });
      }
    });

    return boundaryEvents;
  }

  private extractLanes(doc: Document): Array<{ name: string, flowNodeRefs: string[] }> {
    const lanes: Array<{ name: string, flowNodeRefs: string[] }> = [];
    const laneElements = doc.querySelectorAll('lane, bpmn\\:lane, bpmn2\\:lane');
    
    laneElements.forEach(lane => {
      const name = lane.getAttribute('name') || lane.textContent?.trim() || '';
      const flowNodeRefs: string[] = [];
      
      const flowNodeRefElements = lane.querySelectorAll('flowNodeRef, bpmn\\:flowNodeRef, bpmn2\\:flowNodeRef');
      flowNodeRefElements.forEach(ref => {
        const nodeRef = ref.textContent?.trim();
        if (nodeRef) {
          flowNodeRefs.push(nodeRef);
        }
      });

      if (name) {
        lanes.push({ name, flowNodeRefs });
      }
    });

    return lanes;
  }

  private extractTextAnnotations(processElement: Element): Array<{ id: string, text: string, element: Element }> {
    const textAnnotations: Array<{ id: string, text: string, element: Element }> = [];
    const annotationElements = processElement.querySelectorAll('textAnnotation, bpmn\\:textAnnotation, bpmn2\\:textAnnotation');
    
    annotationElements.forEach(annotation => {
      const id = annotation.getAttribute('id');
      
      // Try to get text from child <bpmn:text> element first, then fallback to textContent or attribute
      let text = '';
      const textElement = annotation.querySelector('text, bpmn\\:text, bpmn2\\:text');
      if (textElement) {
        text = textElement.textContent?.trim() || '';
      } else {
        text = annotation.textContent?.trim() || annotation.getAttribute('text') || '';
      }
      
      if (id && text) {
        textAnnotations.push({ id, text, element: annotation });
      }
    });

    return textAnnotations;
  }

  private extractAssociations(processElement: Element): Array<{ id: string, source: string, target: string, element: Element }> {
    const associations: Array<{ id: string, source: string, target: string, element: Element }> = [];
    const associationElements = processElement.querySelectorAll('association, bpmn\\:association, bpmn2\\:association');
    
    associationElements.forEach(association => {
      const id = association.getAttribute('id');
      const source = association.getAttribute('sourceRef');
      const target = association.getAttribute('targetRef');
      
      if (id && source && target) {
        associations.push({ id, source, target, element: association });
      }
    });

    return associations;
  }

  private findInitialState(
    tasks: Array<{ id: string, element: Element }>, 
    sequenceFlows: Array<{ id: string, source: string, target: string, element: Element }>,
    processElement: Element
  ): string | null {
    // First, check if there's a Start Event pointing to a task
    const startEvents = this.extractStartEvents(processElement);
    if (startEvents.length > 0) {
      const startEvent = startEvents[0];
      const outgoingFlow = sequenceFlows.find(flow => flow.source === startEvent.id);
      if (outgoingFlow) {
        const targetTask = tasks.find(task => task.id === outgoingFlow.target);
        if (targetTask) {
          const stateName = this.getDataAttribute(targetTask.element, 'data-state-name');
          return stateName || targetTask.id;
        }
      }
    }

    // Fallback: Find tasks that are not targets of any sequence flow (excluding flows from start events)
    const nonStartFlows = sequenceFlows.filter(flow => 
      !startEvents.some(start => start.id === flow.source)
    );
    const targetIds = new Set(nonStartFlows.map(flow => flow.target));
    
    for (const task of tasks) {
      if (!targetIds.has(task.id)) {
        const stateName = this.getDataAttribute(task.element, 'data-state-name');
        return stateName || task.id;
      }
    }

    return null;
  }

  private extractStartEvents(processElement: Element): Array<{ id: string, element: Element }> {
    const startEvents: Array<{ id: string, element: Element }> = [];
    const startEventElements = processElement.querySelectorAll('startEvent, bpmn\\:startEvent, bpmn2\\:startEvent');
    
    startEventElements.forEach(startEvent => {
      const id = startEvent.getAttribute('id');
      if (id) {
        startEvents.push({ id, element: startEvent });
      }
    });

    return startEvents;
  }

  private buildStates(
    tasks: Array<{ id: string, element: Element }>,
    endEvents: Array<{ id: string, element: Element }>,
    sequenceFlows: Array<{ id: string, source: string, target: string, element: Element }>,
    boundaryEvents: Array<{ id: string, attachedTo: string, element: Element }>,
    textAnnotations: Array<{ id: string, text: string, element: Element }>,
    associations: Array<{ id: string, source: string, target: string, element: Element }>
  ): Record<string, StateNode> {
    const states: Record<string, StateNode> = {};

    // Process tasks
    tasks.forEach(task => {
      const stateName = this.getDataAttribute(task.element, 'data-state-name') || task.id;
      
      // Use existing data-element-id if present, otherwise auto-generate
      const existingId = this.getDataAttribute(task.element, 'data-element-id');
      const state: StateNode = {
        id: existingId || `task_${stateName}`, // Use existing ID or auto-generate
        type: 'task'
      };

      // Add transitions
      const outgoingFlows = sequenceFlows.filter(flow => flow.source === task.id);
      if (outgoingFlows.length > 0) {
        state.on = {};
        
        outgoingFlows.forEach(flow => {
          const eventName = this.getDataAttribute(flow.element, 'data-event');
          if (eventName) {
            const targetStateName = this.getTargetStateName(flow.target, tasks, endEvents);
            if (targetStateName) {
              // Use existing data-flow-id if present, otherwise auto-generate
              const existingFlowId = this.getDataAttribute(flow.element, 'data-flow-id');
              const transition: TransitionSpec = { 
                id: existingFlowId || `flow_${stateName}_${eventName.toLowerCase()}`, // Use existing ID or auto-generate
                target: targetStateName 
              };
              
              const guard = this.getDataAttribute(flow.element, 'data-guard');
              const actions = this.getDataAttribute(flow.element, 'data-actions');
              
              if (guard) transition.guard = guard;
              if (actions) transition.actions = actions.split(',').map(a => a.trim()).filter(a => a);

              state.on![eventName] = transition;
            }
          }
        });
      }

      // Add timers from boundary events
      const attachedTimers = boundaryEvents.filter(be => be.attachedTo === task.id);
      if (attachedTimers.length > 0) {
        const timerSpecs = attachedTimers.map(timer => this.buildTimerSpec(timer.element, stateName)).filter(t => t) as TimerSpec[];
        if (timerSpecs.length > 0) {
          state.timers = timerSpecs;
        }
      }

      // Add transitions from boundary events (timer outgoing flows)
      attachedTimers.forEach(timer => {
        const timerOutgoingFlows = sequenceFlows.filter(flow => flow.source === timer.id);
        if (timerOutgoingFlows.length > 0) {
          if (!state.on) state.on = {};
          
          // Get the timer event name from the boundary event, not the flow
          const timerEventName = this.getDataAttribute(timer.element, 'data-event');
          if (timerEventName) {
            timerOutgoingFlows.forEach(flow => {
              const targetStateName = this.getTargetStateName(flow.target, tasks, endEvents);
              if (targetStateName) {
                // Use existing data-flow-id if present, otherwise auto-generate
                const existingFlowId = this.getDataAttribute(flow.element, 'data-flow-id');
                const transition: TransitionSpec = { 
                  id: existingFlowId || `flow_${stateName}_${timerEventName.toLowerCase()}`, // Use existing ID or auto-generate
                  target: targetStateName 
                };
                
                const guard = this.getDataAttribute(flow.element, 'data-guard');
                const actions = this.getDataAttribute(flow.element, 'data-actions');
                
                if (guard) transition.guard = guard;
                if (actions) transition.actions = actions.split(',').map(a => a.trim()).filter(a => a);

                state.on![timerEventName] = transition;
              }
            });
          }
        }
      });

      // Add comments from text annotations connected via associations
      const attachedComments = associations
        .filter(assoc => assoc.source === task.id) // Task points to annotation
        .map(assoc => textAnnotations.find(ta => ta.id === assoc.target))
        .filter(ta => ta) as Array<{ id: string, text: string, element: Element }>;
      
      if (attachedComments.length > 0) {
        state.comments = attachedComments.map(comment => ({
          id: comment.id,
          text: comment.text
        }));
      }

      states[stateName] = state;
    });

    // Process end events
    endEvents.forEach(endEvent => {
      const stateName = this.getDataAttribute(endEvent.element, 'data-state-name') || endEvent.id;
      
      // Use existing data-element-id if present, otherwise auto-generate
      const existingId = this.getDataAttribute(endEvent.element, 'data-element-id');
      const state: StateNode = {
        id: existingId || `end_${stateName}`, // Use existing ID or auto-generate
        type: 'end'
      };

      // Add comments from text annotations connected via associations
      const attachedComments = associations
        .filter(assoc => assoc.source === endEvent.id) // End event points to annotation
        .map(assoc => textAnnotations.find(ta => ta.id === assoc.target))
        .filter(ta => ta) as Array<{ id: string, text: string, element: Element }>;
      
      if (attachedComments.length > 0) {
        state.comments = attachedComments.map(comment => ({
          id: comment.id,
          text: comment.text
        }));
      }

      states[stateName] = state;
    });

    return states;
  }

  private getTargetStateName(
    targetId: string, 
    tasks: Array<{ id: string, element: Element }>,
    endEvents: Array<{ id: string, element: Element }>
  ): string | null {
    // Check tasks first
    const task = tasks.find(t => t.id === targetId);
    if (task) {
      return this.getDataAttribute(task.element, 'data-state-name') || task.id;
    }

    // Check end events
    const endEvent = endEvents.find(e => e.id === targetId);
    if (endEvent) {
      return this.getDataAttribute(endEvent.element, 'data-state-name') || endEvent.id;
    }

    return null;
  }

  private buildTimerSpec(boundaryElement: Element, stateName: string): TimerSpec | null {
    const timerType = this.getDataAttribute(boundaryElement, 'data-timer-type') as 'DURATION' | 'DATE';
    const event = this.getDataAttribute(boundaryElement, 'data-event');


    if (!timerType || !event) {
      return null;
    }

    // Use existing data-timer-id if present, otherwise auto-generate
    const existingTimerId = this.getDataAttribute(boundaryElement, 'data-timer-id');
    const timer: TimerSpec = {
      id: existingTimerId || `timer_${stateName}_${event.toLowerCase()}`, // Use existing ID or auto-generate
      type: timerType,
      event
    };

    if (timerType === 'DURATION') {
      const iso = this.getDataAttribute(boundaryElement, 'data-iso');
      if (iso) timer.iso = iso;
    } else if (timerType === 'DATE') {
      const at = this.getDataAttribute(boundaryElement, 'data-at');
      if (at) timer.at = at;
    }

    return timer;
  }

  private buildMetadata(
    lanes: Array<{ name: string, flowNodeRefs: string[] }>,
    tasks: Array<{ id: string, element: Element }>,
    textAnnotations: Array<{ id: string, text: string, element: Element }>,
    associations: Array<{ id: string, source: string, target: string, element: Element }>
  ): any {
    const metadata: any = {};

    if (lanes.length > 0) {
      metadata.lanes = {};
      lanes.forEach(lane => {
        // Map flowNodeRefs (element IDs) to state names
        const stateNames: string[] = [];
        lane.flowNodeRefs.forEach(nodeRef => {
          const task = tasks.find(t => t.id === nodeRef);
          if (task) {
            const stateName = this.getDataAttribute(task.element, 'data-state-name') || task.id;
            stateNames.push(stateName);
          }
        });

        if (stateNames.length > 0) {
          metadata.lanes[lane.name] = stateNames;
        }
      });
    }

    // Only include standalone comments (not attached to any element) in global metadata
    const standaloneComments = textAnnotations.filter(annotation => {
      // Check if this annotation is connected to any element
      return !associations.some(assoc => assoc.target === annotation.id);
    });

    if (standaloneComments.length > 0) {
      metadata.comments = standaloneComments.map(annotation => ({
        id: annotation.id,
        text: annotation.text
      }));
    }

    return metadata;
  }

  private getDataAttribute(element: Element, attributeName: string): string | null {
    // Try different ways to get the attribute
    let value = element.getAttribute(attributeName);
    
    if (!value) {
      // Try with namespace prefix
      value = element.getAttributeNS(null, attributeName);
    }

    if (!value) {
      // Try looking in extensionElements
      const extensionElements = element.querySelector('extensionElements, bpmn\\:extensionElements');
      if (extensionElements) {
        const property = extensionElements.querySelector(`[name="${attributeName}"]`);
        if (property) {
          value = property.getAttribute('value') || property.textContent;
        }
      }
    }

    return value?.trim() || null;
  }
}
