import { randomUUID } from "node:crypto";
import type {
  ExtractionConfidence,
  NormalizedResume,
  ResumeClarification,
  ResumeSection,
  ResumeWorkEntry,
} from "./domain.js";

type SectionKind = ResumeSection["kind"];

const headingMap = new Map<string, SectionKind>([
  ["summary", "summary"],
  ["profile", "summary"],
  ["professional summary", "summary"],
  ["experience", "experience"],
  ["work experience", "experience"],
  ["employment", "experience"],
  ["employment history", "experience"],
  ["work history", "experience"],
  ["education", "education"],
  ["skills", "skills"],
  ["technical skills", "skills"],
  ["core skills", "skills"],
  ["certifications", "certifications"],
  ["certificates", "certifications"],
  ["licences", "certifications"],
  ["licenses", "certifications"],
]);

function classifyHeading(line: string): SectionKind | undefined {
  return headingMap.get(line.toLowerCase().replace(/:$/, "").trim());
}

function splitSections(lines: string[]): ResumeSection[] {
  const sections: ResumeSection[] = [];
  let current: ResumeSection = { kind: "other", lines: [] };

  for (const line of lines) {
    const heading = classifyHeading(line);
    if (heading) {
      if (current.lines.length > 0) sections.push(current);
      current = { kind: heading, lines: [] };
      continue;
    }

    current.lines.push(line);
  }

  if (current.lines.length > 0) sections.push(current);
  return sections;
}

function firstSection(
  sections: ResumeSection[],
  kind: SectionKind,
): ResumeSection | undefined {
  return sections.find((section) => section.kind === kind);
}

function extractContact(lines: string[]) {
  const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/;

  const email = lines.map((line) => line.match(emailPattern)?.[0]).find(Boolean);
  const phone = lines.map((line) => line.match(phonePattern)?.[0]).find(Boolean);
  const name = lines.find(
    (line) =>
      line.length <= 80 &&
      !emailPattern.test(line) &&
      !phonePattern.test(line) &&
      !classifyHeading(line),
  );

  return {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}

function parseRoleLabel(label: string): {
  title?: string;
  employer?: string;
} {
  const parts = label
    .split(/\s+(?:at|@|\||·|—|–)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return { title: parts[0], employer: parts.slice(1).join(" ") };
  }

  return label ? { title: label } : {};
}

function parseWorkEntries(
  section: ResumeSection | undefined,
): {
  entries: ResumeWorkEntry[];
  clarifications: ResumeClarification[];
} {
  if (!section) return { entries: [], clarifications: [] };

  const entries: ResumeWorkEntry[] = [];
  const clarifications: ResumeClarification[] = [];
  const datePattern =
    /\b((?:19|20)\d{2})\s*(?:-|–|—|to)\s*(present|current|\?|(?:19|20)\d{2})?/i;

  section.lines.forEach((line, index) => {
    const match = line.match(datePattern);
    if (!match) return;

    const startDate = match[1];
    const rawEndDate = match[2];
    const label = section.lines[index - 1] ?? "";
    const parsedLabel = parseRoleLabel(label);
    const workEntryId = randomUUID();
    const endDate =
      rawEndDate && rawEndDate !== "?"
        ? /present|current/i.test(rawEndDate)
          ? "Present"
          : rawEndDate
        : undefined;

    const confidence: ExtractionConfidence =
      endDate && parsedLabel.title ? "high" : "medium";

    entries.push({
      id: workEntryId,
      ...parsedLabel,
      startDate,
      ...(endDate ? { endDate } : {}),
      sourceLine: index + 1,
      confidence,
    });

    if (!endDate) {
      const roleLabel = parsedLabel.title
        ? `${parsedLabel.title}${parsedLabel.employer ? ` at ${parsedLabel.employer}` : ""}`
        : "this role";

      clarifications.push({
        id: randomUUID(),
        kind: "employment_end_date",
        prompt: `Confirm the end date for ${roleLabel}.`,
        workEntryId,
        status: "pending",
      });
    }
  });

  return { entries, clarifications };
}

function parseSkills(section: ResumeSection | undefined): string[] {
  if (!section) return [];

  return Array.from(
    new Set(
      section.lines
        .flatMap((line) => line.split(/[,;•|]/))
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0 && skill.length <= 80),
    ),
  );
}

function overallConfidence(input: {
  text: string;
  hasEmail: boolean;
  workEntryCount: number;
  sectionCount: number;
}): ExtractionConfidence {
  if (input.text.trim().length < 80) return "low";

  if (
    input.hasEmail &&
    (input.workEntryCount > 0 || input.sectionCount >= 2)
  ) {
    return "high";
  }

  return "medium";
}

export function normalizeResumeText(input: {
  text: string;
  fileName: string;
  mimeType: string;
  sourceDeletedAt: string;
}): {
  resume: NormalizedResume;
  clarifications: ResumeClarification[];
} {
  const lines = input.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = splitSections(lines);
  const contact = extractContact(lines);
  const experienceSection = firstSection(sections, "experience");
  const educationSection = firstSection(sections, "education");
  const summarySection = firstSection(sections, "summary");
  const skillsSection = firstSection(sections, "skills");
  const { entries: workEntries, clarifications } =
    parseWorkEntries(experienceSection);

  const warnings: string[] = [];
  if (!contact.email) warnings.push("No email address was confidently detected.");
  if (!experienceSection) {
    warnings.push("No explicit work experience section was detected.");
  }

  const confidence = overallConfidence({
    text: input.text,
    hasEmail: Boolean(contact.email),
    workEntryCount: workEntries.length,
    sectionCount: sections.length,
  });

  const resume: NormalizedResume = {
    id: randomUUID(),
    version: 1,
    sourceFileName: input.fileName,
    sourceMimeType: input.mimeType,
    sourceDeletedAt: input.sourceDeletedAt,
    normalizedAt: new Date().toISOString(),
    contact,
    ...(summarySection?.lines.length
      ? { summary: summarySection.lines.join(" ") }
      : {}),
    workEntries,
    educationEntries: educationSection?.lines ?? [],
    skills: parseSkills(skillsSection),
    sections,
    extraction: {
      confidence,
      warnings,
    },
  };

  return { resume, clarifications };
}
