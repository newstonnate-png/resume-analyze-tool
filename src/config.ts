import { tmpdir } from "node:os";
import { resolve } from "node:path";

export interface AppConfig {
  port: number;
  host: string;
  defaultOrganizationId: string;
  sessionTtlMinutes: number;
  maxResumeBytes: number;
  tempUploadRoot: string;
}

function integerEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(): AppConfig {
  const configuredTempRoot = process.env.RESUME_UPLOAD_TMP_DIR?.trim();

  return {
    port: integerEnv("PORT", 8787),
    host: process.env.HOST?.trim() || "0.0.0.0",
    defaultOrganizationId:
      process.env.DEFAULT_ORGANIZATION_ID?.trim() || "default",
    sessionTtlMinutes: integerEnv("SESSION_TTL_MINUTES", 60),
    maxResumeBytes: integerEnv("MAX_RESUME_BYTES", 5 * 1024 * 1024),
    tempUploadRoot: configuredTempRoot
      ? resolve(configuredTempRoot)
      : resolve(tmpdir(), "resume-analyze-tool"),
  };
}
