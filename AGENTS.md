# Resume Analyze Tool

Web application for analyzing resumes for ATS compatibility and giving practical feedback before job applications.

Before making product or architecture decisions, read `docs/product/intent.md`. For platform-specific claims, read `docs/research/linkedin-seek-application-ats-standards.md`.

Initial product context:
- Primary market: New Zealand
- Priority job platforms: LinkedIn and SEEK
- Core workflow: upload a resume, analyze ATS/AI-screening risks, surface problematic keywords or phrasing, and suggest corrections
- Treat ATS analysis as evidence-based guidance, not a guarantee of how any employer's private screening system will behave

## Spec maintenance

Specs and product/design docs are living project artifacts.

Whenever research, design work, implementation, testing, platform-policy changes, or newly discovered constraints materially change an established assumption or behavior:

- update the relevant repository spec/document in the same workstream;
- update the parent GitHub spec issue when the change affects MVP scope, behavior, acceptance criteria, architecture, privacy, accessibility, resilience, or platform integration;
- update `CONTEXT.md` when canonical domain language changes;
- add or revise an ADR when an architectural decision materially changes and meets the ADR threshold;
- do not leave known contradictions between implementation and the documented product contract;
- do not wait for a separate documentation pass if the change is already understood.

Minor implementation details that do not change product or architectural behavior do not require spec churn.

## Agent skills

### Issue tracker

Issues and specs are tracked in this repository's GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Matt Pocock triage roles are mapped to ordinary GitHub-style labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: project vocabulary lives in `CONTEXT.md` and architectural decisions live in `docs/adr/`. See `docs/agents/domain.md`.
