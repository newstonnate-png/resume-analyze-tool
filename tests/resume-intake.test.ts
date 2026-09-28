import assert from "node:assert/strict";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/config.js";
import type { ResumeFileKind } from "../src/file-validation.js";
import type { ResumeTextExtractor } from "../src/resume-parser.js";
import { RecordingTelemetry } from "../src/telemetry.js";

const normalResumeText = `
Alex Example
alex@example.com
+64 21 555 0101

Summary
Product designer focused on accessible digital services.

Experience
Senior Designer at Acme Ltd
2021 - 2024
Led design work across several product teams.

Education
Bachelor of Design

Skills
Research, Prototyping, Accessibility
`.trim();

class FixedExtractor implements ResumeTextExtractor {
  constructor(private readonly text: string) {}

  async extract(_kind: ResumeFileKind, _buffer: Buffer): Promise<string> {
    return this.text;
  }
}

function testConfig(tempUploadRoot: string): AppConfig {
  return {
    port: 8787,
    host: "127.0.0.1",
    defaultOrganizationId: "test-org",
    sessionTtlMinutes: 60,
    maxResumeBytes: 1024 * 1024,
    tempUploadRoot,
  };
}

async function createSession(app: ReturnType<typeof buildApp>) {
  const response = await app.inject({
    method: "POST",
    url: "/api/sessions",
  });
  assert.equal(response.statusCode, 200);
  return response.json().session;
}

async function uploadPdf(
  app: ReturnType<typeof buildApp>,
  sessionId: string,
  payload = Buffer.from("%PDF-1.4\nsafe"),
) {
  return app.inject({
    method: "POST",
    url: `/api/sessions/${sessionId}/resume`,
    headers: {
      "content-type": "application/pdf",
      "x-file-name": encodeURIComponent("candidate.pdf"),
    },
    payload,
  });
}

