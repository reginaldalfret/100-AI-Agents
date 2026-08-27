/**
 * Sovereign AI Workbench — Deterministic SQL Query Engine
 * In-memory / DuckDB-compatible analytical SQL execution engine with strict READ-ONLY enforcement.
 */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// Active in-memory SQLite instances per dataset
const activeDatabases = new Map();

/**
 * Validates that an incoming SQL query is strictly read-only and safe.
 */
export function validateReadOnlySQL(sql, allowedTableName = null) {
  if (!sql || typeof sql !== "string") {
    return { valid: false, error: "Empty or invalid SQL query string" };
  }

  const clean = sql.trim().replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();

  // 1. Block multiple queries / stacked statements (semicolons not inside quotes)
  const nonQuotedSemicolons = clean.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""');
  if (/;[\s\S]+\S/.test(nonQuotedSemicolons)) {
    return { valid: false, error: "SECURITY_VIOLATION: Multiple SQL statements are strictly prohibited" };
  }

  // 2. Must start with SELECT, WITH, or EXPLAIN
  if (!/^(SELECT|WITH|EXPLAIN)\s+/i.test(clean)) {
    return { valid: false, error: "SECURITY_VIOLATION: Only SELECT or CTE (WITH) queries are permitted" };
  }

  // 3. Blacklisted mutation keywords
  const forbiddenKeywords = [
    /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|REPLACE|UPSERT)\b/i,
    /\b(ATTACH|DETACH|PRAGMA|VACUUM|REINDEX|GRANT|REVOKE)\b/i,
    /\b(LOAD_EXTENSION|READ_BLOB|WRITE_BLOB|FS_READ|FS_WRITE)\b/i,
    /\b(INTO\s+OUTFILE|INTO\s+DUMPFILE)\b/i,
    /\b(SHELL|SYSTEM|EXEC|EXECUTE)\b/i
  ];

  for (const pattern of forbiddenKeywords) {
    if (pattern.test(nonQuotedSemicolons)) {
      return { valid: false, error: `SECURITY_VIOLATION: Forbidden SQL keyword detected matching: ${pattern}` };
    }
  }

  return { valid: true, cleanSql: clean.replace(/;+$/, "") };
}

/**
 * Loads a dataset into an isolated in-memory analytical SQL table.
 */
export function loadDatasetIntoEngine(datasetId, parsedData, profile) {
  const db = new DatabaseSync(":memory:");
  const tableName = "dataset";

  // Create table schema
  const colDefs = profile.columns.map(c => {
    let t = "TEXT";
    if (c.type === "INTEGER") t = "INTEGER";
    else if (c.type === "REAL") t = "REAL";
    return `"${c.sqlName}" ${t}`;
  }).join(", ");

  db.exec(`CREATE TABLE "${tableName}" (${colDefs});`);

  // Insert records in a single fast transaction
  if (parsedData.rows && parsedData.rows.length > 0) {
    const cols = profile.columns.map(c => c.sqlName);
    const origCols = profile.columns.map(c => c.originalName);
    const placeholders = cols.map(() => "?").join(", ");
    const insertStmt = db.prepare(`INSERT INTO "${tableName}" (${cols.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders});`);

    db.exec("BEGIN TRANSACTION;");
    for (const row of parsedData.rows) {
      const vals = origCols.map((orig, i) => {
        const val = row[orig];
        if (val === null || val === undefined || val === "") return null;
        const colType = profile.columns[i].type;
        if (colType === "INTEGER") {
          const num = parseInt(val, 10);
          return isNaN(num) ? null : num;
        } else if (colType === "REAL") {
          const num = parseFloat(val);
          return isNaN(num) ? null : num;
        }
        return String(val);
      });
      insertStmt.run(...vals);
    }
    db.exec("COMMIT;");
  }

  activeDatabases.set(datasetId, {
    db,
    tableName,
    profile,
    rowCount: parsedData.rowCount
  });

  return { datasetId, tableName, rowCount: parsedData.rowCount };
}

/**
 * Executes a verified SQL query against a registered dataset.
 */
export function executeDatasetSQL(datasetId, sqlQuery) {
  const t0 = Date.now();

  const datasetInstance = activeDatabases.get(datasetId);
  if (!datasetInstance) {
    throw new Error(`DATASET_NOT_LOADED: Dataset ${datasetId} is not loaded in SQL engine`);
  }

  const validation = validateReadOnlySQL(sqlQuery, datasetInstance.tableName);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const db = datasetInstance.db;

  try {
    const stmt = db.prepare(validation.cleanSql);
    const rows = stmt.all();
    const dt = Date.now() - t0;

    let columns = [];
    if (rows.length > 0 && typeof rows[0] === "object") {
      columns = Object.keys(rows[0]);
    }

    return {
      status: "success",
      dataset_id: datasetId,
      sql: validation.cleanSql,
      execution_time_ms: dt,
      row_count: rows.length,
      columns,
      result: rows,
      rows_scanned: datasetInstance.rowCount
    };
  } catch (err) {
    throw new Error(`SQL_EXECUTION_ERROR: ${err.message}`);
  }
}

/**
 * Closes and frees in-memory database for a dataset.
 */
export function unloadDatasetFromEngine(datasetId) {
  if (activeDatabases.has(datasetId)) {
    try {
      const inst = activeDatabases.get(datasetId);
      inst.db.close();
    } catch {
      // ignore
    }
    activeDatabases.delete(datasetId);
  }
}

export function isDatasetLoadedInEngine(datasetId) {
  return activeDatabases.has(datasetId);
}
