/**
 * Rule: subset-only
 * Disallow unsupported BPMN elements - only allow our safe subset
 */

const allowedTypes = [
  'bpmn:Task',
  'bpmn:EndEvent', 
  'bpmn:SequenceFlow',
  'bpmn:BoundaryEvent',
  'bpmn:Lane',
  'bpmn:Participant',
  'bpmn:Process',
  'bpmn:Collaboration',
  'bpmn:TimerEventDefinition'
];

export default function subsetOnly() {
  function check(node: any, reporter: any) {
    if (node.$type && !allowedTypes.includes(node.$type)) {
      reporter.report(node.id, `Element type '${node.$type}' is not allowed in this editor. Only Tasks, End Events, Sequence Flows, Boundary Timers, and Lanes are supported.`);
    }

    // Additional check for boundary events - only timer boundary events allowed
    if (node.$type === 'bpmn:BoundaryEvent') {
      const hasTimerDefinition = node.eventDefinitions && 
        node.eventDefinitions.some((def: any) => def.$type === 'bpmn:TimerEventDefinition');
      
      if (!hasTimerDefinition) {
        reporter.report(node.id, 'Only Timer Boundary Events are allowed');
      }
    }
  }

  return {
    check
  };
}
