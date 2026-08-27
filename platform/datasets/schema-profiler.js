/**
 * Sovereign AI Workbench — Dataset Schema Profiler
 * Analyzes dataset columns, infers SQL types, detects nulls/duplicates, and computes summary statistics.
 */

export function sanitizeColumnName(name, index = 0) {
  if (!name || typeof name !== "string") return `col_${index + 1}`;
  let clean = name.trim().toLowerCase();
  clean = clean.replace(/[^a-z0-9_]+/g, "_");
  clean = clean.replace(/^_+|_+$/g, "");
  if (/^[0-9]/.test(clean)) clean = `c_${clean}`;
  if (!clean) clean = `col_${index + 1}`;
  return clean;
}

export function inferSqlType(values) {
  const nonNulls = values.filter(v => v !== null && v !== undefined && v !== "");
  if (nonNulls.length === 0) return "TEXT";

  let isInt = true;
  let isReal = true;
  let isBool = true;
  let isDate = true;

  for (const v of nonNulls) {
    const s = String(v).trim();

    // Check Boolean
    if (isBool) {
      const lower = s.toLowerCase();
      if (lower !== "true" && lower !== "false" && lower !== "1" && lower !== "0" && lower !== "yes" && lower !== "no") {
        isBool = false;
      }
    }

    // Check Integer
    if (isInt) {
      if (!/^-?\d+$/.test(s)) {
        isInt = false;
      }
    }

    // Check Float / Real
    if (isReal) {
      if (!/^-?\d*(\.\d+)?([eE][-+]?\d+)?$/.test(s) || s === "." || s === "-") {
        isReal = false;
      }
    }

    // Check Date
    if (isDate) {
      const isIso = /^\d{4}-\d{2}-\d{2}/.test(s);
      const isSlash = /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s);
      if (!isIso && !isSlash && isNaN(Date.parse(s))) {
        isDate = false;
      }
    }
  }

  if (isInt) return "INTEGER";
  if (isReal) return "REAL";
  if (isBool && nonNulls.length > 2) return "BOOLEAN";
  if (isDate && nonNulls.length > 2) return "DATE";
  return "TEXT";
}

export function profileDataset(parsedData) {
  const rawColumns = parsedData.columns || [];
  const rows = parsedData.rows || [];
  const totalRows = rows.length;

  // Build mapping from original column name to sanitized SQL column name
  const columnMapping = {};
  const usedNames = new Set();

  const sanitizedColumns = rawColumns.map((raw, idx) => {
    let clean = sanitizeColumnName(raw, idx);
    let uniqueName = clean;
    let counter = 1;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${clean}_${counter++}`;
    }
    usedNames.add(uniqueName);
    columnMapping[raw] = uniqueName;
    return {
      originalName: raw,
      sqlName: uniqueName
    };
  });

  // Calculate stats per column
  const columnProfiles = sanitizedColumns.map(col => {
    const orig = col.originalName;
    const values = rows.map(r => r[orig]);
    const nullCount = values.filter(v => v === null || v === undefined || v === "").length;
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== "");
    const sqlType = inferSqlType(values);

    const distinctSet = new Set(nonNullValues);
    const distinctCount = distinctSet.size;

    let min = null;
    let max = null;
    let avg = null;

    if ((sqlType === "INTEGER" || sqlType === "REAL") && nonNullValues.length > 0) {
      const numVals = nonNullValues.map(v => Number(v)).filter(n => !isNaN(n));
      if (numVals.length > 0) {
        min = Math.min(...numVals);
        max = Math.max(...numVals);
        avg = (numVals.reduce((a, b) => a + b, 0) / numVals.length).toFixed(2);
      }
    } else if (nonNullValues.length > 0) {
      min = nonNullValues[0];
      max = nonNullValues[nonNullValues.length - 1];
    }

    const sampleValues = Array.from(distinctSet).slice(0, 5);

    return {
      originalName: col.originalName,
      sqlName: col.sqlName,
      type: sqlType,
      nullCount,
      nullPercentage: totalRows > 0 ? ((nullCount / totalRows) * 100).toFixed(1) : "0.0",
      distinctCount,
      min,
      max,
      avg,
      sampleValues
    };
  });

  // Check duplicate rows
  const rowStrings = new Set();
  let duplicateCount = 0;
  for (const r of rows) {
    const s = JSON.stringify(r);
    if (rowStrings.has(s)) {
      duplicateCount++;
    } else {
      rowStrings.add(s);
    }
  }

  return {
    rowCount: totalRows,
    columnCount: rawColumns.length,
    duplicateRows: duplicateCount,
    columnMapping,
    columns: columnProfiles,
    summary: {
      totalRows,
      totalColumns: rawColumns.length,
      duplicateRows: duplicateCount,
      numericColumns: columnProfiles.filter(c => c.type === "INTEGER" || c.type === "REAL").map(c => c.sqlName),
      textColumns: columnProfiles.filter(c => c.type === "TEXT").map(c => c.sqlName),
      dateColumns: columnProfiles.filter(c => c.type === "DATE").map(c => c.sqlName)
    }
  };
}
