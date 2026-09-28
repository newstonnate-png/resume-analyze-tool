import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import type { ResumeFileKind } from "./file-validation.js";

export interface ResumeTextExtractor {
  extract(kind: ResumeFileKind, buffer: Buffer): Promise<string>;
}

export class ProductionResumeTextExtractor implements ResumeTextExtractor {
  async extract(kind: ResumeFileKind, buffer: Buffer): Promise<string> {
    if (kind === "pdf") {
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }

    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value;
  }
}