test("candidate can upload a PDF and restore the normalized Resume from server state", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-intake-test-"));
  const telemetry = new RecordingTelemetry();
  const app = buildApp({
    config: testConfig(tempRoot),
    extractor: new FixedExtractor(normalResumeText),
    telemetry,
  });

  try {
    const created = await createSession(app);
    assert.equal(created.status, "created");
    assert.equal(created.organizationId, "test-org");

    const upload = await uploadPdf(app, created.id);
    assert.equal(upload.statusCode, 200);

    const uploaded = upload.json().session;
    assert.equal(uploaded.status, "resume_normalized");
    assert.equal(uploaded.rawSourceDeleted, true);
    assert.equal(uploaded.normalizedResume.contact.email, "alex@example.com");
    assert.equal(uploaded.normalizedResume.workEntries.length, 1);
    assert.deepEqual(uploaded.normalizedResume.skills, [
      "Research",
      "Prototyping",
      "Accessibility",
    ]);

    const tempEntries = await readdir(tempRoot);
    assert.equal(tempEntries.length, 0);

    const restored = await app.inject({
      method: "GET",
      url: `/api/sessions/${created.id}`,
    });
    assert.equal(restored.statusCode, 200);
    assert.equal(
      restored.json().session.normalizedResume.id,
      uploaded.normalizedResume.id,
    );

    const telemetryText = JSON.stringify(telemetry.events);
    assert.equal(telemetryText.includes("Alex Example"), false);
    assert.equal(telemetryText.includes("alex@example.com"), false);
    assert.equal(
      telemetry.events.some((event) => event.event === "resume_normalized"),
      true,
    );
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("candidate can upload a DOCX through the same intake contract", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-intake-test-"));
  const app = buildApp({
    config: testConfig(tempRoot),
    extractor: new FixedExtractor(normalResumeText),
    telemetry: new RecordingTelemetry(),
  });

  try {
    const created = await createSession(app);
    const docxLikeBuffer = Buffer.from([
      0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00,
    ]);

    const response = await app.inject({
      method: "POST",
      url: `/api/sessions/${created.id}/resume`,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "x-file-name": encodeURIComponent("candidate.docx"),
      },
      payload: docxLikeBuffer,
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().session.status, "resume_normalized");
    assert.equal(response.json().session.rawSourceDeleted, true);
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("unsupported legacy input returns a structured recovery error", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-intake-test-"));
  const app = buildApp({
    config: testConfig(tempRoot),
    extractor: new FixedExtractor(normalResumeText),
    telemetry: new RecordingTelemetry(),
  });

  try {
    const created = await createSession(app);
    const response = await app.inject({
      method: "POST",
      url: `/api/sessions/${created.id}/resume`,
      headers: {
        "content-type": "text/plain",
        "x-file-name": encodeURIComponent("private-name.txt"),
      },
      payload: "very private resume content",
    });

    assert.equal(response.statusCode, 415);
    const body = response.json();
    assert.equal(body.error.category, "legacy_format_not_analyzed");
    assert.equal(body.error.retryable, true);
    assert.equal(body.error.preservedState, "session");
    assert.equal(JSON.stringify(body).includes("very private resume content"), false);
    assert.equal(JSON.stringify(body).includes("private-name.txt"), false);
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("unsafe and encrypted files are rejected before extraction", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-intake-test-"));
  let extractionCalls = 0;
  const extractor: ResumeTextExtractor = {
    async extract() {
      extractionCalls += 1;
      return normalResumeText;
    },
  };
  const app = buildApp({
    config: testConfig(tempRoot),
    extractor,
    telemetry: new RecordingTelemetry(),
  });

  try {
    const created = await createSession(app);
    const eicar =
      "%PDF-1.4\nX5O!P%@AP[4\\\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!";
    const unsafe = await uploadPdf(app, created.id, Buffer.from(eicar));
    assert.equal(unsafe.statusCode, 422);
    assert.equal(unsafe.json().error.category, "unsafe_file");

    const encrypted = await uploadPdf(
      app,
      created.id,
      Buffer.from("%PDF-1.4\n1 0 obj << /Encrypt 2 0 R >>"),
    );
    assert.equal(encrypted.statusCode, 422);
    assert.equal(encrypted.json().error.category, "encrypted_file");
    assert.equal(extractionCalls, 0);
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("high-impact date uncertainty becomes one focused clarification", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-intake-test-"));
  const ambiguousText = normalResumeText.replace("2021 - 2024", "2021 - ?");
  const app = buildApp({
    config: testConfig(tempRoot),
    extractor: new FixedExtractor(ambiguousText),
    telemetry: new RecordingTelemetry(),
  });

  try {
    const created = await createSession(app);
    const upload = await uploadPdf(app, created.id);
    assert.equal(upload.statusCode, 200);

    const pendingSession = upload.json().session;
    assert.equal(pendingSession.status, "clarification_required");
    assert.equal(pendingSession.rawSourceDeleted, true);
    assert.equal(pendingSession.clarifications.length, 1);

    const clarification = pendingSession.clarifications[0];
    const resolved = await app.inject({
      method: "POST",
      url: `/api/sessions/${created.id}/resume/clarifications/${clarification.id}`,
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({ value: "2025" }),
    });

    assert.equal(resolved.statusCode, 200);
    const resolvedSession = resolved.json().session;
    assert.equal(resolvedSession.status, "resume_normalized");
    assert.equal(
      resolvedSession.normalizedResume.workEntries[0].endDate,
      "2025",
    );
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("candidate can stop an in-flight Resume processing operation", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-intake-test-"));

  let markExtractionStarted;
  const extractionStarted = new Promise((resolve) => {
    markExtractionStarted = resolve;
  });

  let releaseExtraction;
  const blockedExtraction = new Promise((resolve) => {
    releaseExtraction = resolve;
  });

  const extractor: ResumeTextExtractor = {
    async extract() {
      markExtractionStarted();
      return blockedExtraction;
    },
  };

  const app = buildApp({
    config: testConfig(tempRoot),
    extractor,
    telemetry: new RecordingTelemetry(),
  });

  try {
    const created = await createSession(app);
    const uploadPromise = uploadPdf(app, created.id);

    await extractionStarted;

    const cancel = await app.inject({
      method: "POST",
      url: `/api/sessions/${created.id}/resume/cancel`,
    });
    assert.equal(cancel.statusCode, 200);

    releaseExtraction(normalResumeText);

    const upload = await uploadPromise;
    assert.equal(upload.statusCode, 409);
    assert.equal(upload.json().error.category, "processing_cancelled");

    const restored = await app.inject({
      method: "GET",
      url: `/api/sessions/${created.id}`,
    });
    assert.equal(restored.statusCode, 200);
    assert.equal(restored.json().session.status, "created");

    const tempEntries = await readdir(tempRoot);
    assert.equal(tempEntries.length, 0);
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("landing page exposes the privacy disclosure and accessible status channel", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-intake-test-"));
  const app = buildApp({
    config: testConfig(tempRoot),
    extractor: new FixedExtractor(normalResumeText),
    telemetry: new RecordingTelemetry(),
  });

  try {
    const response = await app.inject({ method: "GET", url: "/" });
    assert.equal(response.statusCode, 200);
    assert.match(response.body, /No permanent candidate account is required/);
    assert.match(response.body, /role="status"/);
    assert.match(response.body, /for="resume-file"/);
    assert.match(response.body, /href="\/privacy"/);

    const privacy = await app.inject({ method: "GET", url: "/privacy" });
    assert.equal(privacy.statusCode, 200);
    assert.match(privacy.body, /Raw CV \/ resume upload/);
    assert.match(privacy.body, /AI-assisted analysis/);
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});
