# Accessibility and Inclusive UX Specification

**Product:** Resume Analyze Tool  
**Market:** New Zealand  
**Status:** Accessibility requirements for MVP  
**Date:** 2026-09-28  
**Target:** Design and implementation should aim for WCAG 2.2 Level AA behavior. Conformance is not claimed until implementation is tested.

## Accessibility stance

Accessibility is part of the product contract.

The core candidate journey must remain usable for people who:
- navigate with keyboard only;
- use screen readers;
- use screen magnification or browser zoom;
- have low vision or color-vision differences;
- have motor or dexterity limitations;
- have cognitive or attention limitations;
- are using a phone one-handed or in motion;
- have temporary injuries;
- are in noisy, low-bandwidth, or distracting environments;
- use non-ASCII names, Māori macrons, or other linguistic forms not well represented by US-centric assumptions.

No critical action may depend on:
- drag only;
- hover only;
- color alone;
- animation alone;
- precise pointer control;
- a short timeout with no warning;
- remembering information from a previous screen when it can be preserved.

---

# Critical non-visual candidate flow

A screen-reader or keyboard-only candidate must be able to complete this sequence without visual inference:

1. Arrive on the Start + Resume Upload screen.
2. Hear the page heading and short product explanation.
3. Reach the file input directly by keyboard.
4. Select a PDF or DOCX.
5. Hear upload/validation status changes without focus being stolen.
6. If the file is rejected, hear:
   - what happened;
   - whether anything was retained;
   - what action is available next.
7. If extraction succeeds, proceed to:
   - "Are you applying for a specific job?"
8. Choose:
   - Add the job; or
   - Check my CV.
9. If adding a job:
   - select screenshot/image upload, saved file, URL import, or text fallback;
   - receive status updates;
   - review only ambiguous high-impact fields if required.
10. Start or continue Analysis.
11. Hear stage changes through polite status announcements while remaining free to navigate away from the status region.
12. Reach the Report heading.
13. Navigate Top Actions, analysis dimensions, and Findings by headings/landmarks.
14. Open a Finding Detail using a named control.
15. If a drawer/sheet opens:
   - focus moves to its heading;
   - focus remains within it while open;
   - Escape or a visible close action closes it;
   - focus returns to the invoking control.
16. Hear severity, confidence, Evidence Class, and the factual reason for the recommendation as text.
17. Reach Proposed Change content in logical order:
   - before;
   - after;
   - rationale;
   - candidate action.
18. If truth confirmation is required:
   - hear the missing fact/question;
   - choose Yes or No without a preselected answer;
   - provide supporting detail only when needed.
19. Accept or Reject changes through standard controls whose current state is programmatically exposed.
20. Open Change Review.
21. Read each before/after comparison in a meaningful linear sequence.
22. Resolve any blocking confirmation.
23. Choose export format.
24. Generate and download the output.
25. Hear export success or failure as a status update.
26. Understand session-expiry behavior from text, not a visual timer alone.

---

# Semantic structure requirements

## Headings and landmarks

Each screen must have:
- one page-level heading;
- meaningful section headings;
- landmark regions where appropriate, such as main, navigation, complementary, and status.

Report Workspace should expose semantic sections for:
- Top Actions;
- Analysis dimensions;
- Findings;
- Change Set.

Heading levels must reflect hierarchy rather than font size.

## Lists

Use semantic lists for:
- Top Actions;
- Findings;
- captured screenshots/files;
- Evidence update queue;
- accepted/rejected Change Sets.

## Tables

Avoid candidate-facing tables where a list/card representation communicates the same meaning more clearly.

If operator views use tabular data:
- headers must be associated correctly;
- responsive layouts must not destroy reading order.

---

# Keyboard behavior

All candidate and operator actions must be keyboard operable.

Required:
- visible focus indicator;
- logical DOM/focus order matching visual order;
- no keyboard traps;
- no hover-only content;
- no drag-only reordering.

For multi-image Job Capture:
- if drag-to-reorder is supported, provide explicit Move up / Move down controls.

For drawers, sheets, and modals:
- focus enters on open;
- focus is contained;
- Escape closes where appropriate;
- focus returns to the invoker.

Sticky mobile actions must never cover the focused element.

---

# Focus visibility and obscuration

Focused controls must remain visible when:
- sticky headers are present;
- sticky bottom actions are present;
- drawers/sheets are open;
- the browser is zoomed;
- mobile viewport height changes because of software keyboards.

The implementation should account for WCAG 2.2 focus visibility and focus-not-obscured requirements.

---

# Names, roles, values, and states

Interactive controls must expose programmatic:
- name;
- role;
- value/state where applicable.

Examples:
- Accepted / Rejected state of a Proposed Change;
- expanded/collapsed state of Finding details;
- selected export format;
- current choice in Job Target ambiguity review;
- progress-stage state;
- enabled/disabled export state.

