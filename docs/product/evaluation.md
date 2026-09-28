# UX Evaluation

**Product:** Resume Analyze Tool  
**Market:** New Zealand  
**Status:** Pre-implementation experience audit  
**Date:** 2026-09-28

## Evaluation scope

Reviewed artifacts:
- Product Intent
- Service Blueprint
- Candidate Journey
- Structural Wireframes
- Resilience specification
- Accessibility and Inclusive UX specification
- MVP engineering spec

Evaluation method:
- task-success walkthrough;
- heuristic review;
- accessibility review;
- resilience/edge-case review;
- anti-pattern/agency review.

Severity:
- **Blocker**: prevents safe or successful core task completion.
- **High**: likely to cause major user harm, loss of trust, privacy risk, or abandonment.
- **Medium**: meaningful friction/confusion with a recoverable path.
- **Low**: polish or clarity issue with limited task impact.

This is a design evaluation. Implementation-specific defects may still emerge later.

---

# Overall assessment

The product concept and end-to-end flow are coherent and implementation-ready after the amendments below.

Strong foundations already present:
- no mandatory candidate account;
- one shared candidate journey;
- Job Target optionality;
- evidence-backed platform claims;
- no fake ATS pass probability;
- explicit candidate control over Resume changes;
- candidate truth preservation;
- fail-closed Job Capture;
- partial deterministic results during AI outage;
- ephemeral raw-data handling;
- Evidence Registry governance;
- keyboard/screen-reader requirements;
- resilient server-authoritative workflow state.

No product-strategy blocker was found.

The remaining high/medium findings can be resolved within the existing architecture.

---

# Findings

## E1. High — Sensitive-data processing disclosure is too easy to miss before upload

### Location

C1 Start + Resume Upload.

### Observed behavior

The wireframe says:
- no account required;
- original file is temporary;
- "How your data is handled" is available as a secondary affordance.

The product may use an external model/provider later in the analysis pipeline.

### Task expectation / principle

A candidate should understand the material privacy characteristics of submitting a Resume before the sensitive file leaves their device.

### Affected users

All candidates, especially those with:
- personal contact details;
- immigration/work-right information;
- employment history;
- references;
- potentially sensitive Resume content.

### Risk

A secondary privacy link can technically exist while the important processing fact remains hidden.

### Remediation decision

Before upload, provide a concise plain-language disclosure stating:
- the file is processed to analyze the Resume;
- the raw source is temporary;
- AI-assisted analysis may process extracted content when enabled;
- no permanent candidate account is required;
- link to fuller data-handling details.

Do not use a manipulative mandatory checkbox unless legally/product-required.

The system must not send candidate content to a third-party model until the production provider's retention/data-use posture has been explicitly approved.

### Status

**Resolved by requirement.**

---

## E2. High — Session expiry can collide with active review/export

### Location

Candidate Truth Confirmation, Change Review, Export.

### Observed behavior

Session TTL is intentionally unresolved. Resilience requires warning where possible.

### Task expectation / principle

A candidate who has spent time reviewing and accepting changes should not discover at final export that the session disappeared without actionable warning.

### Risk

Loss of work and severe trust damage.

### Remediation decision

The implementation must define one of these before launch:

**Preferred:** activity-aware expiry with a hard privacy ceiling.

or, if policy requires a fixed deadline:

**Fallback:** explicit warning sufficiently before expiry plus transactional protection for an in-progress export/action.

Requirements:
- no silent expiry during a committed write;
- candidate can always see/recover from expired state;
- accepted Change Set state is server-authoritative while session is valid;
- starting export near expiry either extends the operation safely or rejects before work starts with clear guidance.

### Status

**Resolved at behavior level; exact TTL remains configuration.**

---

## E3. High — Report status words can become vague or falsely reassuring

### Location

C7 Report Workspace.

### Observed behavior

Example labels include:
- Strong;
- Needs work;
- Good.

### Task expectation / principle

A label should communicate what dimension it describes, not sound like a universal judgment of application quality.

### Risk

"Strong" may be read as "likely to pass ATS" even when it only refers to parseability or file compatibility.

### Remediation decision

Dimension statuses must be explicitly scoped.

Examples:
- Document Compatibility: **Compatible / Issue found / Not checked**
- Parseability: **High / Medium / Low extraction confidence**, or equivalent final language
- Qualification Coverage: **Well covered / Partially covered / Gaps found**
- Screening Alignment: **Aligned / Needs confirmation / Gaps found / Not available**

