# Resilience and Edge-Case Specification

**Product:** Resume Analyze Tool  
**Market:** New Zealand  
**Status:** Working resilience specification  
**Date:** 2026-09-28

## Purpose

This document hardens the candidate and operator experience beyond the happy path.

Every important failure state must answer five questions:

1. **What happened?**
2. **What remains safe?**
3. **What can the user do next?**
4. **What data was preserved or deleted?**
5. **Is retry safe, and if so what exactly is retried?**

The product should fail partially whenever possible rather than collapse completely.

---

# Core resilience principles

## 1. Never lose completed safe work because a later stage failed

Examples:
- If model-assisted matching fails, keep deterministic Document Compatibility and Parseability results.
- If export fails, keep the Analysis Result and accepted Change Set.
- If Job Target capture fails, allow Resume Health Check.
- If evidence monitoring fails, keep the last published Evidence Registry.

## 2. Retrying must be idempotent where the user expects one action

Repeated taps, network retries, browser refreshes, or client reconnects must not accidentally:
- create duplicate Analysis Runs;
- charge multiple model requests for the same stage when the original is still active;
- publish an Evidence Registry version twice;
- export multiple conflicting artifacts;
- apply a Proposed Change more than once.

The backend should use stable operation/run identifiers for retryable workflows.

## 3. Candidate truth must never degrade under failure

If the system loses confidence, it should become more conservative.

Failure must never cause:
- unsupported facts to be inserted;
- an unresolved Candidate confirmation to be treated as confirmed;
- low-confidence extraction to become "good enough";
- an unavailable model stage to become a zero score.

## 4. Privacy failure must fail closed

If temporary storage, deletion guarantees, or retention controls are unavailable, do not accept new sensitive uploads into an unmanaged state.

## 5. External dependency failure should be contained

A parser, OCR provider, AI provider, object store, source monitor, or partner API can fail without redefining the whole product as unavailable.

## 6. State shown to the user must reflect backend truth

Do not infer critical workflow state from browser-only flags.

The backend is authoritative for:
- Analysis Run state;
- completed stages;
- accepted/rejected Proposed Changes;
- session expiry;
- export status;
- Evidence Registry publication state.

---

# Candidate state inventory

## C1 Start + Resume Upload

### Empty
Expected default state.

Must show:
- supported primary formats;
- no account required;
- temporary handling summary.

### Uploading
Must show:
- filename;
- progress if measurable;
- cancel;
- no duplicate upload action.

If connection drops:
- retry the upload if supported;
- otherwise restart the upload cleanly;
- never create two active raw Resume artifacts for one candidate action.

### Duplicate file submission
If the same file is selected twice before processing completes:
- reuse or reject the duplicate operation;
- do not launch parallel analyses.

### Very large supported-type file
Before upload where possible, and certainly before expensive processing:
- enforce product limit;
- explain whether the issue is our analyzer limit, platform-specific limit, or both.

### Unsupported extension with valid underlying content
Do not trust extension alone.
Validate actual file type where practical.

### Valid extension with invalid underlying content
Reject as invalid/corrupt.

### Encrypted/password-protected file
Do not attempt unsafe bypass.
Explain that an unlocked copy is required.

### Malware/security validation failure
Do not continue processing.
Do not expose security-tool internals.
Clean temporary artifact according to policy.

### Cancellation during upload
Stop or abandon the upload.
Clean incomplete temporary data.

---

# C2 Resume Processing

## Parser timeout
Safe behavior:
- no semantic analysis starts;
- raw Resume remains only for the short failure-recovery window defined by retention policy;
- candidate can retry extraction or upload another file.

## Parser returns partial structure
If high-impact sections are uncertain:
- mark confidence explicitly;
- trigger focused clarification or alternate extraction;
- do not silently normalize uncertain data as fact.

## OCR fallback fails
Explain that the document could not be read reliably.
Offer:
- another Resume version;
- exported digital PDF/DOCX;
- restart.

## OCR returns conflicting text
Prefer candidate review over automatic merge where the conflict affects:
- dates;
- employer names;
- qualification names;
- role titles;
- metrics.

## Extremely long Resume
The system must:
- bound processing;
- preserve all relevant sections where possible;
- avoid silently truncating without disclosure;
- flag if analysis used a bounded subset.

## Extremely short Resume
Do not interpret absence as extraction failure automatically.
Distinguish:
- valid but sparse Resume;
- unreadable Resume.

