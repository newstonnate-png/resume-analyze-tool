# Product Intent

**Status:** Working product intent  
**Established:** 2026-09-28  
**Last refined:** 2026-09-28

## Product

**Resume Analyze Tool** is a web application for New Zealand job seekers who want to improve the likelihood that their resume is successfully parsed, understood, and matched by automated application systems and recruiter workflows used around LinkedIn, SEEK, and downstream employer ATS/recruitment software.

The product may be described informally as helping a resume "get through" automated screening. In product and engineering terms, that means **improving legitimate machine readability, qualification alignment, screening compatibility, and recruiter-facing clarity**. It does not mean hiding AI-generated content from anti-fraud or platform detection systems, bypassing access controls, or defeating platform safeguards.

## Problem

Job seekers receive a mixture of real platform constraints, recruiter advice, generic ATS heuristics, and unsupported claims about hidden AI filters. They often cannot tell which advice is a documented platform rule, which is merely a reasonable heuristic, and which is internet folklore.

That uncertainty causes poor decisions such as:
- keyword stuffing,
- removing useful formatting for no evidence-based reason,
- trusting fabricated "ATS pass scores",
- rewriting content in ways that weaken factual accuracy,
- or optimizing for rumored detector behavior instead of the actual job requirements.

## User outcome

A user should be able to upload a resume and receive accurate, factual feedback about what should change.

The product supports two analysis modes:

### Resume Health Check

Resume-only analysis for:
- document compatibility,
- parseability,
- structure,
- evidence clarity,
- platform-specific requirements,
- and factual resume-writing guidance.

### Full Application Analysis

Resume + Job Target analysis for:
- qualification coverage,
- role-specific skills and evidence,
- screening alignment,
- platform/application-route considerations,
- and prioritized changes that improve the specific application.

The flagship experience is **Full Application Analysis**, while Resume Health Check remains useful when the user does not yet have a specific job target.

## Primary users

Initial focus:
- job seekers applying in New Zealand,
- especially people applying through LinkedIn and SEEK,
- including applications that ultimately flow into an employer's external ATS or recruitment platform.

## Core promise

> Help candidates produce a truthful, machine-readable, role-aligned resume that performs well in legitimate automated screening and recruiter workflows, using evidence-backed platform guidance and transparent analysis.

## Evidence stance

The product must distinguish:

1. documented platform rules,
2. documented platform behavior/integrations,
3. general ATS heuristics,
4. resume-writing guidance,
5. model inference.

A recommendation should be traceable to one of these evidence classes.

Platform-specific facts must come from the **Evidence Registry**, not from model memory alone.

## Ethical and product integrity stance

The product optimizes for compatibility, clarity, truthful representation, and successful legitimate screening.

It does **not**:
- invent qualifications or work history,
- encourage deceptive keyword stuffing,
- hide AI-generated content from anti-fraud or platform detection safeguards,
- circumvent platform access controls,
- automate application spam,
- impersonate a recruiter,
- guarantee an interview or ATS outcome,
- represent our own diagnostic scores as hidden LinkedIn, SEEK, or employer scores.

## Product hypotheses

1. A job-specific qualification-coverage analysis is more useful than a generic resume score.
2. Separating platform rules from heuristics will make recommendations more trustworthy.
3. Showing the evidence behind a finding will help users decide which edits to accept.
4. Parseability diagnostics plus role alignment provide a useful approximation of application readiness without pretending to reproduce a proprietary ATS.
5. Automation should remove repetitive candidate work without relying on unauthorized scraping of LinkedIn or SEEK.

These are hypotheses, not established user-research findings.

## Initial success signals

Candidate-level:
- users can understand why each major recommendation exists,
- users can identify missing evidence versus wording problems,
- users can produce a revised resume without introducing false claims,
- users can move from job discovery to analysis with minimal manual copying.

Product-level:
- high extraction success across supported documents,
- low rate of unsupported platform-specific claims,
- recommendations remain consistent when the same resume/job input is re-run,
- platform rules can be updated independently when LinkedIn or SEEK documentation changes,
- automated job ingestion does not depend on prohibited scraping or access-control circumvention.

## Product architecture decisions already made

- **Thin web frontend + backend API.**
- **Hybrid analysis pipeline:** file validation → deterministic extraction → structural checks → evidence/rules engine → semantic job matching → recommendation generation.
- **PDF + DOCX are first-class analysis formats for MVP.**
- **Legacy platform-supported formats** such as DOC, RTF, and TXT can be recognized and explained before full parsing support is added.
- **Evidence Registry is a first-class module** and must support automated freshness/update workflows with human-verifiable provenance.
- **Separate analysis dimensions** rather than a fabricated universal ATS pass probability.
- **Anonymous candidate use by default for MVP**, with ephemeral processing; client/operator administration is a separate authenticated concern.

## Scoring stance

The product may expose separate, explainable dimensions such as:
- Document Compatibility
- Parseability
- Qualification Coverage
- Screening Alignment

A later **Application Readiness** summary may combine these, but it must be presented as our own diagnostic model, never as a LinkedIn/SEEK/employer pass probability.

## Job ingestion stance

Manual copy/paste must not be the primary experience.

However, automation must not depend on unauthorized scraping or automated copying of LinkedIn/SEEK pages.

The architecture should support multiple compliant ingestion channels, for example:
- official platform/partner APIs where approved,
- user-supplied job files, exported pages, screenshots, or documents that can be parsed automatically,
- structured import from supported third-party sources,
- URL ingestion only where the source permits automated retrieval,
- paste as a fallback rather than the flagship workflow.

The exact ingestion strategy remains an architecture decision.

## Privacy stance

Candidate resumes contain sensitive personal information.

For MVP:
- no candidate account is required,
- uploads are processed ephemerally by default,
- source files should be deleted after analysis according to a defined retention policy,
- a short-lived anonymous session may connect the upload to its report,
- client/admin authentication is separate from candidate authentication.

Candidate accounts can be added later for explicitly requested persistence such as saved resumes, saved reports, job history, and cross-device continuity.

## Current constraints

- Initial platform focus is LinkedIn and SEEK New Zealand.
- Platform behavior can change, so first-party evidence must be versioned and periodically reviewed.
- External ATS behavior varies by employer and vendor.
- Resume content is sensitive personal information, so architecture must minimize retention and unnecessary exposure.
- AI-generated edits must preserve candidate truth and expose uncertainty.
- LinkedIn and SEEK automation must respect their access and data-use restrictions.

## Pending architecture decisions

- deployment/provider model,
- resume parser implementation and fallbacks,
- compliant automated Job Target ingestion,
- model/provider strategy and fallback behavior,
- Evidence Registry storage, validation, update cadence, and human review,
- exact data-retention durations,
- report persistence and export,
- client/admin authentication and tenancy,
- observability and auditability for AI recommendations,
- abuse/rate limiting and cost controls.

## Next design question

Define the system boundaries around Job Target ingestion, the Evidence Registry, AI/provider execution, privacy/retention, and client administration before designing the detailed UI.
