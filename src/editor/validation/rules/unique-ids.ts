/**
 * Rule: unique-ids
 * All element/timer/flow IDs must be unique
 */

export default function uniqueIds() {
  function check(node: any, reporter: any) {
    if (node.$type === 'bpmn:Process') {
      const ids = new Map<string, string[]>();
      
      // Collect all IDs from the process
      collectIds(node, ids);
      
      // Report duplicates
      ids.forEach((elementIds, id) => {
        if (elementIds.length > 1) {
          elementIds.forEach(elementId => {
            reporter.report(elementId, `Duplicate ID '${id}' found. All IDs must be unique.`);
          });
        }
      });
    }
  }

  function collectIds(element: any, ids: Map<string, string[]>): void {
    // Check element ID
    const elementId = element.get && element.get('data-element-id');
    if (elementId) {
      addId(ids, elementId, element.id);
    }

    // Check flow ID for sequence flows
    if (element.$type === 'bpmn:SequenceFlow') {
      const flowId = element.get && element.get('data-flow-id');
      if (flowId) {
        addId(ids, flowId, element.id);
      }
    }

    // Check timer ID for boundary events
    if (element.$type === 'bpmn:BoundaryEvent') {
      const timerId = element.get && element.get('data-timer-id');
      if (timerId) {
        addId(ids, timerId, element.id);
      }
    }

    // Recursively check child elements
    if (element.flowElements) {
      element.flowElements.forEach((child: any) => collectIds(child, ids));
    }
  }

  function addId(ids: Map<string, string[]>, id: string, elementId: string): void {
    if (!ids.has(id)) {
      ids.set(id, []);
    }
    ids.get(id)!.push(elementId);
  }

  return {
    check
  };
}
