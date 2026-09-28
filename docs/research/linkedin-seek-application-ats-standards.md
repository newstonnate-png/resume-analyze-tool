# LinkedIn and SEEK application / ATS standards

**Status:** Primary-source baseline  
**Market focus:** New Zealand  
**Researched:** 2026-09-28

## Research rule

This note separates:

1. **Documented platform behavior** — claims made directly by LinkedIn, Microsoft LinkedIn Talent documentation, SEEK, or SEEK Developer documentation.
2. **External ATS behavior** — behavior controlled by an employer or recruitment-software provider after the platform hands an application off.
3. **General resume heuristics** — useful guidance that may improve readability or relevance but is not a documented LinkedIn/SEEK rule.

The Resume Analyze Tool must not collapse these into one universal "ATS score".

---

## Executive findings

### There is no single LinkedIn or SEEK ATS

LinkedIn supports both on-platform applications and applications that redirect to an employer or third-party site. Its Apply Connect product explicitly integrates LinkedIn job applications with applicant tracking systems and sends applications directly into the partner ATS.

SEEK similarly supports its own apply experience plus Apply with SEEK, which can pre-fill an external recruitment-software form using SEEK Profile data and a stored resume.

**Product consequence:** platform compatibility and downstream ATS compatibility are related but distinct problems. We can test documented platform constraints and analyze likely parseability/relevance, but we cannot honestly claim to reproduce every employer ATS.

Sources:
- LinkedIn Help, "Search for jobs on LinkedIn": https://www.linkedin.com/help/linkedin/answer/a511260
- LinkedIn / Microsoft Learn, "Apply Connect overview": https://learn.microsoft.com/en-us/linkedin/talent/apply-connect/apply-connect-overview
- SEEK Developer, "Apply with SEEK": https://developer.seek.com/use-cases/apply-with-seek

---

# LinkedIn

## Application paths

LinkedIn documents two major job-application experiences:

- **Easy Apply** — the member applies within LinkedIn.
- **Apply** — the member is redirected to the employer or a third-party job/application site.

Apply Connect further allows an ATS partner to receive LinkedIn applications directly into the ATS.

**Product consequence:** a "LinkedIn compatible" resume can still encounter a separate downstream ATS with its own parser and rules.

Sources:
- https://www.linkedin.com/help/linkedin/answer/a511260
- https://learn.microsoft.com/en-us/linkedin/talent/apply-connect/apply-connect-overview

## Resume upload constraints

LinkedIn Help recommends that an application resume be **under 2 MB** and states that the application resume format must be **Microsoft Word or PDF**.

LinkedIn's Apply Connect schema is more precise for ATS-integrated onsite apply: resume files have a **2 MB maximum** and accepted extensions are **.doc, .docx, .pdf**.

**Product rule:** a LinkedIn platform check should explicitly validate file type and size. A PDF or DOCX is the safest common recommendation. DOC can be accepted by the documented Apply Connect schema, but DOCX/PDF are better modern defaults.

Sources:
- https://www.linkedin.com/help/linkedin/answer/a510363/upload-your-resume-to-linkedin
- https://learn.microsoft.com/en-us/linkedin/talent/apply-connect/onsite-apply-configuration-schema

## Resume is not the whole application

Apply Connect supports structured application questions, including contact information, work experience, education, resume, cover letter, voluntary self-identification, and additional/custom questions.

**Product consequence:** resume analysis alone cannot predict whether an application will satisfy required application questions. We should model **screening/application questions** separately when the user has them.

Source:
- https://learn.microsoft.com/en-us/linkedin/talent/apply-connect/onsite-apply-configuration-schema

## LinkedIn Job Match is qualification-oriented, not just keyword counting

LinkedIn says Job Match compares:

- qualifications from the member's LinkedIn profile and resume,
- the job's required and preferred qualifications,
- information in the job description,
- and application screening questions.

LinkedIn also says hirers using Recruiter can discover candidates using advanced keyword filters based on skills and experience listed on the profile.

**Product consequence:** our matching layer should extract and compare **skills, experience, certifications, and qualification evidence** against the target role. Raw keyword frequency should be a supporting diagnostic, not the core score.

Source:
- https://www.linkedin.com/help/linkedin/answer/a7120158

## LinkedIn uses resume-derived information beyond a single application

LinkedIn says saved resumes may be used to personalize and improve the service, including recommending/ranking jobs and inferring skills, interests, and experience. Recruiters do not automatically receive the full stored resume unless the candidate provides it, but resume-derived information can affect discovery features when enabled.

**Product consequence:** future versions may benefit from a distinct **LinkedIn profile/resume consistency check**, because profile and resume data can both affect platform matching.

Sources:
- https://www.linkedin.com/help/linkedin/answer/a508386
- https://www.linkedin.com/help/linkedin/answer/a1327213

## LinkedIn itself warns that AI resume advice can be inaccurate

LinkedIn's own Resume Tips documentation tells users to verify generated advice for authenticity because responses may contain inaccuracies.

**Product consequence:** our AI-generated recommendations must show uncertainty and should never silently invent experience, certifications, metrics, or skills.

Source:
- https://www.linkedin.com/help/linkedin/answer/a6861967

---

# SEEK New Zealand

## Apply with SEEK can hand the resume to external recruitment software

Apply with SEEK can pre-fill an external recruitment-software application form using SEEK Profile data. A resume stored on SEEK can be attached to that external form. SEEK requires the candidate to be able to review/edit the form before submission and says the integration must not automatically submit the application on the candidate's behalf.

**Product consequence:** SEEK compatibility does not imply a single parser. The resume may ultimately be processed by recruitment software outside SEEK.

