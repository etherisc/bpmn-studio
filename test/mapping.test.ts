/**
 * Unit tests for BPMN ↔ MachineSpec mapping functions
 */

import { describe, it, expect } from 'vitest';
import { BpmnToSpecMapper } from '../src/mapping/bpmnToSpec';
import { SpecToBpmnMapper } from '../src/mapping/specToBpmn';
import { MachineSpec } from '../src/types/machine-spec';

describe('BPMN to MachineSpec Mapping', () => {
  const mapper = new BpmnToSpecMapper();

  it('should convert simple BPMN with task and end event', async () => {
    const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="test-process">
    <bpmn:task id="task1" data-state-name="created" data-element-id="task_created" />
    <bpmn:endEvent id="end1" data-element-id="end_completed" />
    <bpmn:sequenceFlow id="flow1" sourceRef="task1" targetRef="end1" data-event="COMPLETE" data-flow-id="flow_complete" />
  </bpmn:process>
</bpmn:definitions>`;

    const spec = await mapper.convertBpmnToSpec(bpmnXml, 'test-process', 1);

    expect(spec.id).toBe('test-process');
    expect(spec.version).toBe(1);
    expect(spec.initial).toBe('created');
    expect(spec.states).toHaveProperty('created');
    expect(spec.states.created.type).toBe('task');
    expect(spec.states.created.id).toBe('task_created');
    expect(spec.states.created.on).toHaveProperty('COMPLETE');
    expect(spec.states.created.on!.COMPLETE).toEqual({
      target: 'end1',
      id: 'flow_complete'
    });
  });

  it('should handle boundary timer events', async () => {
    const bpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="timer-process">
    <bpmn:task id="task1" data-state-name="waiting" />
    <bpmn:boundaryEvent id="timer1" attachedToRef="task1" 
                        data-timer-id="timeout" 
                        data-timer-type="DURATION" 
                        data-iso="P14D" 
                        data-event="TIMEOUT">
      <bpmn:timerEventDefinition />
    </bpmn:boundaryEvent>
    <bpmn:endEvent id="end1" />
  </bpmn:process>
</bpmn:definitions>`;

    const spec = await mapper.convertBpmnToSpec(bpmnXml);

    expect(spec.states.waiting.timers).toBeDefined();
    expect(spec.states.waiting.timers).toHaveLength(1);
    expect(spec.states.waiting.timers![0]).toEqual({
      id: 'timeout',
      type: 'DURATION',
      iso: 'P14D',
      event: 'TIMEOUT'
    });
  });

  it('should throw error for invalid XML', async () => {
    const invalidXml = '<invalid>xml</invalid>';
    
    await expect(mapper.convertBpmnToSpec(invalidXml)).rejects.toThrow();
  });
});

describe('MachineSpec to BPMN Mapping', () => {
  const mapper = new SpecToBpmnMapper();

  it('should convert simple MachineSpec to BPMN', async () => {
    const spec: MachineSpec = {
      id: 'quote',
      version: 1,
      initial: 'created',
      states: {
        created: {
          id: 'task_created',
          type: 'task',
          on: {
            APPROVE: {
              id: 'flow_approve',
              target: 'approved',
              guard: 'isReviewer'
            }
          }
        },
        approved: {
          type: 'end'
        }
      }
    };

    const bpmnXml = await mapper.convertSpecToBpmn(spec);

    expect(bpmnXml).toContain('bpmn:task');
    expect(bpmnXml).toContain('bpmn:endEvent');
    expect(bpmnXml).toContain('bpmn:sequenceFlow');
    expect(bpmnXml).toContain('data-state-name="created"');
    expect(bpmnXml).toContain('data-event="APPROVE"');
    expect(bpmnXml).toContain('data-guard="isReviewer"');
  });

  it('should handle timers in MachineSpec', async () => {
    const spec: MachineSpec = {
      id: 'timer-test',
      version: 1,
      initial: 'waiting',
      states: {
        waiting: {
          type: 'task',
          timers: [{
            id: 'timeout',
            type: 'DURATION',
            iso: 'P7D',
            event: 'TIMEOUT'
          }]
        }
      }
    };

    const bpmnXml = await mapper.convertSpecToBpmn(spec);

    expect(bpmnXml).toContain('bpmn:boundaryEvent');
    expect(bpmnXml).toContain('bpmn:timerEventDefinition');
    expect(bpmnXml).toContain('data-timer-id="timeout"');
    expect(bpmnXml).toContain('data-timer-type="DURATION"');
    expect(bpmnXml).toContain('data-iso="P7D"');
  });

  it('should convert MachineSpec with comments to BPMN', async () => {
    const specWithComments: MachineSpec = {
      id: 'comment-spec',
      version: 1,
      initial: 'processing',
      metadata: {
        comments: [
          {
            id: 'standalone_comment',
            text: 'General process note'
          }
        ]
      },
      states: {
        processing: {
          type: 'task',
          comments: [
            {
              id: 'attached_comment',
              text: 'This is an important processing step'
            }
          ],
          on: {
            COMPLETE: {
              target: 'completed'
            }
          }
        },
        completed: {
          type: 'end'
        }
      }
    };

    const bpmnXml = await mapper.convertSpecToBpmn(specWithComments);

    expect(bpmnXml).toContain('bpmn:textAnnotation');
    expect(bpmnXml).toContain('This is an important processing step');
    expect(bpmnXml).toContain('General process note');
    expect(bpmnXml).toContain('bpmn:association');
  });
});