Exact copy will be finalized by product copy design, but generic unscoped "Strong/Good" should not ship.

### Status

**Resolved by requirement.**

---

## E4. Medium — Job Capture preference order may imply screenshot is always superior

### Location

C4 Add the Job.

### Observed behavior

Screenshot/image is visually recommended first.

### Task expectation / principle

Users should choose the easiest reliable input available.

### Risk

A candidate with a clean saved PDF or accessible text source may unnecessarily create screenshots, reducing text quality and accessibility.

### Remediation decision

Present screenshot and saved-file upload as **co-primary** capture choices.

Use wording such as:
- "Upload screenshots"
- "Upload a saved job ad"

Do not label one universally "best" unless evidence supports it.

URL import may still appear separately based on supported sources.

### Status

**Resolved by requirement.**

---

## E5. Medium — Rate-limit state is specified technically but not structurally designed

### Location

Anonymous candidate flow.

### Observed behavior

Resilience defines rate-limit requirements, but candidate wireframes do not show a concrete state.

### Task expectation / principle

Users must understand:
- what happened;
- what remains safe;
- whether they can retry.

### Remediation decision

Add a reusable rate-limit/deferred-capacity state:

- preserve existing active report/session where safe;
- distinguish "new analysis temporarily unavailable" from "your report is lost";
- show retry condition/time only if infrastructure provides reliable information;
- never make "create an account" the recovery path.

### Status

**Resolved by requirement.**

---

## E6. Medium — Cancellation semantics are not specific enough

### Location

Resume Processing and Analysis Progress.

### Observed behavior

"Cancel analysis" exists.

### Task expectation / principle

Users should know whether Cancel:
- stops only future processing;
- discards current session;
- deletes normalized data;
- preserves completed results.

### Risk

A generic Cancel label can cause fear of losing data or unexpected retained state.

### Remediation decision

Use stage-appropriate cancellation:

Before normalization:
- **Cancel upload** or **Stop processing**.
- clean raw temporary artifact.

During Analysis Run:
- **Stop analysis**.
- explain that completed safe stages may remain available in the active session if product policy supports partial results.

Do not use one ambiguous Cancel action for all stages.

### Status

**Resolved by requirement.**

---

## E7. Medium — Candidate confirmation can create an unbounded mini-interview

### Location

C9 Candidate Truth Confirmation.

### Observed behavior

The journey says prompts should be sparse, but no explicit product limit exists.

### Task expectation / principle

Full Application Analysis should remain faster than manually rebuilding the Resume.

### Risk

A model could generate a long chain of "Do you have X?" prompts.

### Remediation decision

Truth Confirmation must be prioritized.

Only ask when:
- the missing fact affects a High/Critical finding or top recommended change;
- the answer can materially alter the candidate's Resume;
- the question can be answered factually by the candidate.

Lower-value missing qualifications remain findings without interruption.

The UI should queue confirmations and show how many remain when more than one exists.

### Status

**Resolved by requirement.**

---

## E8. Medium — Reusing one Resume for another Job Target lacks a final product decision

### Location

Completion.

### Observed behavior

"Analyze another job" is conditional on retention policy.

### Task expectation / principle

This could be a major experience benefit for active job seekers.

### Risk

If omitted unnecessarily, candidates must repeatedly upload the same Resume. If enabled carelessly, it extends sensitive-data retention.

### Remediation decision

For MVP, permit reuse of the **normalized Resume only within the same unexpired anonymous session**.

Requirements:
- raw Resume remains deleted;
- each Job Target creates a new Analysis Run;
- prior reports are not mutated;
- session-expiry/privacy rules remain unchanged.

This feature is optional in UI only if implementation cost threatens MVP, but the data model must not prevent it.

### Status

**Resolved as preferred MVP behavior.**

---

## E9. Medium — Evidence labels need a consistent plain-language mapping

### Location

Report Workspace / Finding Detail.

### Observed behavior

Canonical Evidence Classes and example user-facing labels exist in different artifacts.

### Task expectation / principle

Users should not have to decode internal provenance vocabulary.

### Remediation decision

Use one stable candidate-facing mapping:

- platform-rule → **Verified platform rule**
- deterministic document fact → **Document fact**
- platform-behavior → **Verified platform behavior**
- general-ats-heuristic → **General ATS guidance**
- writing-guidance → **Resume writing guidance**
- inference → **AI interpretation**

Detailed source metadata is progressively disclosed.

### Status

**Resolved by requirement.**

---

## E10. Medium — Before/after comparison needs protection from content disappearance

