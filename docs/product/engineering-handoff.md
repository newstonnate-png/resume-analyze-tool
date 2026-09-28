# Engineering Handoff Specification

**Product:** Resume Analyze Tool  
**Market:** New Zealand  
**Status:** Implementation-ready design handoff  
**Date:** 2026-09-28

## 1. Scope

This handoff translates the approved product intent, service blueprint, candidate journey, wireframes, resilience requirements, accessibility requirements, and UX evaluation into buildable behavior.

The MVP provides:

- anonymous Resume Health Check;
- anonymous Full Application Analysis with optional Job Target;
- PDF and DOCX Resume ingestion;
- multimodal Job Capture using screenshots/images, saved job-ad files, permitted URLs, and text fallback;
- deterministic document/platform checks;
- semantic qualification matching;
- explainable findings with provenance and confidence;
- candidate-controlled Proposed Changes;
- Candidate Truth Confirmation where needed;
- Change Review;
- PDF and/or DOCX export according to first-client launch configuration;
- authenticated client/operator administration;
- Evidence Registry review and publication;
- ephemeral candidate data lifecycle.

The MVP does not depend on approved LinkedIn/SEEK partner APIs.

---

# 2. Product outcome

A candidate can:

1. upload a Resume without creating an account;
2. optionally add a Job Target;
3. receive accurate, scoped, evidence-backed findings;
4. understand what is verified versus inferred;
5. confirm facts the system cannot know safely;
6. accept or reject suggested changes;
7. export a revised Resume containing only supported and approved changes.

The product must improve legitimate machine readability and role alignment without claiming to reproduce hidden employer/platform ranking algorithms.

---

# 3. System boundaries

## Product requirement

The browser is a thin client.

Backend owns:
- session lifecycle;
- raw-file lifecycle;
- normalized Resume;
- normalized Job Target;
- Analysis Run orchestration;
- Evidence Registry version used;
- deterministic rules;
- model calls;
- truth validation;
- finding prioritization;
- Change Set;
- export generation;
- audit metadata.

## Stable interfaces

Stable domain boundaries:
- Candidate Session
- Resume
- Job Target
- Analysis Run
- Analysis Result
- Finding
- Proposed Change
- Change Set
- Evidence Registry
- Evidence Proposal
- Organization

## Replaceable adapters

Implementation suggestion:
- PDF/DOCX parser
- OCR/vision provider
- AI/model provider
- storage provider
- auth provider
- deployment platform
- future LinkedIn/SEEK partner adapter

Business logic must not depend directly on a vendor-specific interface.

---

# 4. Candidate screen/component inventory

| ID | Surface | Primary purpose |
|---|---|---|
| C1 | Start + Resume Upload | Explain value/privacy and accept Resume |
| C2 | Resume Processing | Show validation/extraction and focused clarification |
| C3 | Analysis Choice | Choose Resume Health Check or Full Application Analysis |
| C4 | Add the Job | Capture Job Target |
| C5 | Job Target Review | Resolve high-impact ambiguity |
| C6 | Analysis Progress | Show real backend stages and recovery |
| C7 | Report Workspace | Present Top Actions, dimensions, findings |
| C8 | Finding Detail | Explain one finding and Proposed Change |
| C9 | Candidate Truth Confirmation | Confirm unsupported/ambiguous candidate fact |
| C10 | Change Review | Review accepted/rejected changes |
| C11 | Export | Generate/download approved Resume |
| C12 | Session Expired | Explain expiry and restart |
| C13 | Generic Recovery Surface | Stage-specific error/retry handling |

Operator surfaces:
- O1 Admin Sign In
- O2 Operator Dashboard
- O3 Evidence Review Queue
- O4 Evidence Change Review
- O5 Organization Configuration

---

# 5. Candidate Session contract

## Product requirement

Candidate Session is anonymous for MVP.

Minimum server-side fields:

- session_id
- organization_id
- status
- created_at
- last_activity_at
- expires_at
- normalized_resume_id, nullable
- current_job_target_id, nullable
- current_analysis_run_id, nullable
- current_change_set_id, nullable
- version

Raw Resume data must not be part of durable session state after successful normalization.

## Session states

