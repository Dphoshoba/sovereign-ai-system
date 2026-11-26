import { RuntimeState } from "./runtime-state-machine";
import { RUNTIME_TRANSITION_MATRIX } from "./transition-matrix";

export class StateMachine {
  private currentState: RuntimeState;

  constructor(initialState: RuntimeState = 'RECEIVED') {
    this.currentState = initialState;
  }

  public getState(): RuntimeState {
    return this.currentState;
  }

  public transitionTo(nextState: RuntimeState): void {
    const matrix = RUNTIME_TRANSITION_MATRIX[this.currentState];

    if (!matrix.allowed.includes(nextState)) {
      throw new Error(`INVALID_STATE_TRANSITION: Transition from ${this.currentState} to ${nextState} is forbidden. Allowed: ${matrix.allowed.join(', ')}`);
    }

    this.currentState = nextState;
  }
}