## Duplicate employment entries
Do not automatically deduplicate unless confidence is high.
A duplicate may represent:
- promotion;
- overlapping roles;
- repeated contract;
- genuine duplicate.

## Conflicting dates
Surface as ambiguity rather than "correcting" candidate history.

---

# C3 Analysis Choice

## User navigates back after choosing a mode
The Resume normalization should remain intact while the session is valid.

Switching:
- Full Application Analysis → Resume Health Check: safe, no need to discard Resume.
- Resume Health Check → Full Application Analysis before analysis starts: proceed to Job Capture.
- Mode switch after report exists: create a new Analysis Run rather than mutating the completed report.

## Repeated action
Double-tapping "Check my CV" must not start two Analysis Runs.

---

# C4 Job Capture

## Screenshot set is incomplete
If extraction indicates missing context:
- explain what appears missing;
- request additional screenshots;
- keep existing images/order.

## Screenshot set is out of order
Allow reordering before normalization or infer order only with confidence.

## Duplicate screenshots
Detect likely duplicates where practical.
Do not make the candidate manually delete obvious exact duplicates unless necessary.

## Very large screenshot set
Apply a documented capture limit.
Explain how to reduce or split the input.

## Job ad contains multiple roles
Do not guess which role is intended.
Ask the candidate to choose.

## Job ad contains recruiter boilerplate mixed with requirements
The extraction model may classify, but low-confidence high-impact requirements must still route to review.

## URL fetch unsupported
Fail closed.
Offer:
- screenshot;
- saved file;
- paste.

## URL previously supported but now blocked
Do not keep retrying automatically against a newly denied source.
Mark adapter as degraded/unsupported and offer alternatives.

## URL redirects to login/paywall
Do not attempt circumvention.
Offer user-provided capture.

## URL content changes between capture and analysis
Freeze the normalized Job Target used by the Analysis Run.
Do not silently update mid-run.

---

# C5 Job Target Review

## Many ambiguous fields
If ambiguity exceeds a reasonable threshold:
- do not make the user correct a giant generated form;
- recommend better source capture;
- allow downgrade to Resume Health Check.

## Candidate chooses "Not stated / unsure"
This is valid.
The analyzer must preserve uncertainty rather than forcing required/preferred classification.

## Candidate changes a previously confirmed field
If analysis has not started:
- update Job Target.

If analysis has started or completed:
- create a new Analysis Run version rather than retroactively rewriting the old result.

---

# C6 Analysis Progress

## Duplicate submission / repeated button press
Use an idempotency key or stable Analysis Run ID.

The candidate sees one run.

## Browser refresh
If session remains valid:
- restore current server-side stage;
- do not restart completed stages.

## Browser closed
Backend may continue or cancel according to resource policy, but cleanup guarantees remain active.

If the candidate returns while session is valid:
- restore completed state.

## Device sleeps / rotates / resizes
UI state must recover from backend state.
No critical progress may depend on in-memory component state only.

## Slow network
Progress updates may lag, but backend work continues.

UI should say:
- "Still working"
rather than assuming failure solely from delayed polling.

## Stage timeout
Each stage needs:
- bounded execution;
- timeout classification;
- safe retry policy;
- no indefinite "Analyzing..." state.

## Model provider timeout
Return partial deterministic report where available.
Offer targeted retry of missing model-assisted stage.

## Provider returns malformed structured output
Do not pass through.
Retry within bounded policy or degrade gracefully.

## Provider returns contradictory result
Truth/Recommendation Validator and evidence precedence resolve it.
If unresolved, suppress the recommendation.

## Provider returns unsafe fabricated fact
Block it.
Record validation failure operationally without exposing candidate data in logs.

---

# C7 Report Workspace

## No Critical findings
Do not manufacture urgency.
Show zero honestly.

## No Proposed Changes
A report can still be useful.
Explain that no safe rewrite is needed or available.

## Very many findings
The UI must:
- prioritize Top Actions;
- paginate/virtualize or progressively load if needed;
- preserve filters and scroll position.

Do not turn "thorough" into a wall of 100 cards.

## Very long finding explanation
Clamp primary display.
Reveal extended rationale/evidence progressively.

## Missing dimension
If a dimension does not apply:
- hide or label "Not applicable".

If unavailable because of failure:
- label "Unavailable" or "Not completed".

Never show 0 as a placeholder.