| State | Meaning | Candidate can continue? |
|---|---|---|
| created | Session exists, no valid Resume yet | Yes |
| resume_received | Raw file accepted for processing | Yes |
| resume_normalized | Normalized Resume available | Yes |
| target_optional | Waiting for analysis mode choice | Yes |
| target_captured | Job Target captured | Yes |
| target_review_required | High-impact Job Target ambiguity exists | Yes after review |
| target_confirmed | Job Target safe to analyze | Yes |
| analysis_queued | Run accepted | Yes |
| analyzing | Run in progress | Yes |
| report_ready | Analysis Result available | Yes |
| optimizing | Change Set being reviewed | Yes |
| export_ready | Export generated | Yes |
| expired | Ephemeral candidate data no longer available | No; new session required |

Recoverable operational sub-states may include:
- resume_rejected
- extraction_needs_alternate_input
- target_capture_failed
- model_partial_failure
- export_failed
- rate_limited

## Concurrency

All mutable session resources must use version checking or equivalent optimistic concurrency.

A stale browser tab must not overwrite:
- newer Change Set decisions;
- newer Job Target corrections;
- newer Organization configuration.

---

# 6. Resume Intake contract

## Accepted MVP analysis formats

- PDF
- DOCX

## Recognized but not necessarily fully parsed

- DOC
- RTF
- TXT

The product may explain documented platform compatibility for recognized legacy types without pretending full analyzer support.

## Validation

Before semantic analysis:
- verify actual file type where practical;
- enforce product upload limit;
- detect corruption;
- detect encryption/password protection;
- perform configured security validation;
- detect extractability.

## Failure behavior

Any rejection response must provide:
- reason category;
- whether raw data was retained;
- next available action.

The product must not attempt password bypass or unsafe content execution.

---

# 7. Resume normalization contract

Normalized Resume should represent, where present:

- candidate name
- contact fields
- summary/profile
- work entries
- role titles
- employers
- dates
- responsibilities
- achievements
- metrics
- skills
- education
- certifications
- licences
- other sections
- source locations/provenance where practical
- extraction confidence per material field/section

## Truth rule

Extraction output is evidence, not permission to infer missing candidate facts.

Low-confidence high-impact data must:
- be clarified;
- be re-extracted;
- or remain unknown.

## Raw-file lifecycle

After successful normalization:
- delete raw Resume;
- confirm deletion before candidate UI claims deletion completed.

Deletion failure:
- retries automatically;
- creates operational alert/incident state;
- raw content does not enter ordinary logs.

---

# 8. Analysis choice behavior

After Resume normalization, ask:

**Are you applying for a specific job?**

Actions:
- Add the job
- Check my CV

## Behavior

"Check my CV":
- creates Resume Health Check Analysis Run.

"Add the job":
- routes to Job Capture.

Switching mode before an Analysis Run is created is safe.

Changing mode after a completed report creates a new Analysis Run rather than mutating prior results.

---

# 9. Job Capture Gateway contract

Accepted input adapters for MVP:

- screenshot/image set;
- saved job-ad document/PDF;
- permitted URL;
- pasted text fallback.

Screenshot and saved-file capture are co-primary choices.

## URL policy

For each URL:
1. classify source;
2. determine whether automated retrieval is allowed/supported;
3. fetch only through an approved adapter;
4. fail closed when unsupported or prohibited.

No hidden generic scraper fallback is permitted.

## Capture artifacts

Raw job screenshots/files are temporary.

Delete after successful Job Target normalization unless briefly required for candidate review under the configured retention policy.

---

# 10. Job Target contract

Normalized Job Target may contain:

- source/platform
- source/capture provenance
- title
- employer
- location
- job description
- required qualifications
- preferred qualifications
- skills
- experience requirements
- certifications
- licences
- screening/application questions
- application route
- confidence per extracted material field

## Ambiguity rule

High-confidence extraction proceeds automatically.

Low-confidence high-impact fields require review.

If ambiguity becomes too broad:
- request a better source;
- offer alternate capture;
- or allow downgrade to Resume Health Check.

Candidate choice "Not stated / unsure" is valid.

---

# 11. Analysis Run contract

## Product requirement

Analysis Run is server-authoritative and idempotent.

Minimum fields:

- analysis_run_id
- session_id
- organization_id
- type: health_check | full_application
- normalized_resume_version
- job_target_version, nullable
- evidence_registry_version
- schema_version
- model_provider/model_version metadata where used
- state
- stage_statuses
- created_at
- completed_at
- failure_class, nullable
- partial_result_available

## Primary states

