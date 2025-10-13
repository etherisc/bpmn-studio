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

    // Find initial state (task with no incoming flows)
    const initial = this.findInitialState(tasks, sequenceFlows);
    if (!initial) {
      throw new Error('No initial state found (task with no incoming flows)');
    }

    // Build states
    const states = this.buildStates(tasks, endEvents, sequenceFlows, boundaryEvents);

    // Build metadata
    const metadata = this.buildMetadata(lanes);

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
    let process = doc.querySelector('process');
    if (!process) {
      process = doc.querySelector('bpmn\\:process, bpmn2\\:process');
    }
    return process;
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

  private findInitialState(
    tasks: Array<{ id: string, element: Element }>, 
    sequenceFlows: Array<{ id: string, source: string, target: string, element: Element }>
  ): string | null {
    // First, check if there's a Start Event pointing to a task
    const startEvents = this.extractStartEvents(tasks[0]?.element.ownerDocument?.documentElement || document);
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
    boundaryEvents: Array<{ id: string, attachedTo: string, element: Element }>
  ): Record<string, StateNode> {
    const states: Record<string, StateNode> = {};

    // Process tasks
    tasks.forEach(task => {
      const stateName = this.getDataAttribute(task.element, 'data-state-name') || task.id;
      const elementId = this.getDataAttribute(task.element, 'data-element-id');
      
      const state: StateNode = {
        type: 'task'
      };

      if (elementId) {
        state.id = elementId;
      }

      // Add transitions
      const outgoingFlows = sequenceFlows.filter(flow => flow.source === task.id);
      if (outgoingFlows.length > 0) {
        state.on = {};
        
        outgoingFlows.forEach(flow => {
          const eventName = this.getDataAttribute(flow.element, 'data-event');
          if (eventName) {
            const targetStateName = this.getTargetStateName(flow.target, tasks, endEvents);
            if (targetStateName) {
              const transition: TransitionSpec = { target: targetStateName };
              
              const flowId = this.getDataAttribute(flow.element, 'data-flow-id');
              const guard = this.getDataAttribute(flow.element, 'data-guard');
              const actions = this.getDataAttribute(flow.element, 'data-actions');
              
              if (flowId) transition.id = flowId;
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
        state.timers = attachedTimers.map(timer => this.buildTimerSpec(timer.element)).filter(t => t) as TimerSpec[];
      }

      states[stateName] = state;
    });

    // Process end events
    endEvents.forEach(endEvent => {
      const stateName = this.getDataAttribute(endEvent.element, 'data-state-name') || endEvent.id;
      const elementId = this.getDataAttribute(endEvent.element, 'data-element-id');
      
      const state: StateNode = {
        type: 'end'
      };

      if (elementId) {
        state.id = elementId;
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

  private buildTimerSpec(boundaryElement: Element): TimerSpec | null {
    const timerId = this.getDataAttribute(boundaryElement, 'data-timer-id');
    const timerType = this.getDataAttribute(boundaryElement, 'data-timer-type') as 'DURATION' | 'DATE';
    const event = this.getDataAttribute(boundaryElement, 'data-event');

    if (!timerId || !timerType || !event) {
      return null;
    }

    const timer: TimerSpec = {
      id: timerId,
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

  private buildMetadata(lanes: Array<{ name: string, flowNodeRefs: string[] }>): any {
    const metadata: any = {};

    if (lanes.length > 0) {
      metadata.lanes = {};
      lanes.forEach(lane => {
        metadata.lanes[lane.name] = lane.flowNodeRefs;
      });
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
