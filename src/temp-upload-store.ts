import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface TemporaryUpload {
  id: string;
  directory: string;
  path: string;
}

export class TemporaryUploadStore {
  constructor(private readonly root: string) {}

  async write(buffer: Buffer): Promise<TemporaryUpload> {
    await mkdir(this.root, { recursive: true });
    const directory = await mkdtemp(join(this.root, "upload-"));
    const path = join(directory, "source.bin");
    await writeFile(path, buffer, { flag: "wx", mode: 0o600 });

    return {
      id: randomUUID(),
      directory,
      path,
    };
  }

  async delete(upload: TemporaryUpload): Promise<string> {
    await rm(upload.directory, { recursive: true, force: true });
    return new Date().toISOString();
  }
}
