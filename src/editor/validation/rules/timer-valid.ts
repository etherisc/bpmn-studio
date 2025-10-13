/**
 * Rule: timer-valid
 * Timers must have valid ISO duration/date and event name
 */

export default function timerValid() {
  function check(node: any, reporter: any) {
    if (node.$type === 'bpmn:BoundaryEvent') {
      const hasTimerDefinition = node.eventDefinitions && 
        node.eventDefinitions.some((def: any) => def.$type === 'bpmn:TimerEventDefinition');
      
      if (hasTimerDefinition) {
        // Check for timer ID
        const timerId = node.get && node.get('data-timer-id');
        if (!timerId) {
          reporter.report(node.id, 'Timer must have a timer ID (data-timer-id)');
        }

        // Check for timer type
        const timerType = node.get && node.get('data-timer-type');
        if (!timerType || !['DURATION', 'DATE'].includes(timerType)) {
          reporter.report(node.id, 'Timer must have a valid timer type: DURATION or DATE');
        }

        // Check for appropriate time specification
        if (timerType === 'DURATION') {
          const iso = node.get && node.get('data-iso');
          if (!iso) {
            reporter.report(node.id, 'Duration timer must have ISO duration (data-iso)');
          } else if (!isValidIsoDuration(iso)) {
            reporter.report(node.id, 'Invalid ISO 8601 duration format');
          }
        } else if (timerType === 'DATE') {
          const at = node.get && node.get('data-at');
          if (!at) {
            reporter.report(node.id, 'Date timer must have datetime (data-at)');
          } else if (!isValidIsoDateTime(at)) {
            reporter.report(node.id, 'Invalid ISO 8601 datetime format');
          }
        }

        // Check for event name
        const eventName = node.get && node.get('data-event');
        if (!eventName) {
          reporter.report(node.id, 'Timer must have an event name (data-event)');
        } else if (!isValidEventName(eventName)) {
          reporter.report(node.id, 'Timer event name must be UPPER_SNAKE_CASE');
        }
      }
    }
  }

  return {
    check
  };
}

function isValidIsoDuration(duration: string): boolean {
  return /^P(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+S)?)?$/.test(duration);
}

function isValidIsoDateTime(datetime: string): boolean {
  try {
    new Date(datetime).toISOString();
    return true;
  } catch {
    return false;
  }
}

function isValidEventName(eventName: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(eventName);
}
