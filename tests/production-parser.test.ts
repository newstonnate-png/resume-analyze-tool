import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildApp } from "../src/app.js";
import type { AppConfig } from "../src/config.js";
import { ProductionResumeTextExtractor } from "../src/resume-parser.js";
import { RecordingTelemetry } from "../src/telemetry.js";

const PDF_FIXTURE = Buffer.from(
  "JVBERi0xLjMKJZOMi54gUmVwb3J0TGFiIEdlbmVyYXRlZCBQREYgZG9jdW1lbnQgKG9wZW5zb3VyY2UpCjEgMCBvYmoKPDwKL0YxIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9CYXNlRm9udCAvSGVsdmV0aWNhIC9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nIC9OYW1lIC9GMSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL0NvbnRlbnRzIDcgMCBSIC9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0gL1BhcmVudCA2IDAgUiAvUmVzb3VyY2VzIDw8Ci9Gb250IDEgMCBSIC9Qcm9jU2V0IFsgL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUMgL0ltYWdlSSBdCj4+IC9Sb3RhdGUgMCAvVHJhbnMgPDwKCj4+IAogIC9UeXBlIC9QYWdlCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9QYWdlTW9kZSAvVXNlTm9uZSAvUGFnZXMgNiAwIFIgL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL0F1dGhvciAoYW5vbnltb3VzKSAvQ3JlYXRpb25EYXRlIChEOjIwMjYwOTI4MTQwNzE2KzAwJzAwJykgL0NyZWF0b3IgKGFub255bW91cykgL0tleXdvcmRzICgpIC9Nb2REYXRlIChEOjIwMjYwOTI4MTQwNzE2KzAwJzAwJykgL1Byb2R1Y2VyIChSZXBvcnRMYWIgUERGIExpYnJhcnkgLSBcKG9wZW5zb3VyY2VcKSkgCiAgL1N1YmplY3QgKHVuc3BlY2lmaWVkKSAvVGl0bGUgKHVudGl0bGVkKSAvVHJhcHBlZCAvRmFsc2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0NvdW50IDEgL0tpZHMgWyAzIDAgUiBdIC9UeXBlIC9QYWdlcwo+PgplbmRvYmoKNyAwIG9iago8PAovRmlsdGVyIFsgL0FTQ0lJODVEZWNvZGUgL0ZsYXRlRGVjb2RlIF0gL0xlbmd0aCAxOTAKPj4Kc3RyZWFtCkdhcnAjXyRcJTUkalBZZVQmTXU3aSt1I1IqaD9EL105c0hgMjlLSWNgblkhYERtOj9HPTp1NVBoXUlILTdBJmZIRSs4L2QiT2MzaWFIUW5hXmlDJVVvVkhtVD5DY2xXRlhJUmBpa2o/aSlaMF9WcmE7InFNdGVcLFFbVDRuNV1vVHVdOFNNUWRlaXQyV18ybjVJNjErXmJIJCdgMTtWNTZJMVM3LC9ZPW1MWC1HI0omWFc8dS4sSkdSNmc0fj5lbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDA2MSAwMDAwMCBuIAowMDAwMDAwMDkyIDAwMDAwIG4gCjAwMDAwMDAxOTkgMDAwMDAgbiAKMDAwMDAwMDM5MiAwMDAwMCBuIAowMDAwMDAwNDYwIDAwMDAwIG4gCjAwMDAwMDA3MjEgMDAwMDAgbiAKMDAwMDAwMDc4MCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9JRCAKWzxlMmY5ZDJkMDliMzdhMDQ2N2RiNGM1MmQ0MjYwYzE2Mz48ZTJmOWQyZDA5YjM3YTA0NjdkYjRjNTJkNDI2MGMxNjM+XQolIFJlcG9ydExhYiBnZW5lcmF0ZWQgUERGIGRvY3VtZW50IC0tIGRpZ2VzdCAob3BlbnNvdXJjZSkKCi9JbmZvIDUgMCBSCi9Sb290IDQgMCBSCi9TaXplIDgKPj4Kc3RhcnR4cmVmCjEwNjAKJSVFT0YK",
  "base64",
);

