# Product Intent

**Status:** Working product intent  
**Established:** 2026-09-28

## Product

**Resume Analyze Tool** is a web application for New Zealand job seekers who want to assess and improve a resume before applying through LinkedIn, SEEK, or an employer's downstream application system.

## Problem

Job seekers receive a mixture of real platform constraints, recruiter advice, generic ATS heuristics, and unsupported claims about hidden AI filters. They often cannot tell which advice is a documented platform rule, which is merely a reasonable heuristic, and which is internet folklore.

That uncertainty encourages bad behavior such as keyword stuffing, unnecessary formatting changes, or believing a fabricated "ATS pass score".

## User outcome

A user should be able to upload a resume, optionally provide a target job, select the application platform, and receive an explainable analysis showing:

- whether the document meets known platform constraints,
- whether the resume can be reliably parsed by our system,
- how well the candidate's stated evidence covers the target role's qualifications,
- what relevant evidence appears missing or weak,
- what changes would improve clarity and alignment without inventing facts,
- and which findings are verified platform rules versus general guidance.

## Primary users

Initial focus:

- job seekers applying in New Zealand,
- especially people applying through LinkedIn and SEEK,
- including applications that ultimately flow into an employer's external ATS or recruitment platform.

## Core promise

> Help candidates produce a truthful, machine-readable, role-aligned resume using evidence-backed platform guidance, without pretending to know a proprietary employer's hidden ranking algorithm.

## Evidence stance

The product must distinguish:

1. documented platform rules,
2. documented platform behavior/integrations,
3. general ATS heuristics,
4. resume-writing guidance,
5. model inference.

A recommendation should be traceable to one of these evidence classes.

## Ethical stance

The product optimizes for compatibility, clarity, and truthful representation.

It does **not**:
- invent qualifications or work history,
- encourage deceptive keyword stuffing,
- claim to bypass AI or recruiter controls,
- automate application spam,
- impersonate a recruiter,
- guarantee an interview or ATS outcome.

## Product hypotheses

1. A job-specific qualification-coverage analysis is more useful than a generic resume score.
2. Separating platform rules from heuristics will make recommendations more trustworthy.
3. Showing the evidence behind a finding will help users decide which edits to accept.
4. Parseability diagnostics plus role alignment provide a useful approximation of application readiness without pretending to reproduce a proprietary ATS.

These are hypotheses, not established user-research findings.

## Initial success signals

Candidate-level:
- users can understand why each major recommendation exists,
- users can identify missing evidence versus wording problems,
- users can produce a revised resume without introducing false claims.

Product-level:
- high extraction success across supported documents,
- low rate of unsupported platform-specific claims,
- recommendations remain consistent when the same resume/job input is re-run,
- platform rules can be updated independently when LinkedIn or SEEK documentation changes.

## Non-goals for the first product

- automatic job submission,
- browser automation against LinkedIn or SEEK,
- reverse-engineering proprietary ranking algorithms,
- promising an interview probability,
- a universal score presented as an employer or platform score,
- replacing human career advice for nuanced career decisions.

## Current constraints

- Initial platform focus is LinkedIn and SEEK New Zealand.
- Platform behavior can change, so first-party evidence must be versioned or periodically reviewed.
- External ATS behavior varies by employer and vendor.
- Resume content is sensitive personal information, so architecture must minimize retention and unnecessary exposure.
- AI-generated edits must preserve candidate truth and expose uncertainty.

## Pending architecture decisions

- application architecture and deployment model,
- resume file-processing pipeline,
- supported source formats at launch,
- parser strategy and fallback behavior,
- whether analysis is deterministic, LLM-assisted, or hybrid,
- job-description ingestion,
- rule/evidence storage and versioning,
- scoring model and whether an overall score should exist at all,
- privacy/retention model,
- authentication and account requirement,
- persistence of resumes, reports, and job targets,
- observability and auditability for AI recommendations.

## Next design question

Define the system architecture around the product's evidence model and privacy boundary before designing the detailed UI.