describe('Round-trip Mapping', () => {
  const bpmnToSpec = new BpmnToSpecMapper();
  const specToBpmn = new SpecToBpmnMapper();

  it('should generate BPMN with correct structure from complex MachineSpec', async () => {
    const complexSpec: MachineSpec = {
      id: 'complex-test',
      version: 1,
      initial: 'start',
      metadata: {
        documentation: 'Complex process test',
        lanes: {
          'User': ['start'],
          'System': ['processing']
        }
      },
      states: {
        start: {
          id: 'task_start',
          type: 'task',
          on: {
            SUBMIT: {
              id: 'flow_submit',
              target: 'processing',
              actions: ['validateInput']
            }
          }
        },
        processing: {
          id: 'task_processing',
          type: 'task',
          on: {
            COMPLETE: {
              target: 'completed'
            }
          },
          timers: [{
            id: 'processing_timeout',
            type: 'DURATION',
            iso: 'PT30M',
            event: 'TIMEOUT'
          }]
        },
        completed: {
          type: 'end'
        }
      }
    };

    const bpmnXml = await specToBpmn.convertSpecToBpmn(complexSpec);

    // Verify BPMN structure contains expected elements
    expect(bpmnXml).toContain('bpmn:task');
    expect(bpmnXml).toContain('bpmn:endEvent');
    expect(bpmnXml).toContain('bpmn:sequenceFlow');
    expect(bpmnXml).toContain('bpmn:startEvent');
    expect(bpmnXml).toContain('data-state-name="start"');
    expect(bpmnXml).toContain('data-state-name="processing"');
    expect(bpmnXml).toContain('data-event="SUBMIT"');
    expect(bpmnXml).toContain('bpmn:boundaryEvent');
    expect(bpmnXml).toContain('data-timer-id="processing_timeout"');
  });

  it('should parse BPMN with start events and find correct initial state', async () => {
    const bpmnWithStartEvent = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="start-test">
    <bpmn:startEvent id="start_event" />
    <bpmn:task id="task_initial" data-state-name="initial_state" />
    <bpmn:task id="task_second" data-state-name="second_state" />
    <bpmn:endEvent id="end_final" data-state-name="final_state" />
    <bpmn:sequenceFlow id="flow_start" sourceRef="start_event" targetRef="task_initial" data-event="START" />
    <bpmn:sequenceFlow id="flow_next" sourceRef="task_initial" targetRef="task_second" data-event="NEXT" />
    <bpmn:sequenceFlow id="flow_end" sourceRef="task_second" targetRef="end_final" data-event="COMPLETE" />
  </bpmn:process>
</bpmn:definitions>`;

    const spec = await bpmnToSpec.convertBpmnToSpec(bpmnWithStartEvent);

    // Should find the task that the start event points to as initial
    expect(spec.initial).toBe('initial_state');
    expect(spec.states).toHaveProperty('initial_state');
    expect(spec.states).toHaveProperty('second_state');
    expect(spec.states).toHaveProperty('final_state');
    expect(spec.states.initial_state.type).toBe('task');
    expect(spec.states.final_state.type).toBe('end');
  });

  it('should handle text annotations as comments in MachineSpec', async () => {
    const bpmnWithComments = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <bpmn:process id="comment-test">
    <bpmn:task id="task1" data-state-name="processing" />
    <bpmn:endEvent id="end1" data-state-name="completed" />
    <bpmn:textAnnotation id="comment1" text="This task processes the application" />
    <bpmn:textAnnotation id="comment2" text="Standalone comment" />
    <bpmn:association id="assoc1" sourceRef="task1" targetRef="comment1" />
    <bpmn:sequenceFlow id="flow1" sourceRef="task1" targetRef="end1" data-event="COMPLETE" />
  </bpmn:process>
</bpmn:definitions>`;

    const spec = await bpmnToSpec.convertBpmnToSpec(bpmnWithComments);

    // Check attached comment is on the processing state
    expect(spec.states.processing.comments).toBeDefined();
    expect(spec.states.processing.comments).toHaveLength(1);
    expect(spec.states.processing.comments![0].text).toBe('This task processes the application');
    
    // Check standalone comment is in global metadata
    expect(spec.metadata?.comments).toBeDefined();
    expect(spec.metadata?.comments).toHaveLength(1);
    expect(spec.metadata?.comments![0].text).toBe('Standalone comment');
  });
});
