import { errorMessage } from "./errors.js";

export type RetryFailureHandler = (attempt: number, error: unknown, remainingAttempts: number) => Promise<void> | void;

export async function withRetries<T>(
  retryLimit: number,
  task: (attempt: number) => Promise<T>,
  onFailure?: RetryFailureHandler
): Promise<{ value: T; attempts: number }> {
  const maxAttempts = Math.max(1, Math.min(4, retryLimit + 1));
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return { value: await task(attempt), attempts: attempt };
    } catch (error) {
      lastError = error;
      const remaining = maxAttempts - attempt;
      if (remaining <= 0) break;
      await onFailure?.(attempt, error, remaining);
    }
  }

  throw new Error(errorMessage(lastError));
}
