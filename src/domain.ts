export type SessionStatus =
  | "created"
  | "resume_received"
  | "clarification_required"
  | "resume_normalized"
  | "resume_rejected";

export type ExtractionConfidence = "high" | "medium" | "low";

export interface ResumeContact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ResumeWorkEntry {
  id: string;
  title?: string;
  employer?: string;
  startDate?: string;
  endDate?: string;
  sourceLine: number;
  confidence: ExtractionConfidence;
}

export interface ResumeSection {
  kind:
    | "summary"
    | "experience"
    | "education"
    | "skills"
    | "certifications"
    | "other";
  lines: string[];
}

export interface NormalizedResume {
  id: string;
  version: number;
  sourceFileName: string;
  sourceMimeType: string;
  sourceDeletedAt: string;
  normalizedAt: string;
  contact: ResumeContact;
  summary?: string;
  workEntries: ResumeWorkEntry[];
  educationEntries: string[];
  skills: string[];
  sections: ResumeSection[];
  extraction: {
    confidence: ExtractionConfidence;
    warnings: string[];
  };
}

export interface ResumeClarification {
  id: string;
  kind: "employment_end_date";
  prompt: string;
  workEntryId: string;
  status: "pending" | "resolved";
  answer?: string;
}

export interface CandidateSession {
  id: string;
  organizationId: string;
  status: SessionStatus;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  version: number;
  normalizedResume?: NormalizedResume;
  clarifications: ResumeClarification[];
  activeResumeOperationId?: string;
  cancellationRequested: boolean;
}

export interface UserSafeErrorBody {
  error: {
    category: string;
    messageKey: string;
    message: string;
    retryable: boolean;
    preservedState: string;
    nextActions: string[];
    correlationId: string;
  };
}