## Evidence source is stale
Candidate-facing platform claim should:
- use the last published rule;
- optionally indicate freshness risk if material;
- never use an unpublished proposed update.

## Evidence source becomes unavailable
Existing published evidence remains valid until reviewed/superseded according to governance.
Do not silently remove the finding.

---

# C8 Finding Detail / Proposed Change

## Finding has no safe rewrite
Show the finding without a Proposed Change.

## Proposed Change conflicts with another accepted change
Detect conflict before export.

Resolution:
- explain the conflict;
- let the candidate choose;
- never merge contradictory edits automatically.

## Multiple findings propose edits to the same passage
Compose only if the combined result remains supported and reviewable.
Otherwise force explicit conflict resolution.

## Proposed Change becomes stale after candidate truth update
Revalidate or regenerate only the affected proposal.
Do not silently keep an outdated accepted change.

---

# C9 Candidate Truth Confirmation

## Candidate says No
This must never produce:
- guilt language;
- repeated pressure;
- hidden penalty beyond the factual qualification gap.

## Candidate says Yes but provides no supporting detail
For some low-risk skills, confirmation may be enough to classify as candidate-confirmed evidence.
For claims requiring specifics, request the minimum necessary factual context.

Do not invent:
- years;
- employers;
- projects;
- metrics.

## Candidate changes their answer
Invalidate dependent Proposed Changes and clearly mark them for review.

## Candidate leaves confirmation unresolved
Export may proceed only if unresolved confirmation is not required by accepted changes.

---

# C10 Change Review

## No accepted changes
Allow export of the normalized original only if product scope supports it, or return to findings.
Do not imply optimization occurred.

## Accepted changes are internally inconsistent
Block export until resolved.

Examples:
- two different end dates for one role;
- contradictory skill level;
- duplicate bullet replacements.

## Very large Change Set
Provide:
- section grouping;
- accepted/rejected counts;
- search or collapse if needed.

## Undo after review
Allowed while session is active.
Export must always use the latest accepted Change Set version.

---

# C11 Export

## Export request repeated
Same Change Set version + format may reuse completed artifact or safely create another equivalent artifact.
Must not mutate content.

## Export service timeout
Keep Change Set/report.
Retry only export.

## PDF succeeds / DOCX fails
Offer successful format and retry alternate format independently.

## Export output validation fails
Do not offer corrupt file.
Retry generation or show failure.

## Download link expires
If session remains valid, regenerate/reissue without rerunning analysis.

## User changes accepted edits after export
Mark previous export as based on an older Change Set version.
A new export must be generated.

---

# Session resilience

## Expiry while user is actively editing
Do not expire silently mid-action if an activity-extension policy is allowed.

If hard expiry is required:
- warn before expiry where technically possible;
- prevent starting a long export that cannot finish before expiry, or extend the session transactionally.

Exact TTL remains configurable, but behavior must be explicit.

## Session expires in another tab
Next write action in stale tab must fail safely and explain that the session expired.

## Multiple tabs
Use optimistic versioning on mutable session resources such as Change Set.

If two tabs conflict:
- do not silently last-write-wins on accepted/rejected changes;
- show stale/conflict recovery.

## Reuse Resume for another Job Target
If enabled within the active session:
- create a new Job Target and new Analysis Run;
- do not mutate prior report;
- keep raw Resume deleted;
- reuse normalized Resume only while policy permits.

---

# Network and offline/degraded behavior

## Offline before upload
Disable upload submission with clear connectivity guidance.

## Offline during upload
Show interrupted state.
Retry/resume according to uploader capability.

## Offline during server-side analysis
Backend may continue.

When connection returns:
- restore from server state.

## Offline on completed report
If report is not cached intentionally, explain reconnect requirement.
Do not claim offline persistence the product does not provide.

## Intermittent connectivity during Accept/Reject
Each mutation needs acknowledgment/versioning.
Optimistic UI must roll back on failed persistence.

---

# Rate limiting and abuse controls

## Candidate rate limited
Must answer:
- why action cannot proceed in plain language;
- whether current session/report remains safe;
- when/under what condition retry is possible, if known;
- no forced account signup as the only recovery.

Do not expose anti-abuse internals.

## Limit reached during analysis
Once an Analysis Run is accepted, internal stage completion should not be blocked halfway by a per-request candidate rate limit.

Cost ceilings may still produce controlled partial failure.

## Operator usage ceiling reached
New analyses may be paused.
Existing completed reports and exports should remain accessible while their sessions are valid.