| State | Meaning |
|---|---|
| queued | Accepted, not yet executing |
| running | One or more stages active |
| partially_complete | Safe partial result exists |
| complete | Full requested result available |
| failed_recoverable | Retryable stage failed |
| failed_terminal | Run cannot continue safely |
| cancelled | Candidate/operator cancellation accepted |

## Stages

Health Check:
1. document compatibility
2. parseability
3. structural checks
4. Evidence Registry checks
5. recommendation validation
6. report assembly

Full Application Analysis:
1. document compatibility
2. parseability
3. Job Target comparison
4. qualification matching
5. screening alignment
6. Evidence Registry checks
7. recommendation validation
8. report assembly

## Idempotency

A single candidate action creates one Analysis Run.

Repeated request with same operation key while active:
- returns existing run.

Retry of one failed stage:
- retries that stage or safe dependent stages only;
- does not silently create a second unrelated report.

---

# 12. Evidence authority

Authority order:

1. Verified Platform Rule
2. Deterministic Document Fact
3. Verified Platform Behavior
4. General ATS Heuristic
5. Resume Writing Guidance
6. AI Interpretation

A lower-authority source cannot override a higher-authority source.

Conflict behavior:
- suppress unsupported model claim;
- preserve higher-authority finding;
- record validation failure operationally.

---

# 13. Analysis dimensions

## Document Compatibility

Candidate-facing statuses should be scoped, for example:
- Compatible
- Issue found
- Not checked

## Parseability

Use explicit confidence language, for example:
- High extraction confidence
- Medium extraction confidence
- Low extraction confidence

## Qualification Coverage

For Full Application Analysis:
- Well covered
- Partially covered
- Gaps found
- Not available

## Screening Alignment

Where screening data exists:
- Aligned
- Needs confirmation
- Gaps found
- Not available

Do not use an unscoped universal "Strong", "Good", or "ATS pass" label.

Unavailable is never represented as zero.

---

# 14. Finding contract

Each Finding should include:

- finding_id
- analysis_run_id
- dimension
- severity
- title
- explanation
- candidate-facing evidence label
- canonical Evidence Class
- confidence
- Resume evidence references
- Job Target evidence references, nullable
- source URL(s), where applicable
- recommendation_class
- proposed_change_id, nullable
- status

Severity values:
- critical
- high_impact
- improvement
- optional_polish

## Top Actions

Top Actions are selected from Findings.

Product requirement:
- prioritize material candidate action;
- do not fill quota with weak findings;
- count remains configurable;
- default UI must not assume a specific number until product copy/design finalizes it.

---

# 15. Candidate-facing evidence labels

Canonical mapping:

| Internal evidence | Candidate label |
|---|---|
| platform-rule | Verified platform rule |
| deterministic document fact | Document fact |
| platform-behavior | Verified platform behavior |
| general-ats-heuristic | General ATS guidance |
| writing-guidance | Resume writing guidance |
| inference | AI interpretation |

Detailed provenance is progressive disclosure.

---

# 16. Recommendation classes

Exactly one class per actionable recommendation:

- Rewrite supported evidence
- Clarify existing evidence
- Reposition existing evidence
- Candidate confirmation required
- Missing qualification
- Cannot recommend truthfully

## Meaning

Rewrite supported evidence:
- improves wording without adding new factual substance.

Clarify existing evidence:
- makes already-supported meaning explicit.

Reposition existing evidence:
- changes placement/emphasis, not factual content.

Candidate confirmation required:
- proposal depends on a fact not safely established.

Missing qualification:
- target requirement appears absent.

Cannot recommend truthfully:
- a change would require fabrication or unsupported inference.

---

# 17. Truth and Recommendation Validator

Every model-assisted recommendation passes validation before user display.

Validation must reject or downgrade:
- invented employers;
- invented dates;
- invented metrics;
- invented responsibilities;
- invented achievements;
- invented qualifications;
- invented certifications/licences;
- invented skills;
- model claims contradicting published Evidence Registry rules;
- proposed text whose factual support cannot be traced.

If a useful fact might be true but is not established:
- convert to Candidate confirmation required.

---

# 18. Candidate Truth Confirmation behavior

A confirmation prompt appears only when:
- the answer materially affects a Critical/High Impact finding or Top Action;
- the candidate can answer factually;
- confirmation can unlock a meaningful supported change.

## Interaction

No answer is preselected.

