// db.ts — Cross-platform SQLite setup for Electron
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { app } from "electron";
import { isDev } from "../util.js";

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

// ---------------- Globals ----------------
let db: Database.Database | null = null;
let DB_FILE = "";

// ---------------- Helper: Resolve database path safely ----------------
function resolveDatabasePath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  if (isDev()) {
    //  Development mode → local ./data folder (project root)
    const projectRoot = path.resolve(__dirname, "../../");
    const devDir = path.join(projectRoot, "data");
    fs.mkdirSync(devDir, { recursive: true });
    return path.join(devDir, "files_index.db");
  } else {
    // Production mode → Electron's userData folder
    // app.getPath is only valid after app is ready
    const userDataPath = app.isReady()
      ? app.getPath("userData")
      : path.join(process.cwd(), "userdata_fallback");

    const dbDir = path.join(userDataPath, "data");
    fs.mkdirSync(dbDir, { recursive: true });
    return path.join(dbDir, "files_index.db");
  }
}

// ---------------- Initialize DB ----------------
export function initDB() {
  if (db) return; // already initialized

  DB_FILE = resolveDatabasePath();
  db = new Database(DB_FILE);

  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("temp_store = MEMORY");
  db.pragma("foreign_keys = ON");

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

  console.log(`[DB] Initialized at: ${DB_FILE}`);
}

// ---------------- Ensure DB is ready ----------------
export function ensureDB(): Database.Database {
  if (!db) initDB();
  return db!;
}

// ---------------- SQL Statements (lazy prepared) ----------------
function getStatements(database: Database.Database) {
  return {
    upsertStmt: database.prepare(`
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
    `),

    deleteByPathStmt: database.prepare(`DELETE FROM files_index WHERE path = ?`),
    getByPathStmt: database.prepare(`SELECT * FROM files_index WHERE path = ?`),
    recentFilesStmt: database.prepare(`
      SELECT * FROM files_index
      WHERE type = 'file'
      ORDER BY modified_at DESC
      LIMIT ?
    `),
    searchByNameStmt: database.prepare(`
      SELECT * FROM files_index
      WHERE LOWER(name) LIKE LOWER(?)
      ORDER BY modified_at DESC
      LIMIT ?
    `),
  };
}

// ---------------- Functions ----------------
export function upsertFile(meta: FileMeta) {
  const database = ensureDB();
  const { upsertStmt } = getStatements(database);

  return upsertStmt.run({
    path: path.normalize(meta.path),
    parent: path.normalize(meta.parent ?? path.dirname(meta.path)),
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
  const database = ensureDB();
  const { deleteByPathStmt } = getStatements(database);
  return deleteByPathStmt.run(fullPath);
}

export function getByPath(fullPath: string) {
  const database = ensureDB();
  const { getByPathStmt } = getStatements(database);
  return getByPathStmt.get(fullPath);
}

export function getRecentFiles(limit = 50) {
  const database = ensureDB();
  const { recentFilesStmt } = getStatements(database);
  return recentFilesStmt.all(limit);
}

export function searchByName(term: string, limit = 100) {
  const database = ensureDB();
  const { searchByNameStmt } = getStatements(database);
  return searchByNameStmt.all(`%${term}%`, limit);
}

export const upsertMany = (rows: FileMeta[]) => {
  const database = ensureDB();
  const { upsertStmt } = getStatements(database);

  const transaction = database.transaction((items: FileMeta[]) => {
    for (const item of items) {
      upsertStmt.run({
        path: path.normalize(item.path),
        parent: path.normalize(item.parent ?? path.dirname(item.path)),
        name: item.name,
        type: item.type,
        extension: item.extension ?? "",
        size: item.size ?? 0,
        created_at: item.created_at ?? null,
        modified_at: item.modified_at ?? null,
        hash: item.hash ?? null,
      });
    }
  });

  return transaction(rows);
};

export function deleteByPathPrefix(prefix: string) { //for copy or cut operations removes danglng references
  const database = ensureDB();

  const normalized = path.normalize(prefix);

  const stmt = database.prepare(`
    DELETE FROM files_index
    WHERE path = ?
       OR path LIKE ? || '/%'
  `);

  return stmt.run(normalized, normalized);
}


export function vacuum() {
  const database = ensureDB();
  database.exec("VACUUM");
}


export function resetDB() {
  const database = ensureDB();

  console.log("[DB] Resetting files_index table");

  database.exec(`
    DROP TABLE IF EXISTS files_index;
  `);

  database.exec(`
    CREATE TABLE files_index (
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

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_files_name        ON files_index(name);
    CREATE INDEX IF NOT EXISTS idx_files_parent      ON files_index(parent);
    CREATE INDEX IF NOT EXISTS idx_files_ext         ON files_index(extension);
    CREATE INDEX IF NOT EXISTS idx_files_modified_at ON files_index(modified_at);
    CREATE INDEX IF NOT EXISTS idx_files_type        ON files_index(type);
  `);

  console.log("[DB] files_index reset complete");
}


export function closeDB() {
  if (db) {
    db.pragma("wal_checkpoint(FULL)");
    db.close();
    db = null;
    console.log("[DB] Closed.");
  }
}
