/**
 * Unit tests for custom bpmnlint validation rules
 */

import { describe, it, expect } from 'vitest';
import subsetOnly from '../src/editor/validation/rules/subset-only';
import singleInitialTask from '../src/editor/validation/rules/single-initial-task';
// import deterministicTransitions from '../src/editor/validation/rules/deterministic-transitions';
import terminalNoOutgoing from '../src/editor/validation/rules/terminal-no-outgoing';
import timerValid from '../src/editor/validation/rules/timer-valid';
// import uniqueIds from '../src/editor/validation/rules/unique-ids';
import stateNameValid from '../src/editor/validation/rules/state-name-valid';

// Mock reporter for testing
class MockReporter {
  issues: Array<{ id: string, message: string }> = [];
  
  report(id: string, message: string) {
    this.issues.push({ id, message });
  }
  
  clear() {
    this.issues = [];
  }
}

describe('subset-only rule', () => {
  const rule = subsetOnly();
  const reporter = new MockReporter();

  it('should allow valid BPMN elements', () => {
    reporter.clear();
    
    const validElements = [
      { $type: 'bpmn:Task', id: 'task1' },
      { $type: 'bpmn:EndEvent', id: 'end1' },
      { $type: 'bpmn:SequenceFlow', id: 'flow1' },
      { $type: 'bpmn:BoundaryEvent', id: 'boundary1', eventDefinitions: [{ $type: 'bpmn:TimerEventDefinition' }] },
      { $type: 'bpmn:Lane', id: 'lane1' },
      { $type: 'bpmn:Participant', id: 'participant1' },
      { $type: 'bpmn:Process', id: 'process1' }
    ];

    validElements.forEach(element => {
      rule.check(element, reporter);
    });

    expect(reporter.issues).toHaveLength(0);
  });

  it('should reject invalid BPMN elements', () => {
    reporter.clear();
    
    const invalidElements = [
      { $type: 'bpmn:StartEvent', id: 'start1' },
      { $type: 'bpmn:Gateway', id: 'gateway1' },
      { $type: 'bpmn:SubProcess', id: 'subprocess1' }
    ];

    invalidElements.forEach(element => {
      rule.check(element, reporter);
    });

    expect(reporter.issues.length).toBeGreaterThan(0);
    expect(reporter.issues[0].message).toContain('not allowed in this editor');
  });

  it('should reject non-timer boundary events', () => {
    reporter.clear();
    
    const nonTimerBoundary = {
      $type: 'bpmn:BoundaryEvent',
      id: 'boundary1',
      eventDefinitions: [{ $type: 'bpmn:MessageEventDefinition' }]
    };

    rule.check(nonTimerBoundary, reporter);

    expect(reporter.issues).toHaveLength(1);
    expect(reporter.issues[0].message).toContain('Only Timer Boundary Events are allowed');
  });
});

describe('single-initial-task rule', () => {
  const rule = singleInitialTask();
  const reporter = new MockReporter();

  it('should pass with exactly one initial task', () => {
    reporter.clear();
    
    const process = {
      $type: 'bpmn:Process',
      id: 'process1',
      flowElements: [
        { $type: 'bpmn:Task', id: 'task1', incoming: [] },
        { $type: 'bpmn:Task', id: 'task2', incoming: ['flow1'] },
        { $type: 'bpmn:EndEvent', id: 'end1' }
      ]
    };

    rule.check(process, reporter);

    expect(reporter.issues).toHaveLength(0);
  });

  it('should fail with no initial tasks', () => {
    reporter.clear();
    
    const process = {
      $type: 'bpmn:Process',
      id: 'process1',
      flowElements: [
        { $type: 'bpmn:Task', id: 'task1', incoming: ['flow1'] },
        { $type: 'bpmn:Task', id: 'task2', incoming: ['flow2'] }
      ]
    };

    rule.check(process, reporter);

    expect(reporter.issues).toHaveLength(1);
    expect(reporter.issues[0].message).toContain('exactly one initial task');
  });

  it('should fail with multiple initial tasks', () => {
    reporter.clear();
    
    const process = {
      $type: 'bpmn:Process',
      id: 'process1',
      flowElements: [
        { $type: 'bpmn:Task', id: 'task1', incoming: [] },
        { $type: 'bpmn:Task', id: 'task2', incoming: [] }
      ]
    };

    rule.check(process, reporter);

    expect(reporter.issues).toHaveLength(2); // One for each duplicate initial task
  });
});