### Location

C10 Change Review.

### Observed behavior

Accepted changes show before/after.

### Task expectation / principle

Candidates must be able to review long content reliably.

### Risk

If long passages are visually truncated with no expansion, meaningful changes can be hidden.

### Remediation decision

For each accepted change:
- show the full changed span or an explicit expandable excerpt;
- never hide changed words behind ellipsis with no reveal;
- screen-reader sequence remains Before → text → After → text → reason → state.

### Status

**Resolved by requirement.**

---

## E11. Low — "Export later" label is ambiguous

### Location

Desktop Report Workspace example.

### Observed behavior

Header contains "[Export later]".

### Risk

Could be interpreted as saving a future export despite the anonymous ephemeral session.

### Remediation decision

Use a direct action label such as:
- **Review changes**
- **Export CV**

Only expose Export when product state permits.

### Status

**Resolved by requirement.**

---

## E12. Low — Privacy reassurance must not overclaim deletion timing

### Location

Start / Completion.

### Observed behavior

Copy examples state the original file is temporary and later "already deleted".

### Risk

If deletion is asynchronous or temporarily fails, copy can become inaccurate.

### Remediation decision

UI copy must derive from confirmed deletion state.

Before upload:
- "Your original file is processed temporarily and deleted after extraction."

After confirmed deletion:
- "Your original upload has been deleted."

If deletion is pending:
- do not claim completion; operations handles retry.

### Status

**Resolved by requirement.**

---

# Cognitive walkthrough

## Task 1: Resume Health Check

### Will the user know what to do?

Yes. Upload is the dominant action.

### Will the user see the control?

Yes, provided the final visual design preserves hierarchy.

### Will they associate it with the goal?

Yes. The start screen directly describes Resume/CV improvement.

### Will feedback make sense?

Yes after:
- accessible upload status;
- scoped dimension labels;
- stage-specific cancellation.

### Remaining risk

Final copy and visual hierarchy require usability testing.

---

## Task 2: Full Application Analysis

### Will the user know how to add the job?

Yes after treating screenshot and saved file as co-primary inputs.

### Will unsupported URL retrieval create a dead end?

No. Alternative capture methods are explicit.

### Will ambiguity review make sense?

Yes if it remains limited to high-impact uncertain fields.

### Remaining risk

We have not validated candidate preference for screenshot/file capture with real users.

---

## Task 3: Review and accept Resume changes

### Will the user understand why a recommendation exists?

Likely yes because each Finding carries rationale, evidence, provenance, severity, and confidence.

### Can the user tell whether a proposed fact is supported?

Yes after truth-confirmation gating.

### Can the user undo decisions?

Yes within active session.

### Remaining risk

Too many Proposed Changes could still create fatigue. Prioritization and grouping must be tested.

---

## Task 4: Export

### Will the user understand what will be exported?

Yes after Change Review.

### Could new AI text appear unexpectedly?

No by design.

### Can export failure be recovered?

Yes without re-analysis.

### Remaining risk

Final file fidelity and semantic preservation must be tested in implementation.

---

# Anti-pattern / agency review

No deliberate manipulative pattern is part of the design.

Required protections:
- no forced account before value;
- no false countdown/urgency around session expiry;
- no preselected positive truth answers;
- no shame language for missing qualifications;
- no fabricated ATS certainty;
- no "accept all" that includes unresolved truth-dependent changes;
- no hidden retention in exchange for convenience;
- no forced consent bundling;
- no disguised model inference as platform fact.

---

# Accessibility review summary

The Include specification resolves the largest design-level accessibility gaps.

Still requires implementation validation:
- real keyboard order;
- visible focus;
- drawer focus management;
- live-region behavior;
- zoom/reflow;
- contrast;
- target sizes;
- screen-reader semantics;
- accessible authentication provider;
- real PDF/DOCX export accessibility if generated documents are expected to be accessible artifacts.

---

# Evaluation decision

There are **no unresolved Blocker or High design findings** after the requirements above are adopted.

The remaining uncertainty is primarily:
- implementation validation;
- final copy;
- visual design;
- provider/infrastructure selection;
- empirical usability testing.

The experience is ready to move to engineering specification.

---

# Pending questions / assumptions

- visual design has not yet been evaluated because it does not exist;
- real user usability evidence is still absent;
- generated PDF/DOCX accessibility requirements may need a dedicated export-document standard;
- exact session TTL remains unresolved;
- exact analytics/measurement plan is not yet defined;
- platform-partner research remains an external integration track.
