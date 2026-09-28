# Domain Context

## Resume

The candidate's employment application document that describes their experience, education, skills, qualifications, and other job-relevant evidence.

**Canonical internal term:** Resume.

The New Zealand-facing UI may use **CV / resume** or **CV** where that is clearer to users. Do not create separate domain concepts for CV and Resume unless a real behavioral distinction emerges.

## Job Target

The specific role against which a Resume is evaluated.

A Job Target may contain:
- platform,
- title,
- employer,
- job description,
- required qualifications,
- preferred qualifications,
- skills,
- certifications or licences,
- screening/application questions,
- and application route.

A Job Target is not limited to manually pasted text. It can be produced by any compliant ingestion channel.

## Resume Health Check

A Resume-only analysis that does not require a Job Target.

It evaluates document compatibility, parseability, structure, evidence clarity, platform-specific requirements, and factual resume-writing guidance.

## Full Application Analysis

The flagship analysis that evaluates a Resume against a Job Target.

It includes qualification coverage, role-specific evidence, screening alignment, and prioritized recommendations for the target application.

## Document Compatibility

Whether the submitted Resume satisfies known file-level constraints for the selected application platform or analysis pipeline.

Examples include supported type, file size, corruption, encryption, or extractability.

## Parseability

How reliably this product can extract structured candidate information from a Resume.

Parseability is **our diagnostic**, not a claim that every external ATS will parse the document identically.

## Qualification Coverage

The extent to which the Resume contains truthful, explicit evidence for the requirements of a Job Target.

Missing Qualification Coverage means evidence is missing or unclear in the Resume. It does not authorize the system to invent that evidence.

## Screening Alignment

How the candidate's known information aligns with supplied screening or application questions.

The system must distinguish between an answer supported by known candidate evidence and an answer that requires the candidate to provide information.

## Evidence Registry

The versioned source of truth for platform-specific rules and documented behavior used by the analyzer.

Each Evidence Registry item should identify:
- platform,
- claim or rule,
- evidence class,
- source URL,
- checked date,
- applicability,
- implementation rule,
- and freshness/update status.

The Evidence Registry may update automatically, but an automated update must remain traceable to its source and review state.

## Evidence Class

The provenance category attached to a finding or recommendation.

Canonical values:
- **platform-rule** — documented requirement from a target platform,
- **platform-behavior** — documented workflow/integration behavior,
- **general-ats-heuristic** — useful ATS guidance that is not guaranteed by the target platform,
- **writing-guidance** — human-facing resume quality guidance,
- **inference** — model-generated interpretation with explicit uncertainty.

## Application Readiness

An optional product-level summary synthesized from explainable analysis dimensions.

Application Readiness is this product's diagnostic summary. It is not a hidden LinkedIn, SEEK, recruiter, or employer ATS score and must never be presented as a guaranteed pass probability.
