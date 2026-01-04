/**
 * Normalizes raw SQL execution results into explicit, UI-safe structures.
 * This is a HARD boundary between SQL semantics and AI/UI logic.
 */

//   Normalized result types

export type NormalizedResult =
  | NormalizedFilesResult
  | NormalizedAggregateResult;

export type NormalizedFilesResult = {
  kind: "files";
  items: NormalizedFile[];
};

export type NormalizedFile = {
  id: string;
  name: string;
  path: string;
  parent: string | null;
  type: "file" | "folder";
  file_type: "image" | "pdf" | "doc" | "excel" | "folder" | "other";
  extension?: string;
  size?: number;
  modified_at?: string;
};

export type NormalizedAggregateResult = {
  kind: "aggregate";
  metric: string;          // count | sum | avg | min | max
  field?: string;          // size, extension, etc
  scope?: string;          // optional path/context
  value?: number;          // single-value aggregates
  rows?: Array<{           // GROUP BY results
    key: string;
    value: number;
  }>;
};

//  Entry point


export function normalizeSQLResult(rows: any[]): NormalizedResult {
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      kind: "files",
      items: [],
    };
  }

  // Decide by inspecting the first row
  if (isAggregateRow(rows[0])) {
    return normalizeAggregate(rows);
  }

  return normalizeFiles(rows);
}

// File normalization

function normalizeFiles(rows: any[]): NormalizedFilesResult {
  return {
    kind: "files",
    items: rows.map((row) => {
      const type: "file" | "folder" =
        row.type === "directory" ? "folder" : "file";

      const extension = row.extension ?? undefined;

      return {
        id: row.path,
        name: row.name,
        path: row.path,
        parent: row.parent ?? null,
        type,
        file_type: classifyFile(type, extension), 
        extension,
        size: row.size ?? undefined,
        modified_at: row.modified_at ?? undefined,
      };
    }),
  };
}


// Aggregate normalization

function normalizeAggregate(rows: any[]): NormalizedAggregateResult {
  const keys = Object.keys(rows[0]);

  // Single-value aggregate (COUNT, SUM, AVG, etc.)
  if (rows.length === 1 && keys.length === 1) {
    const metric = keys[0];
    return {
      kind: "aggregate",
      metric,
      value: Number(rows[0][metric]),
    };
  }

  // GROUP BY aggregate (e.g. extension, COUNT)
  if (keys.length === 2) {
    const [groupKey, valueKey] = keys;

    return {
      kind: "aggregate",
      metric: valueKey,
      field: groupKey,
      rows: rows.map((r) => ({
        key: String(r[groupKey]),
        value: Number(r[valueKey]),
      })),
    };
  }

  // Fallback (still explicit)
  return {
    kind: "aggregate",
    metric: "unknown",
  };
}

/* =======================
   Helpers
   ======================= */

function isAggregateRow(row: any): boolean {
  // Aggregate rows usually:
  // - lack path/name
  // - contain numeric-only values or grouped keys
  if ("path" in row || "name" in row) return false;

  const values = Object.values(row);
  return values.every(
    (v) => typeof v === "number" || typeof v === "string"
  );
}

function classifyFile(
  type: "file" | "folder",
  extension?: string
): NormalizedFile["file_type"] {
  if (type === "folder") return "folder";
  if (!extension) return "other";

  const ext = extension.toLowerCase().replace(/^\./, "");

  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  if (["doc", "docx"].includes(ext)) return "doc";

  return "other";
}

