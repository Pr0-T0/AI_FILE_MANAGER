// db.ts
// SQLite wrapper for your AI file manager (TypeScript version)

import path from "path";
import Database from "better-sqlite3";

// ---------------- Types ----------------

export interface FileMeta {
  path: string;
  parent?: string;
  name: string;
  type: "file" | "directory";
  extension?: string;
  size?: number;
  created_at?: number | null;
  modified_at?: number | null;
  hash?: string | null;
}

// ---------------- Init DB ----------------

const DB_FILE = path.resolve(__dirname, "files_index.db");
export const db = new Database(DB_FILE);

// PRAGMA settings for better performance
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("temp_store = MEMORY");
db.pragma("foreign_keys = ON");

// ---------------- Schema ----------------

db.exec(`
CREATE TABLE IF NOT EXISTS files_index (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  path          TEXT NOT NULL UNIQUE,
  parent        TEXT,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  extension     TEXT,
  size          INTEGER DEFAULT 0,
  created_at    INTEGER,
  modified_at   INTEGER,
  hash          TEXT
);
`);

db.exec(`
CREATE INDEX IF NOT EXISTS idx_files_name        ON files_index(name);
CREATE INDEX IF NOT EXISTS idx_files_parent      ON files_index(parent);
CREATE INDEX IF NOT EXISTS idx_files_ext         ON files_index(extension);
CREATE INDEX IF NOT EXISTS idx_files_modified_at ON files_index(modified_at);
CREATE INDEX IF NOT EXISTS idx_files_type        ON files_index(type);
`);

// ---------------- SQL Statements ----------------

const upsertStmt = db.prepare(`
INSERT INTO files_index (path, parent, name, type, extension, size, created_at, modified_at, hash)
VALUES (@path, @parent, @name, @type, @extension, @size, @created_at, @modified_at, @hash)
ON CONFLICT(path) DO UPDATE SET
  parent      = excluded.parent,
  name        = excluded.name,
  type        = excluded.type,
  extension   = excluded.extension,
  size        = excluded.size,
  created_at  = COALESCE(excluded.created_at, files_index.created_at),
  modified_at = excluded.modified_at,
  hash        = excluded.hash;
`);

const deleteByPathStmt = db.prepare(`DELETE FROM files_index WHERE path = ?`);
const getByPathStmt = db.prepare(`SELECT * FROM files_index WHERE path = ?`);
const recentFilesStmt = db.prepare(`
  SELECT * FROM files_index
  WHERE type = 'file'
  ORDER BY modified_at DESC
  LIMIT ?
`);
const searchByNameStmt = db.prepare(`
  SELECT * FROM files_index
  WHERE name LIKE ?
  ORDER BY modified_at DESC
  LIMIT ?
`);

// ---------------- Functions ----------------

export function upsertFile(meta: FileMeta) {
  return upsertStmt.run({
    path: meta.path,
    parent: meta.parent ?? path.dirname(meta.path),
    name: meta.name,
    type: meta.type,
    extension: meta.extension ?? "",
    size: meta.size ?? 0,
    created_at: meta.created_at ?? null,
    modified_at: meta.modified_at ?? null,
    hash: meta.hash ?? null,
  });
}

export function removePath(fullPath: string) {
  return deleteByPathStmt.run(fullPath);
}

export function getByPath(fullPath: string) {
  return getByPathStmt.get(fullPath);
}

export function getRecentFiles(limit = 50) {
  return recentFilesStmt.all(limit);
}

export function searchByName(term: string, limit = 100) {
  return searchByNameStmt.all(`%${term}%`, limit);
}

export const upsertMany = db.transaction((rows: FileMeta[]) => {
  for (const r of rows) upsertFile(r);
});

export function vacuum() {
  db.exec("VACUUM");
}

export function closeDB() {
  db.close();
}
