import { RuntimeState } from "./runtime-state-machine";

export interface TransitionMatrix {
  [state: string]: {
    allowed: string[];
    forbidden: string[];
  };
}

export const RUNTIME_TRANSITION_MATRIX: TransitionMatrix = {
  RECEIVED: {
    allowed: ['VALIDATING_PACKAGE'],
    forbidden: ['EXECUTING', 'COMPLETED', 'AUDITING'],
  },
  VALIDATING_PACKAGE: {
    allowed: ['LOCK_VALIDATION', 'FAILED'],
    forbidden: ['EXECUTING', 'COMPLETED'],
  },
  LOCK_VALIDATION: {
    allowed: ['PREPARING', 'FAILED'],
    forbidden: ['EXECUTING', 'COMPLETED'],
  },
  PREPARING: {
    allowed: ['PREFLIGHT', 'FAILED'],
    forbidden: ['EXECUTING', 'COMPLETED'],
  },
  PREFLIGHT: {
    allowed: ['READY', 'FAILED'],
    forbidden: ['EXECUTING', 'COMPLETED'],
  },
  READY: {
    allowed: ['EXECUTION_BLOCKED', 'EXECUTING', 'FAILED'],
    forbidden: ['COMPLETED', 'SENSITIVE_SINK'],
  },
  EXECUTION_BLOCKED: {
    allowed: ['AUDITING', 'FAILED'],
    forbidden: ['EXECUTING', 'COMPLETED'],
  },
  EXECUTING: {
    allowed: ['VERIFYING', 'ROLLING_BACK', 'FAILED', 'CANCELLED'],
    forbidden: ['SENSITIVE_SINK', 'S3A_ENTRY'],
  },
  VERIFYING: {
    allowed: ['AUDITING', 'ROLLING_BACK', 'FAILED'],
    forbidden: ['EXECUTING'],
  },
  AUDITING: {
    allowed: ['COMPLETED', 'FAILED'],
    forbidden: ['EXECUTING', 'PREFLIGHT'],
  },
  COMPLETED: {
    allowed: [],
    forbidden: ['S3A_ENTRY', 'RECEIVED'],
  },
  FAILED: {
    allowed: [],
    forbidden: ['COMPLETED', 'EXECUTING'],
  },
  ROLLING_BACK: {
    allowed: ['AUDITING', 'CRITICAL_FAILURE', 'FAILED'],
    forbidden: ['EXECUTING', 'VERIFYING', 'COMPLETED'],
  },
  CRITICAL_FAILURE: {
    allowed: [],
    forbidden: ['COMPLETED', 'EXECUTING', 'VERIFYING'],
  },
  CANCELLED: {
    allowed: [],
    forbidden: ['COMPLETED', 'EXECUTING'],
  },
};
