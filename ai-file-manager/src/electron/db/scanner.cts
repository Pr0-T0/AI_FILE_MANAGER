import fs from "fs";
import path from "path";
import crypto from "crypto";
import { upsertMany, FileMeta } from "./db.cjs";

const SYSTEM_DIRS = new Set([
  "proc","sys","dev","run","snap","tmp","var","usr","lib","lib64",
  "etc","opt","bin","sbin","boot",
  "System Volume Information","Windows","Program Files","Program Files (x86)"
]);

export function shouldIgnore(fullPath: string, name: string): boolean {
  if (!name) return true;

  // skip hidden files and folders
  if (name.startsWith(".")) return true;

  // skip system directories
  if (SYSTEM_DIRS.has(name)) return true;

  return false;
}

// Optionally add hashing later
function maybeHash(filePath: string): string | null {
  return null; // enable real hashing later
}

export async function scanDirectory(root: string) {
  const stack = [root];
  const batch: FileMeta[] = [];
  const BATCH_SIZE = 300;

  console.log(`Scanning: ${root}`);

  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries: string[];

    try {
      entries = fs.readdirSync(current);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (shouldIgnore(path.join(current, entry), entry)) continue;

      const fullPath = path.join(current, entry);

      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        continue;
      }

      const meta: FileMeta = {
        path: fullPath,
        name: entry,
        parent: path.dirname(fullPath),
        type: stats.isDirectory() ? "directory" : "file",
        extension: stats.isDirectory() ? "" : path.extname(entry),
        size: stats.isFile() ? stats.size : 0,
        created_at: stats.birthtimeMs,
        modified_at: stats.mtimeMs,
        hash: stats.isFile() ? maybeHash(fullPath) : null
      };

      batch.push(meta);

      if (batch.length >= BATCH_SIZE) {
        upsertMany(batch);
        batch.length = 0;
      }

      if (stats.isDirectory()) {
        stack.push(fullPath);
      }
    }
  }

  if (batch.length) upsertMany(batch);

  console.log(`Finished scan of ${root}`);
}
