/**
 * Rule: single-initial-task
 * Exactly one task with no incoming flow (initial state)
 */

export default function singleInitialTask() {
  function check(node: any, reporter: any) {
    if (node.$type === 'bpmn:Process') {
      const tasks = node.flowElements?.filter((el: any) => el.$type === 'bpmn:Task') || [];
      const initialTasks = tasks.filter((task: any) => !task.incoming || task.incoming.length === 0);

      if (initialTasks.length === 0) {
        reporter.report(node.id, 'Process must have exactly one initial task (task with no incoming flows)');
      } else if (initialTasks.length > 1) {
        initialTasks.forEach((task: any) => {
          reporter.report(task.id, 'Multiple initial tasks found. Process must have exactly one initial task.');
        });
      }
    }
  }

  return {
    check
  };
}


