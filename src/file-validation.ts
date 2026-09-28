import { extname } from "node:path";
import { CandidateFacingError } from "./errors.js";

export type ResumeFileKind = "pdf" | "docx";

export interface ValidatedResumeFile {
  kind: ResumeFileKind;
  mimeType: string;
}

const pdfMime = "application/pdf";
const docxMime =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const genericMime = "application/octet-stream";

function beginsWith(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  return bytes.every((value, index) => buffer[index] === value);
}

function hasEicarSignature(buffer: Buffer): boolean {
  const content = buffer.toString("latin1").replace(/\\+/g, "\\");
  return content.includes(
    "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!",
  );
}

export function validateResumeFile(input: {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  maxBytes: number;
}): ValidatedResumeFile {
  const { fileName, mimeType, buffer, maxBytes } = input;

  if (buffer.length === 0) {
    throw new CandidateFacingError(
      422,
      "empty_file",
      "resume.empty",
      "The selected file is empty.",
      true,
      "session",
      ["Choose a PDF or DOCX file that contains your CV."],
    );
  }

  if (buffer.length > maxBytes) {
    throw new CandidateFacingError(
      413,
      "file_too_large",
      "resume.too_large",
      "This CV is larger than the current upload limit.",
      true,
      "session",
      ["Choose a smaller PDF or DOCX file."],
    );
  }

  if (hasEicarSignature(buffer)) {
    throw new CandidateFacingError(
      422,
      "unsafe_file",
      "resume.unsafe",
      "This file failed a security check and was not processed.",
      false,
      "session",
      ["Choose a different copy of your CV."],
    );
  }

  const extension = extname(fileName).toLowerCase();

  if (extension === ".pdf") {
    if (mimeType !== pdfMime && mimeType !== genericMime) {
      throw new CandidateFacingError(
        415,
        "file_type_mismatch",
        "resume.type_mismatch",
        "The file extension and file type do not match.",
        true,
        "session",
        ["Export the CV as a PDF again and retry."],
      );
    }

    if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new CandidateFacingError(
        422,
        "corrupt_file",
        "resume.corrupt",
        "This PDF could not be read safely.",
        true,
        "session",
        ["Export a fresh PDF and try again."],
      );
    }

    if (buffer.toString("latin1").includes("/Encrypt")) {
      throw new CandidateFacingError(
        422,
        "encrypted_file",
        "resume.encrypted",
        "This PDF is password-protected or encrypted.",
        true,
        "session",
        ["Upload an unlocked copy of the PDF."],
      );
    }

    return { kind: "pdf", mimeType: pdfMime };
  }

  if (extension === ".docx") {
    if (mimeType !== docxMime && mimeType !== genericMime) {
      throw new CandidateFacingError(
        415,
        "file_type_mismatch",
        "resume.type_mismatch",
        "The file extension and file type do not match.",
        true,
        "session",
        ["Export the CV as DOCX again and retry."],
      );
    }

    if (beginsWith(buffer, [0xd0, 0xcf, 0x11, 0xe0])) {
      throw new CandidateFacingError(
        422,
        "encrypted_or_legacy_office_file",
        "resume.office_protected",
        "This DOCX appears to be protected or in an older Office format.",
        true,
        "session",
        ["Save an unlocked copy as a modern DOCX file and retry."],
      );
    }

    if (!beginsWith(buffer, [0x50, 0x4b, 0x03, 0x04])) {
      throw new CandidateFacingError(
        422,
        "corrupt_file",
        "resume.corrupt",
        "This DOCX could not be read safely.",
        true,
        "session",
        ["Export a fresh DOCX and try again."],
      );
    }

    return { kind: "docx", mimeType: docxMime };
  }

  const recognizedLegacy = new Set([".doc", ".rtf", ".txt"]);
  if (recognizedLegacy.has(extension)) {
    throw new CandidateFacingError(
      415,
      "legacy_format_not_analyzed",
      "resume.legacy_format",
      "This file type is recognized, but full analysis currently supports PDF and DOCX.",
      true,
      "session",
      ["Save or export the CV as PDF or DOCX and retry."],
    );
  }

  throw new CandidateFacingError(
    415,
    "unsupported_file_type",
    "resume.unsupported_type",
    "Full CV analysis currently supports PDF and DOCX files.",
    true,
    "session",
    ["Choose a PDF or DOCX file."],
  );
}
