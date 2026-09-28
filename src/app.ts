import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Fastify, { type FastifyInstance } from "fastify";
import { loadConfig, type AppConfig } from "./config.js";
import { CandidateFacingError } from "./errors.js";
import { ProductionResumeTextExtractor, type ResumeTextExtractor } from "./resume-parser.js";
import { ResumeIntakeService } from "./resume-intake-service.js";
import { InMemoryCandidateSessionStore } from "./session-store.js";
import {
  ConsolePrivacySafeTelemetry,
  type Telemetry,
} from "./telemetry.js";
import { TemporaryUploadStore } from "./temp-upload-store.js";

export interface BuildAppOptions {
  config?: AppConfig;
  extractor?: ResumeTextExtractor;
  telemetry?: Telemetry;
  sessions?: InMemoryCandidateSessionStore;
  uploads?: TemporaryUploadStore;
  publicRoot?: string;
}

function candidateErrorForMissingFileName(): CandidateFacingError {
  return new CandidateFacingError(
    400,
    "missing_file_name",
    "resume.file_name_missing",
    "We could not identify the selected file.",
    true,
    "session",
    ["Choose the PDF or DOCX again."],
  );
}

function decodeFileName(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) throw candidateErrorForMissingFileName();

  try {
    return decodeURIComponent(value);
  } catch {
    throw candidateErrorForMissingFileName();
  }
}

function contentTypeWithoutParameters(
  header: string | undefined,
): string {
  return header?.split(";")[0]?.trim().toLowerCase() || "application/octet-stream";
}

function bodyAsBuffer(body: unknown): Buffer {
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === "string") return Buffer.from(body);

  throw new CandidateFacingError(
    400,
    "invalid_upload_body",
    "resume.invalid_upload_body",
    "We could not read the uploaded file.",
    true,
    "session",
    ["Choose the file again and retry."],
  );
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const config = options.config ?? loadConfig();
  const sessions = options.sessions ?? new InMemoryCandidateSessionStore();
  const uploads =
    options.uploads ?? new TemporaryUploadStore(config.tempUploadRoot);
  const extractor = options.extractor ?? new ProductionResumeTextExtractor();
  const telemetry = options.telemetry ?? new ConsolePrivacySafeTelemetry();
  const publicRoot = options.publicRoot ?? join(process.cwd(), "public");

  const intake = new ResumeIntakeService(
    sessions,
    uploads,
    extractor,
    telemetry,
    {
      organizationId: config.defaultOrganizationId,
      sessionTtlMinutes: config.sessionTtlMinutes,
      maxResumeBytes: config.maxResumeBytes,
    },
  );

  const app = Fastify({
    logger: false,
    bodyLimit: config.maxResumeBytes,
    genReqId: () => randomUUID(),
  });

  app.addContentTypeParser(
    "*",
    { parseAs: "buffer" },
    (_request, body, done) => done(null, body),
  );

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "no-referrer");
    reply.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'",
    );
    return payload;
  });

  app.get("/api/health", async () => ({ ok: true }));

  app.post("/api/sessions", async (_request, reply) => {
    reply.header("Cache-Control", "no-store");
    return { session: intake.createSession() };
  });

  app.get("/api/sessions/:sessionId", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    reply.header("Cache-Control", "no-store");
    return { session: intake.getSession(sessionId) };
  });

  app.post("/api/sessions/:sessionId/resume", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const fileName = decodeFileName(request.headers["x-file-name"]);
    const mimeType = contentTypeWithoutParameters(request.headers["content-type"]);
    const buffer = bodyAsBuffer(request.body);

    request.raw.once("aborted", () => {
      try {
        intake.requestCancellation(sessionId);
      } catch {
        // The response channel is already gone. Cleanup remains owned by the
        // processing service and does not depend on reporting this failure.
      }
    });

    reply.header("Cache-Control", "no-store");
    const session = await intake.processResume({
      sessionId,
      fileName,
      mimeType,
      buffer,
    });

    return { session };
  });

  app.post(
    "/api/sessions/:sessionId/resume/cancel",
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };
      reply.header("Cache-Control", "no-store");
      return { session: intake.requestCancellation(sessionId) };
    },
  );

  app.post(
    "/api/sessions/:sessionId/resume/clarifications/:clarificationId",
    async (request, reply) => {
      const { sessionId, clarificationId } = request.params as {
        sessionId: string;
        clarificationId: string;
      };
      const body = request.body as { value?: unknown } | undefined;

      if (typeof body?.value !== "string") {
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

      reply.header("Cache-Control", "no-store");
      return {
        session: intake.resolveClarification({
          sessionId,
          clarificationId,
          value: body.value,
        }),
      };
    },
  );

  const sendAsset = async (
    reply: Parameters<Parameters<FastifyInstance["get"]>[1]>[1],
    fileName: string,
    contentType: string,
  ) => {
    const content = await readFile(join(publicRoot, fileName), "utf8");
    return reply
      .header("Cache-Control", "no-store")
      .type(contentType)
      .send(content);
  };

  app.get("/", async (_request, reply) =>
    sendAsset(reply, "index.html", "text/html; charset=utf-8"),
  );
  app.get("/app.js", async (_request, reply) =>
    sendAsset(reply, "app.js", "application/javascript; charset=utf-8"),
  );
  app.get("/styles.css", async (_request, reply) =>
    sendAsset(reply, "styles.css", "text/css; charset=utf-8"),
  );
  app.get("/favicon.ico", async (_request, reply) => reply.code(204).send());

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof CandidateFacingError) {
      reply.status(error.statusCode).send(error.toBody());
      return;
    }

    if ((error as { code?: string }).code === "FST_ERR_CTP_BODY_TOO_LARGE") {
      const safeError = new CandidateFacingError(
        413,
        "file_too_large",
        "resume.too_large",
        "This CV is larger than the current upload limit.",
        true,
        "session",
        ["Choose a smaller PDF or DOCX file."],
      );
      reply.status(413).send(safeError.toBody());
      return;
    }

    const safeError = new CandidateFacingError(
      500,
      "unexpected_error",
      "system.unexpected",
      "We could not complete this step.",
      true,
      "session",
      ["Try again."],
    );
    reply.status(500).send(safeError.toBody());
  });

  return app;
}
