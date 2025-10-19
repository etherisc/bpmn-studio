/**
 * Rule: terminal-no-outgoing
 * End events cannot have outgoing flows
 */

export default function terminalNoOutgoing() {
  function check(node: any, reporter: any) {
    if (node.$type === 'bpmn:EndEvent') {
      const outgoingFlows = node.outgoing || [];
      
      if (outgoingFlows.length > 0) {
        reporter.report(node.id, 'End Events cannot have outgoing flows. They are terminal states.');
      }
    }
  }

  return {
    check
  };
}


