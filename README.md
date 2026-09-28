# Resume Analyze Tool

New Zealand-first web application for evidence-backed Resume analysis.

This repository is being built as tracer-bullet vertical slices. The current implementation covers **issue #3: Anonymous Resume Intake to Normalized Resume**.

## What works now

- anonymous Candidate Session creation;
- accessible PDF/DOCX upload UI;
- deterministic file validation and safe error responses;
- temporary raw-file storage with deletion before success is reported;
- PDF/DOCX text extraction adapters;
- server-side normalized Resume data;
- focused clarification for ambiguous employment end dates;
- refresh/reconnect recovery from server-authoritative session state;
- cancellation signaling;
- privacy-safe funnel telemetry that excludes Resume content.

Later tickets add Resume Health Check, Job Target capture, application analysis, optimization, export, and operator workflows.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open `http://localhost:8787`.

Useful commands:

```bash
npm run typecheck
npm test
npm run build
```

Configuration is documented in `.env.example`.

## Architecture

The frontend is intentionally thin. Session state, document processing, normalization, privacy lifecycle, and later analysis logic live behind the backend API, consistent with `docs/adr/0001-backend-owned-analysis-pipeline.md`.

The current Candidate Session store is in-memory for this first vertical slice. Its interface is backend-owned so a durable adapter can replace it when later operational/deployment tickets require persistence beyond a single process lifetime.

## Privacy

Raw Resume files are placed in a private temporary directory only during processing and are deleted before a successful normalized result is returned. Candidate content is not written to ordinary logs or analytics by the application.

Production infrastructure and third-party providers must still satisfy the stronger privacy/retention requirements in `docs/product/engineering-handoff.md` before release.
