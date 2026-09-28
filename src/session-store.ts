import { randomUUID } from "node:crypto";
import type { CandidateSession } from "./domain.js";

export class InMemoryCandidateSessionStore {
  private readonly sessions = new Map<string, CandidateSession>();

  create(organizationId: string, ttlMinutes: number): CandidateSession {
    const now = new Date();
    const session: CandidateSession = {
      id: randomUUID(),
      organizationId,
      status: "created",
      createdAt: now.toISOString(),
      lastActivityAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMinutes * 60_000).toISOString(),
      version: 1,
      clarifications: [],
      cancellationRequested: false,
    };

    this.sessions.set(session.id, session);
    return structuredClone(session);
  }

  get(id: string): CandidateSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    if (Date.now() >= Date.parse(session.expiresAt)) {
      this.sessions.delete(id);
      return undefined;
    }

    return structuredClone(session);
  }

  save(session: CandidateSession): CandidateSession {
    const now = new Date().toISOString();
    const saved: CandidateSession = {
      ...structuredClone(session),
      lastActivityAt: now,
    };
    this.sessions.set(saved.id, saved);
    return structuredClone(saved);
  }
}
