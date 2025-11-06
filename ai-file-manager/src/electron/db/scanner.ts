import fs from "fs";
import path from "path";
import { upsertMany } from "./db.js";

interface FileMeta {
  path: string;
  name: string;
  parent: string;
  type: "file" | "directory";
  extension?: string;
  size?: number;
  created_at?: number;
  modified_at?: number;
}

const BATCH_SIZE = 400;
let batch: FileMeta[] = [];

// folders to skip
const IGNORE_DIRS = new Set([
  ".cache", ".local", ".npm", ".cargo", ".rustup",
  ".var", ".config", ".mozilla", "node_modules",
  ".git", "__pycache__", ".vscode"
]);

function shouldIgnore(name: string, stat: fs.Stats): boolean {
  if (name.startsWith(".")) return true; // hidden dirs/files
  if (IGNORE_DIRS.has(name)) return true;
  return false;
}

export async function scanDirectory(dir: string, depth = 0): Promise<void> {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Stat current folder (add it as a directory entry)
    let dirStat: fs.Stats;
    try {
      dirStat = fs.statSync(dir);
      batch.push({
        path: dir,
        name: path.basename(dir),
        parent: path.dirname(dir),
        type: "directory",
        size: 0,
        created_at: dirStat.birthtimeMs,
        modified_at: dirStat.mtimeMs
      });
    } catch {
      /* skip unreadable folders */
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }

      const isHomeRoot = depth === 0;

      if (entry.isDirectory()) {
        if (shouldIgnore(entry.name, stat)) continue;

        // add the folder itself before recursion
        batch.push({
          path: full,
          name: entry.name,
          parent: dir,
          type: "directory",
          size: 0,
          created_at: stat.birthtimeMs,
          modified_at: stat.mtimeMs
        });

        // only recurse below home for allowed root dirs
        const allowedRootDirs = ["Documents", "Downloads", "Desktop", "Pictures", "Videos", "Music"];

        if (!isHomeRoot || allowedRootDirs.includes(entry.name)) {
          await scanDirectory(full, depth + 1);
        }

      } else if (entry.isFile()) {
        if (shouldIgnore(entry.name, stat)) continue;

        batch.push({
          path: full,
          name: entry.name,
          parent: dir,
          type: "file",
          extension: path.extname(entry.name),
          size: stat.size,
          created_at: stat.birthtimeMs,
          modified_at: stat.mtimeMs
        });
      }

      // Flush batch if full
      if (batch.length >= BATCH_SIZE) {
        upsertMany(batch);
        batch = [];
      }
    }

    // flush any leftovers after this folder
    if (depth === 0 && batch.length > 0) {
      upsertMany(batch);
      batch = [];
    }

  } catch (err) {
    // ignore permission errors or broken symlinks
  }
}
