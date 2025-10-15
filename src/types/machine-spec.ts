// MachineSpec v2 — authoritative typing
export type StateValue = string;
export type EventType = string;

export type TransitionSpec =
  | StateValue
  | {
      id?: string;                 // stable flow id
      target: StateValue;
      guard?: string;              // named policy
      actions?: string[];          // named side-effects
      condition?: string;          // optional expression (not enforced now)
    };

export interface TimerSpec {
  id: string;
  type: 'DURATION' | 'DATE';
  iso?: string;                    // when type === 'DURATION'
  at?: string;                     // when type === 'DATE'
  event: EventType;
}

export interface StateNode {
  id?: string;                     // stable element id (task/end)
  type?: 'task' | 'end';           // we only use these two in v1
  on?: Record<EventType, TransitionSpec>;
  timers?: TimerSpec[];
  comments?: CommentSpec[];        // comments attached to this state
  metadata?: Record<string, unknown>;
}

export interface CommentSpec {
  id: string;                      // stable comment id
  text: string;                    // comment content
  attachedTo?: string;             // optional: element id this comment is attached to
  position?: { x: number; y: number }; // comment position
}

export interface MachineSpec {
  id: string;                      // process key
  version: number;                 // definition version
  initial: StateValue;
  metadata?: {
    documentation?: string;
    lanes?: Record<string, string[]>;  // lane -> [stateName,...]
    comments?: CommentSpec[];       // text annotations/comments
  };
  states: Record<StateValue, StateNode>;
}

// Manifest for bundle export
export interface ExportManifest {
  id: string;
  version: number;
  exported_at: string;
  hashes: {
    bpmn: string;
    machine: string;
  };
  tool_version: string;
}
