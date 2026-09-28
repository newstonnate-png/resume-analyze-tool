import { randomUUID } from "node:crypto";
import type {
  CandidateSession,
  ResumeClarification,
} from "./domain.js";
import {
  CandidateFacingError,
  processingCancelled,
  sessionNotFound,
} from "./errors.js";
import { validateResumeFile } from "./file-validation.js";
import { normalizeResumeText } from "./resume-normalizer.js";
import type { ResumeTextExtractor } from "./resume-parser.js";
import { InMemoryCandidateSessionStore } from "./session-store.js";
import type { Telemetry } from "./telemetry.js";
import {
  TemporaryUploadStore,
  type TemporaryUpload,
} from "./temp-upload-store.js";

export interface CandidateSessionView {
  id: string;
  organizationId: string;
  status: CandidateSession["status"];
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  version: number;
  normalizedResume?: CandidateSession["normalizedResume"];
  clarifications: ResumeClarification[];
  rawSourceDeleted: boolean;
}

export class ResumeIntakeService {
  constructor(
    private readonly sessions: InMemoryCandidateSessionStore,
    private readonly uploads: TemporaryUploadStore,
    private readonly extractor: ResumeTextExtractor,
    private readonly telemetry: Telemetry,
    private readonly options: {
      organizationId: string;
      sessionTtlMinutes: number;
      maxResumeBytes: number;
    },
  ) {}

  createSession(): CandidateSessionView {
    const session = this.sessions.create(
      this.options.organizationId,
      this.options.sessionTtlMinutes,
    );

    this.telemetry.track("candidate_session_started", {
      organizationId: session.organizationId,
      sessionId: session.id,
      status: session.status,
    });

    return this.toView(session);
  }

  getSession(sessionId: string): CandidateSessionView {
    const session = this.requireSession(sessionId);
    return this.toView(session);
  }

  requestCancellation(sessionId: string): CandidateSessionView {
    const session = this.requireSession(sessionId);

    if (session.activeResumeOperationId) {
      session.cancellationRequested = true;
      session.version += 1;
      this.sessions.save(session);
    }

    return this.toView(session);
  }

