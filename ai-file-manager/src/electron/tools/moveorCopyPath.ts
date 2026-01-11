import fs from "fs/promises";
import path from "path";
import { deleteByPathPrefix, upsertMany } from "../db/db.js";

type OperationType = "copy" | "cut";

interface FileMeta {
  path: string;
  name: string;
  parent: string;
  type: "file" | "directory";
  size?: number;
  created_at?: number | null;
  modified_at?: number | null;
  root_path: string;
  last_seen_at: number;
}

type TransferResult =
  | { path: string }
  | { error: string };

/* -------------------------------------------------- */
/* Helper: Collect subtree metadata for directories   */
/* -------------------------------------------------- */
async function collectSubtree(
  srcDir: string,
  srcRoot: string,
  destRoot: string,
  rootPath: string,
  seenAt: number
): Promise<FileMeta[]> {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  const metas: FileMeta[] = [];

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const rel = path.relative(srcRoot, srcPath);
    const destPath = path.join(destRoot, rel);

    const stat = await fs.stat(srcPath);

    metas.push({
      path: destPath,
      name: entry.name,
      parent: path.basename(path.dirname(destPath)),
      type: entry.isDirectory() ? "directory" : "file",
      size: entry.isDirectory() ? undefined : stat.size,
      created_at: stat.birthtimeMs ?? null,
      modified_at: stat.mtimeMs ?? null,
      root_path: path.normalize(rootPath),
      last_seen_at: seenAt,
    });

    if (entry.isDirectory()) {
      metas.push(
        ...(await collectSubtree(
          srcPath,
          srcRoot,
          destRoot,
          rootPath,
          seenAt
        ))
      );
    }
  }

  return metas;
}

/* -------------------------------------------------- */
/* Main API: Cut / Copy File or Folder                 */
/* -------------------------------------------------- */
export async function moveorCopyPath(
  sourcePath: string,
  destinationPath: string,
  operation: OperationType,
  rootPath: string
): Promise<TransferResult> {
  try {
    const src = path.resolve(sourcePath);
    const destBase = path.resolve(destinationPath);
    const seenAt = Date.now();

    const srcStat = await fs.stat(src);
    const isDir = srcStat.isDirectory();

    // Resolve final destination
    let dest = destBase;
    try {
      if ((await fs.stat(destBase)).isDirectory()) {
        dest = path.join(destBase, path.basename(src));
      }
    } catch {
      // destination does not exist → treat as full path
    }

    await fs.mkdir(path.dirname(dest), { recursive: true });

    /* ---------- Filesystem Operation ---------- */
    if (operation === "copy") {
      if (isDir) {
        await fs.cp(src, dest, { recursive: true });
      } else {
        await fs.copyFile(src, dest);
      }
    } else {
      try {
        await fs.rename(src, dest);
      } catch (err: any) {
        if (err.code === "EXDEV") {
          if (isDir) await fs.cp(src, dest, { recursive: true });
          else await fs.copyFile(src, dest);
          await fs.rm(src, { recursive: true, force: true });
        } else {
          throw err;
        }
      }
    }

    /* ---------- DB Operation ---------- */
    const metas: FileMeta[] = [];

    if (isDir) {
      metas.push({
        path: dest,
        name: path.basename(dest),
        parent: path.basename(path.dirname(dest)),
        type: "directory",
        created_at: srcStat.birthtimeMs ?? null,
        modified_at: srcStat.mtimeMs ?? null,
        root_path: path.normalize(rootPath),
        last_seen_at: seenAt,
      });

      metas.push(
        ...(await collectSubtree(
          src,
          src,
          dest,
          rootPath,
          seenAt
        ))
      );
    } else {
      const newStat = await fs.stat(dest);
      metas.push({
        path: dest,
        name: path.basename(dest),
        parent: path.basename(path.dirname(dest)),
        type: "file",
        size: newStat.size,
        created_at: newStat.birthtimeMs ?? null,
        modified_at: newStat.mtimeMs ?? null,
        root_path: path.normalize(rootPath),
        last_seen_at: seenAt,
      });
    }

    await upsertMany(metas);

    // Remove old DB entries only for CUT
    if (operation === "cut") {
      await deleteByPathPrefix(src);
    }

    return { path: dest };
  } catch (err: any) {
    return { error: err?.message ?? "Cut / Copy failed" };
  }
}