---

# Privacy and data-deletion failure modes

## Raw Resume deletion fails after normalization
This is an operational privacy incident.

Required behavior:
- retry deletion automatically;
- quarantine/reference the artifact for deletion workflow without exposing content;
- alert operations;
- do not silently claim "deleted" to the candidate until deletion is confirmed if the UI makes that claim synchronously.

## Raw Job Capture deletion fails
Same handling as raw Resume artifacts.

## Temporary storage unavailable
Do not accept new uploads if lifecycle guarantees cannot be upheld.

## Sensitive content appears in an error payload
Redaction must occur before centralized logging.
Privacy regression tests are required.

## Third-party model/provider retention unknown
Do not send candidate content until provider retention/data-use posture is explicitly configured and accepted for production use.

---

# Evidence Registry resilience

## Source changed but parser/diff fails
Keep last published version.
Create operational review/failure item.

## Source content becomes contradictory
Do not auto-publish.
Escalate to Evidence Reviewer.

## Source disappears / returns 404
Do not immediately delete published rule.
Mark source unavailable/stale and require review.

## Multiple official sources disagree
Represent the conflict explicitly.
Do not let model inference choose the winner silently.

## Reviewer approves stale proposal after newer proposal exists
Use proposal/version concurrency checks.
Require review against latest source state.

## Two reviewers act concurrently
Publication must be transactional/versioned.
Only one next version can win without explicit reconciliation.

## Bad rule published
Support superseding with a new version.
Historic Analysis Runs retain the Evidence Registry version they used.

Do not retroactively rewrite old reports invisibly.

---

# Operator resilience

## Admin auth expires mid-review
Preserve unsent local draft only if safe.
Publishing requires fresh authorization.

## Evidence proposal has huge diff
Summarize material changes and allow source inspection.
Do not hide large scope under a tiny AI summary.

## Service partially degraded
Dashboard should distinguish:
- Resume parsing degraded;
- model provider degraded;
- export degraded;
- evidence monitoring degraded.

Avoid a single "System down" indicator when only one subsystem is affected.

## Configuration conflict
Use versioning/optimistic concurrency.
Do not silently overwrite another admin's newer settings.

## Dangerous config
Validate before save.

Examples:
- zero-byte upload cap;
- invalid session TTL;
- disabling all export formats;
- provider config missing required secret reference.

---

# Content boundary conditions

The UI and schemas must handle:

- candidate names of unusual length;
- non-ASCII characters;
- Māori names and macrons;
- multi-line addresses;
- no address;
- very long employer names;
- overlapping employment;
- employment gaps;
- multiple concurrent roles;
- contracting/freelance histories;
- academic CV-like long documents;
- zero formal work experience;
- many certifications;
- no education section;
- no skills section;
- tables;
- columns;
- bullet-heavy resumes;
- long URLs;
- multilingual content;
- very long job descriptions;
- jobs with no clear requirement section;
- jobs with dozens of requirements;
- conflicting required/preferred language;
- repeated screening questions;
- no screening questions;
- multiple uploaded screenshots with partial overlap.

The system should not treat unconventional content as inherently invalid.

---

# Localization / internationalization resilience

MVP market is New Zealand, but implementation should avoid fragile assumptions such as:
- ASCII-only names;
- US ZIP/state structures;
- US-only date formats;
- US spelling as validation;
- requiring street address;
- treating "CV" and "Resume" as different domain objects.

New Zealand-facing UI can prefer "CV" while internal canonical term remains Resume.

---

# Destructive and irreversible actions

## Cancel Analysis
If cancellation is available:
- explain whether completed results will remain;
- stop future expensive stages where practical;
- cleanup still runs.

## Start Over
Must require confirmation if it will discard:
- Analysis Result;
- Change Set;
- Job Target;
- session state.

## Publish Evidence Registry version
Operator destructive/high-impact action.
Require clear review of:
- source;
- diff;
- impacted rule;
- version.

## Session expiry
Not user-triggered, but irreversible.
Warn when possible and clearly explain the consequence.

---

# Retry policy

Every retryable operation should define its retry scope.

## Safe automatic retry candidates
- transient network read;
- source monitor fetch;
- model call that did not return a committed result;
- export rendering;
- raw-artifact deletion.

All require bounded retry/backoff.

## User-triggered retry candidates
- Resume extraction;
- OCR fallback;
- Job Target extraction;
- missing model-assisted analysis stage;
- export.

