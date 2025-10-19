/**
 * Rule: state-name-valid
 * data-state-name required and valid pattern for tasks
 */

export default function stateNameValid() {
  function check(node: any, reporter: any) {
    if (node.$type === 'bpmn:Task') {
      const stateName = node.get && node.get('data-state-name');
      
      if (!stateName) {
        reporter.report(node.id, 'Task must have a state name (data-state-name)');
      } else if (!isValidStateName(stateName)) {
        reporter.report(node.id, 'State name must be snake_case (lowercase letters, numbers, and underscores only)');
      }
    }
  }

  return {
    check
  };
}

function isValidStateName(stateName: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(stateName);
}


