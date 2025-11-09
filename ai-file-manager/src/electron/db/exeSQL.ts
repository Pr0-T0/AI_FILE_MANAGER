//this function executes the sql from AI model and returns the resulting list of values

// executeSQL.ts
import { ensureDB } from "./db.js";

/**
 * Executes any SQL query string against your current database.
 * Logs results or errors automatically.
 *
 * @param sql - The SQL query to execute.
 * @param params - Optional parameters for the query.
 * @returns Query result (rows or info), or null if an error occurred.
 */
export function executeSQL(sql: string, params: any[] = []): any {
  const db = ensureDB();
  const trimmed = sql.trim().toUpperCase();

  try {
    let result;

    if (trimmed.startsWith("SELECT")) {
      result = db.prepare(sql).all(...params);
      console.log(`[SQL] SELECT executed successfully (${result.length} rows)`);
      console.table(result);
    } else if (
      trimmed.startsWith("INSERT") ||
      trimmed.startsWith("UPDATE") ||
      trimmed.startsWith("DELETE")
    ) {
      const info = db.prepare(sql).run(...params);
      console.log(
        `[SQL] ${trimmed.split(" ")[0]} executed successfully — Changes: ${info.changes}, LastInsertRowId: ${info.lastInsertRowid}`
      );
      result = info;
    } else {
      db.exec(sql);
      console.log(`[SQL] Executed successfully (no result set).`);
      result = true;
    }

    return result; // sql query responce -> AI model for resoning
  } catch (err: any) {
    console.error("[SQL ERROR]", err.message);
    console.error("Query:", sql);
    if (params.length) console.error("Params:", params);
    return null;
  }
}