## Never blindly retry
- candidate confirmation;
- Evidence Registry publication;
- changing accepted/rejected Proposed Changes;
- admin configuration writes;
- an operation where prior commit status is unknown.

These require idempotency/version checks first.

---

# Resilience acceptance rules

The implementation is not considered complete if:

- a double click can start duplicate Analysis Runs;
- browser refresh loses server-completed progress;
- an AI outage produces zero scores;
- export failure destroys accepted changes;
- session expiration silently discards in-progress state without explanation;
- URL Job Capture falls back to unauthorized retrieval;
- low-confidence extraction proceeds as fact;
- an unresolved truth confirmation can leak into exported Resume content;
- a stale tab can overwrite a newer Change Set;
- a published Evidence Registry change can be overwritten concurrently;
- raw Resume content appears in normal logs;
- the UI claims raw data was deleted before deletion is confirmed;
- source-monitor failure removes the last published platform rule;
- candidate-facing state depends solely on frontend memory;
- inaccessible status animation is the only indication of progress.

---

# Resilience backlog

Ordered by combined user impact and likelihood.

## P0 — must exist before any real candidate data

1. **Raw data lifecycle enforcement**
   - temporary storage only;
   - confirmed deletion workflow;
   - cleanup retries;
   - fail closed when lifecycle guarantees are unavailable.

2. **Analysis Run idempotency and server-authoritative state**
   - prevent duplicates;
   - restore after refresh/reconnect;
   - stage timeouts;
   - bounded retries.

3. **Truth and Recommendation validation**
   - block unsupported facts;
   - invalidate dependent edits when candidate truth changes;
   - never export unresolved unsupported claims.

4. **Partial deterministic report**
   - model outage must not erase deterministic value;
   - unavailable dimensions are not zero.

5. **Job Capture fail-closed policy**
   - no unauthorized fallback retrieval;
   - alternate capture paths always available.

6. **Sensitive-data redaction**
   - logs, traces, analytics, errors;
   - provider retention configuration.

7. **Change Set versioning**
   - safe Accept/Reject persistence;
   - multi-tab conflict detection;
   - export tied to exact Change Set version.

## P1 — required for MVP launch quality

8. **Resume extraction confidence and recovery**
   - parser timeout;
   - OCR fallback;
   - high-impact clarification.

9. **Job Target ambiguity handling**
   - incomplete screenshots;
   - multi-role ads;
   - many ambiguous fields;
   - candidate correction.

10. **Session expiry behavior**
    - restoration while valid;
    - warning where possible;
    - stale-tab handling;
    - honest expired-session reset.

11. **Export resilience**
    - per-format retry;
    - output validation;
    - no re-analysis requirement;
    - expired download recovery while session is valid.

12. **Rate-limit and cost-ceiling UX**
    - preserve current work;
    - avoid account coercion;
    - do not interrupt already accepted runs arbitrarily.

13. **Evidence Registry concurrency and stale-source handling**
    - immutable published versions;
    - proposal freshness;
    - reviewer conflict handling;
    - historical run reproducibility.

14. **Long-content and large-count behavior**
    - many findings;
    - long Resume;
    - long Job Target;
    - large Change Set;
    - many screenshots.

15. **Mobile interruption resilience**
    - rotation;
    - app switching;
    - device sleep;
    - reconnect.

## P2 — hardening after core MVP behavior is stable

16. Resumable uploads where infrastructure supports them.
17. More sophisticated duplicate screenshot detection.
18. Optional activity-based session extension.
19. Cached/offline report viewing if product strategy later warrants it.
20. More advanced change-conflict composition.
21. Multi-reviewer Evidence Registry workflow beyond basic optimistic concurrency.
22. Cross-device continuation if candidate accounts or transfer tokens are introduced.

---

# Pending questions / assumptions

- exact session TTL and whether active use extends it;
- exact raw-artifact failure-retention window;
- maximum Resume size and page count for product processing;
- maximum Job Capture images/files;
- model/provider retry budget;
- whether analysis continues after the browser closes;
- whether Resume reuse for another Job Target ships in MVP;
- whether candidate-edited Proposed Changes ship in MVP;
- whether PDF and DOCX export both launch together;
- exact rate-limit reset messaging available from infrastructure;
- exact Evidence Registry reviewer roles/permissions;
- concrete incident response for confirmed deletion failures;
- concrete accessibility behavior for live progress and error recovery, to be resolved by the accessibility pass.