Sources:
- https://developer.seek.com/use-cases/apply-with-seek
- https://developer.seek.com/use-cases/apply-with-seek/populate-form

## SEEK resume attachment formats

SEEK Developer documentation lists these supported resume attachment formats:

- `.doc`
- `.docx`
- `.rtf`
- `.pdf`
- `.txt`

SEEK also says attachments are virus-scanned and may be modified to remove dangerous content such as macros or phishing links. The exact attachment-processing details are proprietary and may change.

**Product rule:** SEEK mode can recognize all documented formats, while recommending PDF/DOCX for mainstream portability. We must not claim to reproduce SEEK's proprietary security processing.

Source:
- https://developer.seek.com/use-cases/apply-with-seek/download-resume

## SEEK applications can include structured questionnaires

SEEK supports application questionnaires with free-text, single-select, and multi-select questions.

Questionnaire responses may have preferred answers. SEEK can calculate an overall questionnaire score from 0 to 1 when questions are scoreable.

Crucially, SEEK states that these scores are **advisory screening indicators**: all applications are delivered to recruitment software, SEEK does **not** support knockout questions, and SEEK does **not** reject applications based on the questionnaire score.

**Product consequence:** if we analyze SEEK screening questions, we should show them as a separate **screening alignment** dimension. We must not tell a user that SEEK itself will reject them because of a low questionnaire score.

Sources:
- https://developer.seek.com/use-cases/job-posting/questionnaires/ats-questions
- https://developer.seek.com/use-cases/application-export/questionnaire-submissions
- https://developer.seek.com/schema/named-type/ApplicationQuestionnaireSubmission

## SEEK's own candidate guidance supports tailoring to the role

SEEK's New Zealand career guidance describes a resume as a concise summary of why the candidate is a good match and recommends highlighting achievements, key skills, and experience. Its interview guidance also recommends tailoring the resume to the job and connecting skills and experiences to role requirements.

**Product consequence:** job-specific analysis is more defensible than a generic resume grade. The tool should encourage evidence-backed tailoring to the selected job, not indiscriminate keyword stuffing.

Sources:
- https://www.seek.co.nz/career-advice/article/free-resume-template
- https://www.seek.co.nz/career-advice/article/the-best-job-interview-tips-to-help-you-get-the-job

---

# What this means for the Resume Analyze Tool

## 1. Do not build a universal "ATS pass probability"

There is no primary-source basis for saying a single number predicts whether a resume will "pass LinkedIn", "pass SEEK", or pass every employer ATS.

A numeric score can still be useful **if it is explicitly our own diagnostic index** with transparent components. It must not be presented as the platform's hidden score.

Recommended language:

- "Compatibility score"
- "Qualification coverage"
- "Parsing confidence"
- "Evidence coverage"
- "Screening alignment"

Avoid:

- "LinkedIn ATS score"
- "SEEK ATS pass rate"
- "Chance of passing the ATS"
- "Guaranteed recruiter score"

## 2. Separate analysis into evidence-backed dimensions

Recommended top-level dimensions:

### Document compatibility
- supported file type for selected platform
- file size constraints
- text extractability
- corrupt/encrypted/scanned-image-only detection

### Parseability
- whether contact info, work history, education, skills, dates, and headings can be reliably extracted
- layout/order problems that damage machine-readable structure
- confidence per extracted field

This is **our parser diagnostic**, not a claim about an employer's parser.

### Qualification coverage
Compare the resume against a supplied **Job Target**:
- required qualifications
- preferred qualifications
- skills
- certifications/licences
- years/type of experience
- demonstrated evidence for each requirement

### Screening alignment
When screening/application questions are available:
- required-answer risks
- qualification or availability mismatches
- questions that cannot be inferred safely from the resume

Never fabricate an answer.

### Platform-specific checks
- LinkedIn file/upload rules
- SEEK attachment rules
- platform-specific warnings backed by first-party evidence

## 3. Evidence provenance should be part of the data model

Every rule or recommendation should have an evidence class:

- **platform-rule** — documented by LinkedIn/SEEK
- **platform-behavior** — documented workflow or integration behavior
- **general-ats-heuristic** — broadly useful but not guaranteed by the platform
- **writing-guidance** — human readability / resume-quality guidance
- **inference** — model-generated interpretation that must be presented with uncertainty

This prevents a heuristic from silently becoming a fake platform rule.

## 4. A Job Target should be a first-class object

The most useful analysis requires more than a resume.

A Job Target should eventually contain:
- platform: LinkedIn / SEEK / external / unknown
- job title
- employer
- job description
- required qualifications
- preferred qualifications
- skills
- certifications/licences
- screening questions if supplied
- application route: platform-hosted / external / unknown

## 5. Preserve candidate truth

The tool may suggest clearer wording or point out missing evidence, but it must not manufacture:
- employers
- dates
- responsibilities
- achievements
- metrics
- qualifications
- certifications
- skills the candidate does not possess

A recommendation should distinguish **"rewrite existing evidence"** from **"candidate must supply missing evidence"**.

---

# Research gaps

The following are intentionally **not established** by this research:

- proprietary ranking weights used by LinkedIn Recruiter or Job Match
- proprietary SEEK ranking/recruiter-search algorithms
- exact parsers used by each employer's downstream ATS
- a universal list of fonts, columns, tables, icons, or graphics that every ATS accepts or rejects
- a universal keyword-density threshold
- reliable interview probability from resume text alone

Those require either additional vendor-specific research or empirical testing and must never be presented as verified LinkedIn/SEEK standards without evidence.