Candidate can:
- Yes
- No
- Cancel/skip

If Yes requires detail:
- request the minimum factual context necessary.

If No:
- preserve gap;
- no guilt/shame copy;
- no repeated pressure.

Changing a prior answer:
- invalidates dependent Proposed Changes;
- marks affected accepted changes as needing review;
- announces update accessibly.

---

# 19. Proposed Change contract

Minimum fields:

- proposed_change_id
- finding_id
- recommendation_class
- target_section
- before_text
- after_text
- rationale
- support_references
- requires_confirmation
- confirmation_id, nullable
- validation_status
- candidate_decision
- version

Candidate decisions:
- pending
- accepted
- rejected

Inline edit support is optional for MVP unless first-client scope requires it.

No Accept All control may include:
- unresolved confirmation;
- unsupported claim;
- invalidated change.

---

# 20. Change Set contract

Change Set is server-authoritative and versioned.

Minimum fields:

- change_set_id
- session_id
- normalized_resume_version
- accepted_change_ids
- rejected_change_ids
- unresolved_change_ids
- version
- updated_at

## Conflict handling

If two browser tabs update different versions:
- reject stale write;
- refresh current state;
- explain conflict.

No silent last-write-wins.

---

# 21. Change Review behavior

Before export, show accepted changes grouped by Resume section.

Each change must expose:
- Before
- After
- Reason
- Acceptance state

If changed span is long:
- provide explicit expansion;
- do not hide changed content behind unrevealable ellipsis.

Export is blocked if:
- an accepted change depends on unresolved confirmation;
- accepted changes conflict;
- Change Set validation fails.

Disabled export must explain the blocker.

---

# 22. Export contract

Input:
- normalized Resume version;
- candidate-confirmed facts;
- exact accepted Change Set version;
- requested output format.

Output:
- validated artifact;
- artifact version metadata;
- short-lived download reference.

## Rules

Export must not:
- call the generative model for new content;
- modify candidate facts;
- add unaccepted changes.

If export fails:
- preserve Analysis Result and Change Set;
- retry export only.

If a candidate changes decisions after export:
- prior artifact is associated with older Change Set version;
- new export required.

Exact launch formats are Organization configuration, expected target:
- PDF
- DOCX

---

# 23. Report Workspace behavior

Information priority:

1. Top Actions
2. analysis dimension summaries
3. Findings
4. Change Set access
5. detailed provenance

## Finding detail

Desktop:
- side drawer/pane where appropriate.

Mobile:
- full-height sheet or dedicated view.

On open:
- focus moves to heading.

On close:
- focus returns to invoker.

Report filter/scroll state should be preserved when practical.

---

# 24. Progress behavior

Progress is stage-based.

Never display a percentage unless measured from real progress.

Status examples:
- Reading your CV
- Checking document compatibility
- Comparing your experience to the role
- Validating recommendations
- Preparing your report

Health Check omits Job Target comparison.

## Slow state

After configured threshold:
- explain the run is taking longer than usual;
- do not invent ETA;
- preserve session state.

---

# 25. Partial-result behavior

When a model-assisted stage fails after deterministic work:

Show:
- available deterministic dimensions;
- verified platform findings;
- explicit partial-report state;
- retry action for missing stage.

Do not:
- show unavailable dimensions as zero;
- imply candidate performed badly because a provider failed.

---

# 26. Cancellation behavior

Use stage-specific labels.

Upload:
- Cancel upload

Resume extraction:
- Stop processing

Analysis:
- Stop analysis

Cancellation response states:
- what stopped;
- what remains available;
- what will be deleted;
- whether retry is possible.

Cancellation never bypasses cleanup.

---

# 27. Session expiry behavior

Exact TTL is configurable.

Before launch, product configuration must define:
- inactivity TTL;
- hard privacy ceiling, if any;
- warning threshold;
- whether activity extends expiry.

## Requirements

- no silent expiry during acknowledged write transaction;
- session-expiry warning is accessible;
- candidate is told what will be lost;
- stale tab cannot write after expiry;
- expired session cannot imply recovery of deleted content.

Preferred product behavior:
- activity-aware expiry within a hard privacy ceiling.

---

# 28. Rate-limit behavior

Rate limiting applies primarily to starting new expensive operations.

If a run was already accepted:
- candidate-level rate limiting should not arbitrarily terminate it midway.

