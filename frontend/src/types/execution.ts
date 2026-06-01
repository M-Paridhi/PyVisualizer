export type VarType =
  | "int" | "float" | "str" | "bool" | "NoneType"
  | "list" | "tuple" | "dict" | "set"
  | "function" | "class" | "unknown";

export interface VarValue {
  type: VarType | string;
  value?: unknown;
  id?: number;
  items?: VarValue[];
  pairs?: { key: VarValue; value: VarValue }[];
  attrs?: Record<string, VarValue>;
  length?: number;
  truncated?: boolean;
  circular?: boolean;
}

export interface StackFrame {
  function: string;
  line: number;
  locals: Record<string, VarValue>;
}

export type SnapshotEvent = "line" | "return" | "exception";

export interface Snapshot {
  step: number;
  line: number | null;
  event: SnapshotEvent;
  source_line: string;
  globals: Record<string, VarValue>;
  stack: StackFrame[];
  stdout: string;
  return_value?: VarValue;
  exception?: {
    type: string;
    message: string;
    line: number | null;
  };
}

export interface ExecuteResponse {
  success: boolean;
  error?: {
    type: string;
    message: string;
    line?: number | null;
  };
  snapshots: Snapshot[];
  total_steps: number;
}

export type PlayState = "idle" | "playing" | "paused" | "finished";