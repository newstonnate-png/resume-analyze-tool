import { randomUUID } from "node:crypto";
import type { UserSafeErrorBody } from "./domain.js";

export class CandidateFacingError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly category: string,
    public readonly messageKey: string,
    message: string,
    public readonly retryable: boolean,
    public readonly preservedState: string,
    public readonly nextActions: string[],
  ) {
    super(message);
    this.name = "CandidateFacingError";
  }

  toBody(correlationId = randomUUID()): UserSafeErrorBody {
    return {
      error: {
        category: this.category,
        messageKey: this.messageKey,
        message: this.message,
        retryable: this.retryable,
        preservedState: this.preservedState,
        nextActions: this.nextActions,
        correlationId,
      },
    };
  }
}

export function sessionNotFound(): CandidateFacingError {
  return new CandidateFacingError(
    404,
    "session_not_found",
    "session.not_found",
    "This private session is no longer available.",
    false,
    "none",
    ["Start a new analysis."],
  );
}

export function processingCancelled(): CandidateFacingError {
  return new CandidateFacingError(
    409,
    "processing_cancelled",
    "resume.processing_cancelled",
    "Resume processing was stopped.",
    true,
    "session",
    ["Choose the file again when you are ready."],
  );
}