When blocked:
- preserve completed work;
- explain that a new operation is temporarily unavailable;
- show retry condition/time only when reliable;
- do not force account signup.

---

# 29. Pre-upload privacy disclosure

Before the candidate selects/uploads a Resume, show concise disclosure covering:

- the file is processed to analyze the CV/Resume;
- the raw source is temporary;
- AI-assisted analysis may process extracted content when enabled;
- no permanent candidate account is required;
- fuller data-handling information is available.

Candidate content must not be sent to a third-party model until provider retention/data-use configuration is approved for production.

Do not add an unnecessary consent checkbox unless product/legal requirements actually require one.

---

# 30. Accessibility behavior

Target:
- design and implementation should aim for WCAG 2.2 Level AA behavior;
- do not claim conformance before testing.

Required:
- all core actions keyboard-operable;
- no keyboard traps;
- visible and unobscured focus;
- drag has non-drag equivalent;
- semantic headings/landmarks;
- form labels/instructions;
- programmatic names/roles/states;
- polite status announcements;
- errors associated with affected control/stage;
- severity/status not color-only;
- before/after has linear semantic representation;
- drawers/sheets manage and restore focus;
- reduced-motion behavior;
- reflow/zoom support;
- candidate truth confirmation unselected by default;
- accessible session-expiry warning;
- disabled export explains why.

Implementation must test with:
- keyboard-only navigation;
- NVDA + supported Windows browser;
- VoiceOver + Safari on iOS or macOS;
- 200% zoom and narrow reflow;
- touch/motor alternatives.

---

# 31. Responsive rules

Desktop:
- readable constrained page width;
- Report Workspace may use summary rail + main findings area;
- Finding Detail may use side drawer;
- before/after may use columns.

Tablet:
- summary rail collapses;
- avoid 3-column layouts.

Mobile:
- one primary column;
- no ordinary horizontal scrolling;
- sticky primary action allowed only if focus/content is not obscured;
- finding detail becomes full-height sheet/page;
- before/after stacks;
- capture supports native file/photo selection;
- all status meaning remains textual without animation.

---

# 32. Operator authorization

Candidate and operator surfaces are completely separated.

Operator access requires authentication.

Role model should support at least:
- Organization Admin
- Evidence Reviewer

Whether one identity can hold both roles is implementation/configuration.

Candidate Session credentials cannot access admin APIs.

---

# 33. Evidence Registry contract

Published entry minimum fields:

- evidence_id
- platform
- claim/rule
- Evidence Class
- source_url
- checked_at
- applicability
- implementation_rule
- version
- freshness_state
- publication_state
- published_at
- published_by

Production uses published immutable versions only.

Old Analysis Runs keep the version they used.

---

# 34. Evidence update workflow

States:

| State | Meaning |
|---|---|
| discovered | Source monitor detected candidate change |
| fetched | Source retrieved successfully |
| diffed | Difference calculated |
| proposed | Suggested rule/evidence update exists |
| review_required | Human review pending |
| approved | Reviewer accepted proposal |
| published | New immutable registry version active |
| rejected | Proposal rejected |
| stale | Source freshness/fetch problem requires attention |

## Publication rule

Publishing requires:
- authenticated reviewer;
- current proposal version;
- current source version/hash;
- explicit action.

Two reviewers cannot silently publish conflicting next versions.

---

# 35. Operator dashboard

Must expose aggregate operational data without default candidate-content access.

May show:
- analysis count;
- partial failure count;
- export failure count;
- parser health;
- model health;
- Evidence Registry review backlog;
- rate/cost status.

Must not show:
- raw Resume text;
- candidate search/content browser by default.

---

# 36. Organization configuration

Minimum configurable product controls may include:
- branding;
- feature availability;
- upload limit;
- usage ceiling;
- export-format availability;
- session/retention configuration where safe.

Avoid exposing every implementation constant.

Invalid/dangerous configuration must be rejected before save.

---

# 37. Error-response contract

Candidate-facing error payload should provide enough information for UI to answer:

- category
- user-safe message key
- retryable: true/false
- preserved_state
- suggested_next_actions
- correlation/support ID, if useful
- no sensitive Resume content

Internal diagnostic detail must remain server-side and redacted.

---

# 38. Privacy-safe analytics

Analytics must not include raw Resume text, raw Job Target text, candidate name, email, phone number, address, or Proposed Change content.

Recommended product events:

