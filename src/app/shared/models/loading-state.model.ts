/**
 * Unified representation of a data request state.
 * Allows templates to distinguish between "Loading" and "Null Result (404)".
 */
export interface LoadingState<T> {
  loading: boolean;
  data?: T | null;
  error?: any;
}