Do not communicate selected/accepted state only through icon shape or color.

---

# Status and progress announcements

Use status semantics for non-focus-stealing updates such as:
- upload started/completed;
- validation completed;
- Resume extraction stage changed;
- Analysis stage changed;
- partial report available;
- export succeeded/failed;
- retry succeeded.

Announcements should be concise and polite.

Do not announce every animated visual tick.

Stage-based progress is preferred because:
- it is truthful;
- it reduces cognitive load;
- it can be announced semantically;
- it avoids fake percentages.

A user must be able to understand progress with animation disabled.

---

# Error behavior

Every error must:
- identify the affected control or stage;
- explain the problem in text;
- preserve focus logically;
- describe the next action;
- state whether prior work remains safe when relevant.

Form-level errors should include an error summary when multiple fields require attention.

Inline validation must not:
- rely on red borders alone;
- appear only after focus has moved far away with no announcement;
- clear candidate-entered content unnecessarily.

---

# Upload accessibility

Drag-and-drop may exist, but it is supplemental.

There must always be:
- a standard file picker;
- keyboard access;
- a visible button/control;
- accepted format information.

Upload progress should expose text state.

If upload is interrupted:
- announce the interruption;
- preserve retryable state when possible.

---

# Job Capture accessibility

Capture methods must be selectable without drag or gesture-only behavior.

For screenshots:
- each item needs a generated accessible label such as "Job screenshot 1";
- delete/remove action must be individually labeled;
- reorder must support non-drag controls.

If visual OCR confidence highlights exist, the same uncertainty must be described in text.

Source excerpts shown during ambiguity review must be readable as ordinary text, not image-only crops.

---

# Report accessibility

## Severity

Severity values:
- Critical;
- High Impact;
- Improvement;
- Optional Polish

must appear as text.

Color/icon treatment may reinforce, never replace, the text label.

## Analysis dimensions

Dimension status must use meaningful text:
- Strong;
- Needs attention;
- Unavailable;
- Not applicable;
or final agreed terminology.

Do not communicate meaning through a gauge alone.

## Confidence

Confidence must have:
- textual label;
- optional explanation.

Avoid a tiny visual percentage with no context.

## Evidence provenance

Candidate-facing labels may use plain language:
- Verified platform rule;
- Document fact;
- Platform behavior;
- General ATS guidance;
- Writing guidance;
- AI interpretation.

Detailed Evidence Class/provenance can be progressively disclosed.

---

# Before / after comparisons

A visual diff is not sufficient on its own.

Assistive technology should encounter:
1. Before;
2. original text;
3. After;
4. proposed text;
5. reason;
6. current acceptance state.

Deleted/added visual styles must include semantic/text equivalents.

---

# Candidate Truth Confirmation

Requirements:
- Yes/No is never preselected;
- No is a valid neutral outcome;
- the product does not use shame, urgency, or coercive copy;
- supporting detail field is conditionally revealed and labeled;
- errors explain what additional information is needed;
- changing the answer updates dependent Proposed Changes and announces that change.

---

# Time limits and session expiry

Anonymous sessions are time-limited.

The product must not rely on a silently disappearing session.

Where technically feasible:
- warn before expiry;
- allow extension through genuine activity if policy permits;
- announce the warning accessibly;
- explain exactly what will be lost.

If a hard privacy limit prevents extension:
- disclose it clearly;
- avoid starting actions that cannot reasonably complete before expiry.

Session expiry must present a recovery path.

---

# Target size and motor accessibility

Pointer targets should meet or exceed WCAG 2.2 Level AA target-size expectations or satisfy an allowed spacing/equivalent-control exception.

Product design should prefer comfortably larger targets than the technical minimum for:
- Accept;
- Reject;
- Yes;
- No;
- close buttons;
- finding cards;
- screenshot reorder/remove controls;
- export format controls.

Destructive and opposing controls should not be tightly packed.

---

# Reflow and zoom

The candidate journey must remain usable at high browser zoom and narrow widths.

Requirements:
- no required horizontal scrolling for ordinary candidate content;
- report two-column layout collapses to one column;
- before/after comparison stacks;
- sticky controls do not obscure content/focus;
- text is not clipped;
- dialogs/sheets remain operable on short viewport heights.

---

# Motion

No essential information is conveyed only through motion.

Respect reduced-motion preferences for:
- progress animation;
- drawer/sheet transitions;
- success animation;
- skeleton/loading transitions.

Do not use rapid flashing content.

---

# Cognitive accessibility

## Reduce decisions

Do not ask users to choose:
- ATS engine;
- AI model;
- scoring method;
- parser type.

These are implementation details.

## Keep instructions local

Explain a requirement at the point of action.

Examples:
- unsupported URL guidance appears beside URL import;
- missing truth confirmation appears inside the affected Finding;
- export blocking reason appears at export/change review.

