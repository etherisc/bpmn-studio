/**
 * Rule: deterministic-transitions
 * No duplicate event names from the same state
 */

export default function deterministicTransitions() {
  function check(node: any, reporter: any) {
    if (node.$type === 'bpmn:Task') {
      const outgoingFlows = node.outgoing || [];
      const eventNames = new Map<string, string[]>();

      outgoingFlows.forEach((flow: any) => {
        const eventName = flow.get && flow.get('data-event');
        if (eventName) {
          if (!eventNames.has(eventName)) {
            eventNames.set(eventName, []);
          }
          eventNames.get(eventName)!.push(flow.id);
        }
      });

      // Report duplicates
      eventNames.forEach((flowIds, eventName) => {
        if (flowIds.length > 1) {
          flowIds.forEach(flowId => {
            reporter.report(flowId, `Duplicate event '${eventName}' from state '${node.id}'. Each event from a state must be unique.`);
          });
        }
      });
    }
  }

  return {
    check
  };
}