describe('terminal-no-outgoing rule', () => {
  const rule = terminalNoOutgoing();
  const reporter = new MockReporter();

  it('should pass for end event with no outgoing flows', () => {
    reporter.clear();
    
    const endEvent = {
      $type: 'bpmn:EndEvent',
      id: 'end1',
      outgoing: []
    };

    rule.check(endEvent, reporter);

    expect(reporter.issues).toHaveLength(0);
  });

  it('should fail for end event with outgoing flows', () => {
    reporter.clear();
    
    const endEvent = {
      $type: 'bpmn:EndEvent',
      id: 'end1',
      outgoing: ['flow1']
    };

    rule.check(endEvent, reporter);

    expect(reporter.issues).toHaveLength(1);
    expect(reporter.issues[0].message).toContain('cannot have outgoing flows');
  });
});

describe('state-name-valid rule', () => {
  const rule = stateNameValid();
  const reporter = new MockReporter();

  it('should pass for valid state names', () => {
    reporter.clear();
    
    const validTasks = [
      { $type: 'bpmn:Task', id: 'task1', get: (attr: string) => attr === 'data-state-name' ? 'created' : null },
      { $type: 'bpmn:Task', id: 'task2', get: (attr: string) => attr === 'data-state-name' ? 'waiting_approval' : null },
      { $type: 'bpmn:Task', id: 'task3', get: (attr: string) => attr === 'data-state-name' ? 'ready_for_collection' : null }
    ];

    validTasks.forEach(task => {
      rule.check(task, reporter);
    });

    expect(reporter.issues).toHaveLength(0);
  });

  it('should fail for missing state name', () => {
    reporter.clear();
    
    const task = {
      $type: 'bpmn:Task',
      id: 'task1',
      get: (_attr: string) => null
    };

    rule.check(task, reporter);

    expect(reporter.issues).toHaveLength(1);
    expect(reporter.issues[0].message).toContain('must have a state name');
  });

  it('should fail for invalid state name format', () => {
    reporter.clear();
    
    const invalidTasks = [
      { $type: 'bpmn:Task', id: 'task1', get: (attr: string) => attr === 'data-state-name' ? 'Created' : null }, // Capital letter
      { $type: 'bpmn:Task', id: 'task2', get: (attr: string) => attr === 'data-state-name' ? 'waiting-approval' : null }, // Hyphen
      { $type: 'bpmn:Task', id: 'task3', get: (attr: string) => attr === 'data-state-name' ? '1created' : null } // Starts with number
    ];

    invalidTasks.forEach(task => {
      rule.check(task, reporter);
    });

    expect(reporter.issues).toHaveLength(3);
    reporter.issues.forEach(issue => {
      expect(issue.message).toContain('must be snake_case');
    });
  });
});

describe('timer-valid rule', () => {
  const rule = timerValid();
  const reporter = new MockReporter();

  it('should pass for valid duration timer', () => {
    reporter.clear();
    
    const timer = {
      $type: 'bpmn:BoundaryEvent',
      id: 'timer1',
      eventDefinitions: [{ $type: 'bpmn:TimerEventDefinition' }],
      get: (attr: string) => {
        switch (attr) {
          case 'data-timer-id': return 'timeout';
          case 'data-timer-type': return 'DURATION';
          case 'data-iso': return 'P14D';
          case 'data-event': return 'TIMEOUT';
          default: return null;
        }
      }
    };

    rule.check(timer, reporter);

    expect(reporter.issues).toHaveLength(0);
  });

  it('should pass for valid date timer', () => {
    reporter.clear();
    
    const timer = {
      $type: 'bpmn:BoundaryEvent',
      id: 'timer1',
      eventDefinitions: [{ $type: 'bpmn:TimerEventDefinition' }],
      get: (attr: string) => {
        switch (attr) {
          case 'data-timer-id': return 'deadline';
          case 'data-timer-type': return 'DATE';
          case 'data-at': return '2024-12-31T23:59:59Z';
          case 'data-event': return 'DEADLINE_REACHED';
          default: return null;
        }
      }
    };

    rule.check(timer, reporter);

    expect(reporter.issues).toHaveLength(0);
  });

  it('should fail for missing timer attributes', () => {
    reporter.clear();
    
    const incompleteTimer = {
      $type: 'bpmn:BoundaryEvent',
      id: 'timer1',
      eventDefinitions: [{ $type: 'bpmn:TimerEventDefinition' }],
      get: (_attr: string) => null
    };

    rule.check(incompleteTimer, reporter);

    expect(reporter.issues.length).toBeGreaterThan(0);
  });
});