  async processResume(input: {
    sessionId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<CandidateSessionView> {
    const session = this.requireSession(input.sessionId);

    if (session.activeResumeOperationId) {
      throw new CandidateFacingError(
        409,
        "resume_processing",
        "resume.already_processing",
        "This CV is already being processed.",
        true,
        "session",
        ["Wait for the current upload to finish or stop it first."],
      );
    }

    const previousStatus = session.status;
    const operationId = randomUUID();
    session.activeResumeOperationId = operationId;
    session.cancellationRequested = false;
    session.status = "resume_received";
    session.version += 1;
    this.sessions.save(session);

    this.telemetry.track("resume_upload_started", {
      organizationId: session.organizationId,
      sessionId: session.id,
      status: session.status,
    });

    let temporaryUpload: TemporaryUpload | undefined;

    try {
      const validated = validateResumeFile({
        fileName: input.fileName,
        mimeType: input.mimeType,
        buffer: input.buffer,
        maxBytes: this.options.maxResumeBytes,
      });

      this.throwIfCancelled(session.id, operationId);
      temporaryUpload = await this.uploads.write(input.buffer);
      this.throwIfCancelled(session.id, operationId);

      let text: string;
      try {
        text = await this.extractor.extract(validated.kind, input.buffer);
      } catch {
        throw new CandidateFacingError(
          422,
          "unreadable_file",
          "resume.unreadable",
          "We could not reliably read this CV.",
          true,
          "session",
          ["Upload a fresh PDF or DOCX copy."],
        );
      }

      if (!text.trim()) {
        throw new CandidateFacingError(
          422,
          "unreadable_file",
          "resume.no_text",
          "We could not find readable text in this CV.",
          true,
          "session",
          ["Upload a digital PDF or DOCX copy instead of an image-only file."],
        );
      }

      this.throwIfCancelled(session.id, operationId);

      const sourceDeletedAt = await this.deleteWithRetry(temporaryUpload);
      temporaryUpload = undefined;

      const normalized = normalizeResumeText({
        text,
        fileName: input.fileName,
        mimeType: validated.mimeType,
        sourceDeletedAt,
      });

      const latest = this.requireSession(session.id);
      this.throwIfCancelled(latest.id, operationId);

      latest.normalizedResume = normalized.resume;
      latest.clarifications = normalized.clarifications;
      latest.status =
        normalized.clarifications.length > 0
          ? "clarification_required"
          : "resume_normalized";
      latest.activeResumeOperationId = undefined;
      latest.cancellationRequested = false;
      latest.version += 1;

      const saved = this.sessions.save(latest);

      this.telemetry.track("resume_normalized", {
        organizationId: saved.organizationId,
        sessionId: saved.id,
        status: saved.status,
      });

      return this.toView(saved);
    } catch (error) {
      if (temporaryUpload) {
        try {
          await this.deleteWithRetry(temporaryUpload);
        } catch {
          error = this.cleanupFailureError();
        }
      }

      const latest = this.sessions.get(session.id);
      if (latest?.activeResumeOperationId === operationId) {
        latest.activeResumeOperationId = undefined;
        latest.cancellationRequested = false;
        latest.status =
          error instanceof CandidateFacingError &&
          error.category === "processing_cancelled"
            ? previousStatus === "resume_normalized" ||
              previousStatus === "clarification_required"
              ? previousStatus
              : "created"
            : previousStatus === "resume_normalized" ||
                previousStatus === "clarification_required"
              ? previousStatus
              : "resume_rejected";
        latest.version += 1;
        this.sessions.save(latest);

        this.telemetry.track("resume_upload_failed", {
          organizationId: latest.organizationId,
          sessionId: latest.id,
          category:
            error instanceof CandidateFacingError
              ? error.category
              : "unexpected_error",
          status: latest.status,
        });
      }

      if (error instanceof CandidateFacingError) throw error;

      throw new CandidateFacingError(
        500,
        "resume_processing_failed",
        "resume.processing_failed",
        "We could not complete CV processing.",
        true,
        "session",
        ["Try the upload again."],
      );
    }
  }

  resolveClarification(input: {
    sessionId: string;
    clarificationId: string;
    value: string;
  }): CandidateSessionView {
    const session = this.requireSession(input.sessionId);
    const clarification = session.clarifications.find(
      (item) => item.id === input.clarificationId,
    );

    if (!clarification || clarification.status !== "pending") {
      throw new CandidateFacingError(
        404,
        "clarification_not_found",
        "resume.clarification_not_found",
        "This clarification is no longer available.",
        false,
        "session",
        ["Refresh the page to load the current CV state."],
      );
    }

    const value = input.value.trim();
    if (!/^(?:19|20)\d{2}$|^(?:present|current)$/i.test(value)) {
      throw new CandidateFacingError(
        422,
        "invalid_clarification",
        "resume.invalid_clarification",
        "Enter a four-digit year or “Present”.",
        true,
        "session",
        ["Correct the end date and submit again."],
      );
    }

    const resume = session.normalizedResume;
    if (!resume) {
      throw new CandidateFacingError(
        409,
        "resume_not_normalized",
        "resume.not_normalized",
        "The normalized CV is not available.",
        true,
        "session",
        ["Upload the CV again."],
      );
    }

    const workEntry = resume.workEntries.find(
      (entry) => entry.id === clarification.workEntryId,
    );
    if (!workEntry) {
      throw new CandidateFacingError(
        409,
        "clarification_target_missing",
        "resume.clarification_target_missing",
        "The field that needed confirmation is no longer available.",
        true,
        "session",
        ["Refresh the page and review the current CV state."],
      );
    }

    workEntry.endDate = /present|current/i.test(value) ? "Present" : value;
    workEntry.confidence = "high";
    clarification.answer = workEntry.endDate;
    clarification.status = "resolved";
    resume.version += 1;

    session.status = session.clarifications.some(
      (item) => item.status === "pending",
    )
      ? "clarification_required"
      : "resume_normalized";
    session.version += 1;

    const saved = this.sessions.save(session);

    this.telemetry.track("resume_clarification_resolved", {
      organizationId: saved.organizationId,
      sessionId: saved.id,
      clarificationKind: clarification.kind,
      status: saved.status,
    });

    return this.toView(saved);
  }

  private requireSession(sessionId: string): CandidateSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw sessionNotFound();
    return session;
  }

  private throwIfCancelled(sessionId: string, operationId: string): void {
    const session = this.requireSession(sessionId);
    if (
      session.activeResumeOperationId !== operationId ||
      session.cancellationRequested
    ) {
      throw processingCancelled();
    }
  }

  private async deleteWithRetry(
    upload: TemporaryUpload,
  ): Promise<string> {
    try {
      return await this.uploads.delete(upload);
    } catch {
      try {
        return await this.uploads.delete(upload);
      } catch {
        throw this.cleanupFailureError();
      }
    }
  }

  private cleanupFailureError(): CandidateFacingError {
    return new CandidateFacingError(
      500,
      "source_cleanup_failed",
      "resume.cleanup_failed",
      "We could not safely finish processing this CV.",
      false,
      "session",
      ["Do not re-upload yet. Try again later."],
    );
  }

  private toView(session: CandidateSession): CandidateSessionView {
    return {
      id: session.id,
      organizationId: session.organizationId,
      status: session.status,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      version: session.version,
      ...(session.normalizedResume
        ? { normalizedResume: session.normalizedResume }
        : {}),
      clarifications: session.clarifications,
      rawSourceDeleted: Boolean(session.normalizedResume?.sourceDeletedAt),
    };
  }
}