| Event | Purpose |
|---|---|
| candidate_session_started | Funnel entry |
| resume_upload_started | Upload funnel |
| resume_upload_failed | Failure rate by category |
| resume_normalized | Extraction success |
| analysis_mode_selected | Health Check vs Full |
| job_capture_started | Capture funnel |
| job_capture_method_selected | Method usability |
| job_capture_failed | Capture recovery |
| job_target_review_required | Extraction confidence |
| analysis_run_started | Core usage |
| analysis_run_partial | Provider/degradation rate |
| analysis_run_completed | Task success |
| report_viewed | Report engagement |
| finding_opened | Finding engagement |
| truth_confirmation_answered | Confirmation friction, answer content excluded |
| proposed_change_accepted | Optimizer engagement |
| proposed_change_rejected | Optimizer engagement |
| change_review_opened | Pre-export progression |
| export_started | Output funnel |
| export_completed | Output success |
| export_failed | Output reliability |
| session_expired | Expiry friction |
| rate_limit_hit | Abuse/capacity friction |

Allowed event properties:
- Organization ID;
- anonymous session pseudonymous ID;
- analysis type;
- capture method;
- error category;
- dimension;
- severity;
- recommendation class;
- format;
- duration bucket;
- provider/model version identifiers;
- Evidence Registry version.

Do not log candidate-entered answer text in analytics.

---

# 39. Copy matrix

These are required semantic intents. Final copy can be refined without changing behavior.

| State | Required message intent |
|---|---|
| Pre-upload | Raw source temporary, AI-assisted processing may occur, no account required |
| Upload invalid | What is wrong + what to do next |
| OCR fallback | File looks scanned, alternate reading attempt in progress |
| Resume ready | Resume understood enough to continue |
| Job URL unsupported | Automatic import unavailable for this source; offer other capture methods |
| Job ambiguity | Identify exactly what needs confirmation |
| Analysis slow | Taking longer than usual; completed state preserved |
| Partial report | Some AI-assisted checks unavailable; deterministic results complete where shown |
| Finding provenance | Scope whether verified rule, guidance, document fact, or AI interpretation |
| Truth confirmation | Ask neutral factual question; No is valid |
| Export blocked | Explain unresolved confirmation/conflict |
| Export failed | Report/change decisions remain safe; retry export only |
| Session warning | Explain upcoming expiry and consequence |
| Session expired | Content not kept permanently; new upload required |
| Rate limited | New operation temporarily unavailable; current safe work preserved where applicable |

---

# 40. Ethical review

The implementation must preserve:

## Consent and disclosure
- material data-processing behavior disclosed before upload;
- no hidden long-term retention.

## User control
- no silent Resume edits;
- Accept/Reject explicit;
- Candidate owns personal truth.

## Defaults
- truth confirmation has no preselected positive answer;
- no "accept all" for unresolved/unsafe changes.

## Urgency
- no fake countdown;
- session expiry is factual, not pressure copy.

## AI uncertainty
- model inference labeled;
- confidence/provenance available;
- no platform-fact impersonation.

## Cancellation
- candidate can stop upload/analysis where technically practical;
- cleanup still executes.

## Accounts
- no forced candidate signup for core MVP value.

---

# 41. Acceptance criteria

## Resume intake

- Given a valid PDF or DOCX, when the candidate uploads it, then the system validates and normalizes it without requiring an account.
- Given an encrypted/corrupt/unsupported file, when validation fails, then the candidate receives a specific recovery path and semantic analysis does not start.
- Given successful normalization, when raw-file deletion is confirmed, then the UI may state that the original upload was deleted.
- Given deletion failure, then the system retries/alerts and does not falsely claim confirmed deletion.

## Job Capture

- Given screenshot(s) or a saved job-ad file, when capture succeeds, then a normalized Job Target is produced.
- Given a URL whose source is unsupported/prohibited, then the system does not scrape and offers alternate capture methods.
- Given low-confidence high-impact extraction, then analysis does not proceed until the candidate confirms/corrects or chooses a safe fallback.
- Given many ambiguous fields, then the user is offered better capture rather than a giant correction form.

## Analysis Run

- Given one user start action, then at most one active Analysis Run is created for that operation.
- Given a refresh/reconnect, then the frontend restores the server-authoritative run state.
- Given a model-stage failure after deterministic stages completed, then a partial report is available.
- Given an unavailable dimension due to provider failure, then it is not represented as zero.

