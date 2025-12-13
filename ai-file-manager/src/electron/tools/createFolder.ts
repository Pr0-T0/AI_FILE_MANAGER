import fs from "fs";
import path from "path";
import { upsertMany } from "../db/db.js";

interface FileMeta {
  path: string;
  name: string;
  parent: string;
  type: "file" | "directory";
  size?: number;
  created_at?: number | null;
  modified_at?: number | null;
}

type CreateFolderResult =
  | { path: string }
  | { error: string };

/**
 * Creates a folder on disk and updates files_index DB
 * @param folderPath absolute or relative path
 * @returns created folder path or error
 */
export async function createFolder(folderPath: string): Promise<CreateFolderResult> {
  try {
    const fullPath = path.resolve(folderPath);

    // create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    let stat: fs.Stats | null = null;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      // ignore stat errors
    }

    const meta: FileMeta = {
      path: fullPath,
      name: path.basename(fullPath),
      parent: path.basename(path.dirname(fullPath)),
      type: "directory",
      size: 0,
      created_at: stat?.birthtimeMs ?? null,
      modified_at: stat?.mtimeMs ?? null,
    };

    await upsertMany([meta]);

    return { path: fullPath };
  } catch (err: any) {
    return {
      error: err?.message ?? "Failed to create folder",
    };
  }
}
