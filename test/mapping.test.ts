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
});

describe('Round-trip Mapping', () => {
  const bpmnToSpec = new BpmnToSpecMapper();
  const specToBpmn = new SpecToBpmnMapper();

  it('should preserve semantics in round-trip conversion', async () => {
    const originalSpec: MachineSpec = {
      id: 'roundtrip-test',
      version: 1,
      initial: 'start',
      metadata: {
        documentation: 'Test process',
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

    // Convert to BPMN and back
    const bpmnXml = await specToBpmn.convertSpecToBpmn(originalSpec);
    const convertedSpec = await bpmnToSpec.convertBpmnToSpec(bpmnXml, originalSpec.id, originalSpec.version);

    // Check core properties are preserved
    expect(convertedSpec.id).toBe(originalSpec.id);
    expect(convertedSpec.version).toBe(originalSpec.version);
    expect(convertedSpec.initial).toBe(originalSpec.initial);
    
    // Check states are preserved
    expect(Object.keys(convertedSpec.states)).toEqual(Object.keys(originalSpec.states));
    
    // Check transitions are preserved
    expect(convertedSpec.states.start.on).toBeDefined();
    expect(convertedSpec.states.start.on!.SUBMIT).toBeDefined();
    expect(convertedSpec.states.start.on!.SUBMIT).toMatchObject({
      target: 'processing'
    });
    
    // Check timers are preserved
    expect(convertedSpec.states.processing.timers).toBeDefined();
    expect(convertedSpec.states.processing.timers).toHaveLength(1);
    expect(convertedSpec.states.processing.timers![0]).toMatchObject({
      id: 'processing_timeout',
      type: 'DURATION',
      iso: 'PT30M',
      event: 'TIMEOUT'
    });
  });
});