## Evidence

- Given a model recommendation contradicting a published platform rule, then the published rule wins and the contradictory recommendation is suppressed.
- Given an unpublished Evidence Proposal, then production analysis cannot consume it.
- Given an Analysis Run completed under Evidence Registry version N, then later registry publication does not silently rewrite that historic run.

## Findings and changes

- Every actionable recommendation has one recommendation class.
- Every Proposed Change is traceable to a Finding.
- No Proposed Change containing an unsupported candidate fact may be presented as safe/accept-ready.
- Given Candidate confirmation changes, dependent Proposed Changes are invalidated/re-reviewed.
- Given a stale Change Set write, then the write is rejected rather than overwriting newer state.

## Report

- Top Actions appear before the full Findings list.
- Every visible severity and status has a text representation.
- Candidate-facing evidence labels use the standardized mapping.
- Unavailable and Not applicable are distinct from low score.

## Export

- Export uses exactly one validated Change Set version.
- Export does not invoke generative rewriting.
- Given export failure, then the Analysis Result and Change Set remain intact.
- Given a changed Change Set after an export, then a new artifact must be generated.

## Session/privacy

- Raw Resume and raw Job Capture data are ephemeral under configured policy.
- Ordinary logs/analytics do not contain candidate Resume/Job Target text.
- Expired sessions reject mutation and provide an honest restart path.
- Rate limiting does not force candidate account creation.

## Accessibility

- Core candidate flow is operable by keyboard.
- Focus is visible and not obscured by sticky UI.
- Drawers/sheets return focus to invoker.
- Status updates are available to assistive technology without stealing focus.
- Drag-based screenshot ordering has Move up/Move down alternatives.
- Before/after comparison is readable linearly.
- Truth confirmation is not preselected.
- Disabled export exposes the blocking reason.
- Candidate report remains usable at 200% zoom and mobile reflow.

---

# 42. Test focus

Primary black-box seam:

**Candidate request → Backend Analysis API → structured Analysis Result**

High-value contract tests:
- Resume normalization parity across PDF/DOCX;
- deterministic evidence precedence;
- Job Capture adapter normalization;
- truth validation;
- Analysis Run idempotency;
- partial-result degradation;
- Change Set concurrency;
- Evidence Registry publication concurrency;
- deletion lifecycle;
- export semantic preservation;
- accessibility state semantics.

End-to-end tests should cover:
- Resume Health Check happy path;
- Full Application Analysis happy path;
- unsupported Job URL recovery;
- Job Target ambiguity review;
- model partial failure;
- Candidate confirmation;
- conflicting/stale Change Set;
- export failure/retry;
- session expiry;
- rate limiting;
- keyboard-only flow.

---

# 43. Dependencies that remain configuration choices

These must be selected before production, but the product contract does not require a specific vendor:

- deployment platform;
- relational/session database;
- temporary object storage;
- PDF/DOCX extraction stack;
- OCR/vision provider;
- AI/model provider;
- admin authentication provider;
- telemetry provider;
- exact TTL values;
- exact upload/capture limits;
- exact model retry budget;
- final PDF/DOCX launch format combination.

Provider choices must satisfy the privacy and capability contracts above.

---

# 44. Pending questions / assumptions

These do not block implementation scaffolding but must be resolved before production release:

- exact session inactivity TTL and hard privacy ceiling;
- exact raw-artifact failure retention;
- first-client export-format contract;
- whether inline Proposed Change editing ships in MVP;
- whether normalized Resume reuse for multiple Job Targets is enabled in first release;
- final visual design system/component library;
- final copy polish;
- official supported browser/assistive-technology matrix;
- final operator role granularity;
- production model-provider retention/data-use settings;
- final partner-access outcome for LinkedIn/SEEK;
- analytics retention period;
- whether generated PDF/DOCX documents themselves must meet a defined document-accessibility standard.

---

# 45. Handoff status

The design is ready for engineering decomposition.

Intent phase status:
- intent/orientation: complete
- strategy/research: complete enough for MVP
- blueprint: complete
- journey: complete
- wireframe: complete
- resilience/fortify: complete
- accessibility/include: complete at design level
- evaluation: complete with no unresolved Blocker/High design findings
- engineering specification: complete

After implementation evidence exists, return to UX evaluation/accessibility validation rather than assuming the built product matches this specification.