const DOCX_FIXTURE = Buffer.from(
  "UEsDBBQAAAAIAOhwPF3XeYTq8QAAALgBAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH2QzU7DMBCE730Ky9cqccoBIZSkB36OwKE8wMreJFb9J69b2rdn00KREOVozXwz62nXB+/EHjPZGDq5qhspMOhobBg7+b55ru6koALBgIsBO3lEkut+0W6OCUkwHKiTUynpXinSE3qgOiYMrAwxeyj8zKNKoLcworppmlulYygYSlXmDNkvhGgfcYCdK+LpwMr5loyOpHg4e+e6TkJKzmoorKt9ML+Kqq+SmsmThyabaMkGqa6VzOL1jh/0lSfK1qB4g1xewLNRfcRslIl65xmu/0/649o4DFbjhZ/TUo4aiXh77+qL4sGG71+06jR8/wlQSwMEFAAAAAgA6HA8XSAbhuqyAAAALgEAAAsAAABfcmVscy8ucmVsc43Puw6CMBQG4J2naM4uBQdjDIXFmLAafICmPZRGeklbL7y9HRzEODie23fyN93TzOSOIWpnGdRlBQStcFJbxeAynDZ7IDFxK/nsLDJYMELXFs0ZZ57yTZy0jyQjNjKYUvIHSqOY0PBYOo82T0YXDE+5DIp6Lq5cId1W1Y6GTwPagpAVS3rJIPSyBjIsHv/h3ThqgUcnbgZt+vHlayPLPChMDB4uSCrf7TKzQHNKuorZvgBQSwMEFAAAAAgA6HA8XRq1uMfqAAAAygEAABEAAAB3b3JkL2RvY3VtZW50LnhtbI2RwWrDMAyG730K4XvjNJQxQpKusO60w2DbA3i2mhpi2cjukr79nIzeNsjlt2Tx/YJfzWFyA3wjR+upFbuiFICkvbHUt+Lz42X7KCAmRUYNnrAVN4zi0G2asTZeXx1SguxAsR5bcUkp1FJGfUGnYuEDUp6dPTuVcsu9HD2bwF5jjHmBG2RVlg/SKUui2wBk1y9vbnO5NKHLwrOk7jjgBKdJuTBgI+efWXnR8CehMvGEv0ShvVtHnaaAbHMGK7e8I1nP8IzR9oQMKsFRO4TXZNYZVGW1gy3kZ/8/EFGnN5ZLSPKe0lzdr9D9AFBLAQIUAxQAAAAIAOhwPF3XeYTq8QAAALgBAAATAAAAAAAAAAAAAACAAQAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQDFAAAAAgA6HA8XSAbhuqyAAAALgEAAAsAAAAAAAAAAAAAAIABIgEAAF9yZWxzLy5yZWxzUEsBAhQDFAAAAAgA6HA8XRq1uMfqAAAAygEAABEAAAAAAAAAAAAAAIAB/QEAAHdvcmQvZG9jdW1lbnQueG1sUEsFBgAAAAADAAMAuQAAABYDAAAAAA==",
  "base64",
);

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
  const response = await app.inject({ method: "POST", url: "/api/sessions" });
  assert.equal(response.statusCode, 200);
  return response.json().session;
}

test("production PDF adapter extracts real PDF bytes through the intake API", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-parser-test-"));
  const app = buildApp({
    config: testConfig(tempRoot),
    extractor: new ProductionResumeTextExtractor(),
    telemetry: new RecordingTelemetry(),
  });

  try {
    const session = await createSession(app);
    const response = await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/resume`,
      headers: {
        "content-type": "application/pdf",
        "x-file-name": encodeURIComponent("candidate.pdf"),
      },
      payload: PDF_FIXTURE,
    });

    assert.equal(response.statusCode, 200);
    const normalized = response.json().session.normalizedResume;
    assert.equal(normalized.contact.name, "Alex Example");
    assert.equal(normalized.contact.email, "alex@example.com");
    assert.equal(normalized.workEntries[0].title, "Senior Designer");
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test("production DOCX adapter extracts real DOCX bytes through the intake API", async () => {
  const tempRoot = await mkdtemp(join(tmpdir(), "resume-parser-test-"));
  const app = buildApp({
    config: testConfig(tempRoot),
    extractor: new ProductionResumeTextExtractor(),
    telemetry: new RecordingTelemetry(),
  });

  try {
    const session = await createSession(app);
    const response = await app.inject({
      method: "POST",
      url: `/api/sessions/${session.id}/resume`,
      headers: {
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "x-file-name": encodeURIComponent("candidate.docx"),
      },
      payload: DOCX_FIXTURE,
    });

    assert.equal(response.statusCode, 200);
    const normalized = response.json().session.normalizedResume;
    assert.equal(normalized.contact.name, "Alex Example");
    assert.equal(normalized.contact.email, "alex@example.com");
    assert.equal(normalized.workEntries[0].title, "Senior Designer");
  } finally {
    await app.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
});