## Avoid memory burden

Preserve:
- selected mode;
- Job Target;
- report filter;
- Change Set;
- scroll/context where practical during drawer/detail return.

## Use plain language

Candidate-facing terms should favor:
- CV / Resume;
- Add the job;
- Top Actions;
- Verified rule;
- Needs confirmation;
rather than internal architecture vocabulary.

---

# Authentication accessibility

Candidate workflows require no account.

Admin authentication, when selected, must avoid inaccessible authentication patterns.

If CAPTCHA or verification is introduced later:
- it requires an accessible alternative;
- it must not block assistive-technology users through puzzle-only interaction.

---

# WCAG 2.2 mapping

Likely relevant WCAG 2.2 success criteria include, but are not limited to:

- 1.3.1 Info and Relationships
- 1.3.2 Meaningful Sequence
- 1.4.3 Contrast (Minimum)
- 1.4.10 Reflow
- 1.4.11 Non-text Contrast
- 1.4.12 Text Spacing
- 2.1.1 Keyboard
- 2.1.2 No Keyboard Trap
- 2.2.1 Timing Adjustable, where applicable
- 2.2.6 Timeouts, where applicable
- 2.4.1 Bypass Blocks
- 2.4.2 Page Titled
- 2.4.3 Focus Order
- 2.4.6 Headings and Labels
- 2.4.7 Focus Visible
- 2.4.11 Focus Not Obscured (Minimum)
- 2.5.3 Label in Name
- 2.5.7 Dragging Movements
- 2.5.8 Target Size (Minimum)
- 3.2.3 Consistent Navigation
- 3.2.4 Consistent Identification
- 3.2.6 Consistent Help
- 3.3.1 Error Identification
- 3.3.2 Labels or Instructions
- 3.3.3 Error Suggestion
- 3.3.7 Redundant Entry
- 3.3.8 Accessible Authentication (Minimum), for operator authentication where applicable
- 4.1.2 Name, Role, Value
- 4.1.3 Status Messages

This mapping is a design checklist, not a conformance statement.

Primary reference:
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C Understanding WCAG 2.2: https://www.w3.org/WAI/WCAG22/Understanding/

---

# Assistive-technology test matrix

Before claiming accessibility readiness, implementation should be tested with at least:

## Desktop keyboard

- complete candidate flow without mouse;
- upload;
- Job Capture;
- finding detail;
- confirmation;
- Accept/Reject;
- export.

## Screen reader

Representative combinations should include at least:
- NVDA + a supported Windows browser;
- VoiceOver + Safari on iOS or macOS.

Test:
- headings/landmarks;
- form labels;
- status announcements;
- drawers/sheets;
- live analysis progress;
- errors;
- before/after comparison;
- accepted/rejected state.

## Zoom/reflow

Test:
- 200% browser zoom;
- narrow desktop viewport;
- mobile portrait;
- mobile landscape;
- software keyboard visible.

## Motor/touch

Test:
- Job screenshot reorder without dragging;
- closely opposed controls;
- sticky bottom actions;
- error recovery.

---

# Accessibility acceptance requirements

The MVP is not accessibility-ready if:

- any core candidate task requires a mouse;
- screenshot ordering requires dragging with no alternative;
- severity/status is color-only;
- analysis progress is animation-only;
- focus is hidden behind a sticky control;
- a drawer closes and focus is lost to the top of the page;
- session expiry occurs with no accessible explanation;
- a screen reader cannot determine accepted/rejected state;
- an unavailable analysis dimension is read as "0";
- before/after changes are understandable only visually;
- a file-upload error is not programmatically associated with the upload control/stage;
- export is disabled with no explanation;
- candidate truth confirmation defaults to Yes;
- the mobile layout requires horizontal scrolling for ordinary report content.

---

# Inclusive UX decisions

1. Drag-and-drop is always paired with a standard control.
2. Reordering always has a non-drag alternative.
3. Stage progress uses semantic text and polite live announcements.
4. Severity, confidence, and dimension status always have text.
5. Finding detail overlays preserve and restore focus.
6. Before/after comparison has a linear semantic representation.
7. Candidate truth confirmation is neutral and unselected by default.
8. Session-expiry warning must be accessible and actionable when policy permits extension.
9. Candidate-facing language avoids internal ATS/AI architecture vocabulary.
10. Admin authentication must satisfy accessible-authentication requirements when the provider is selected.

---

# Pending questions / assumptions

- final color palette and verified contrast ratios;
- exact visual focus treatment;
- exact live-region announcement cadence;
- concrete operator authentication provider;
- exact anonymous session timeout/extension behavior;
- whether inline Proposed Change editing is in MVP;
- final component library and its accessibility quality;
- which browser/screen-reader combinations are officially supported;
- whether direct camera capture is exposed on mobile;
- whether a user research/usability session with disabled job seekers can be included before launch.
