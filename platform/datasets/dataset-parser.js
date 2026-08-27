/**
 * Sovereign AI Workbench — Dataset Parser
 * High-speed parsing of CSV, TSV, JSON, and XLSX data into structured records.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/**
 * Parses raw CSV/TSV text into an array of row objects and column names.
 * Supports quoted fields, escaped quotes, commas/tabs, and varied line breaks.
 */
export function parseCSV(content, delimiter = null) {
  if (typeof content !== "string") {
    content = String(content || "");
  }

  // Detect delimiter if not provided
  if (!delimiter) {
    const firstLine = content.slice(0, 2048).split(/[\r\n]+/)[0] || "";
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const pipeCount = (firstLine.match(/\|/g) || []).length;

    if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";
    else if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
    else if (pipeCount > commaCount && pipeCount > tabCount) delimiter = "|";
    else delimiter = ",";
  }

  const rows = [];
  let currentRow = [];
  let currentField = "";
  let insideQuotes = false;
  let i = 0;
  const len = content.length;

  while (i < len) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      } else {
        insideQuotes = !insideQuotes;
        i++;
        continue;
      }
    }

    if (!insideQuotes && char === delimiter) {
      currentRow.push(currentField.trim());
      currentField = "";
      i++;
      continue;
    }

    if (!insideQuotes && (char === "\r" || char === "\n")) {
      currentRow.push(currentField.trim());
      currentField = "";
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      if (char === "\r" && nextChar === "\n") i += 2;
      else i++;
      continue;
    }

    currentField += char;
    i++;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return { columns: [], rows: [], rowCount: 0 };
  }

  // First row is headers
  const rawHeaders = rows[0];
  const columns = rawHeaders.map((h, idx) => {
    let clean = (h || `col_${idx + 1}`).trim();
    if (!clean) clean = `col_${idx + 1}`;
    return clean;
  });

  const parsedRows = [];
  for (let r = 1; r < rows.length; r++) {
    const rowData = rows[r];
    if (!rowData || rowData.length === 0) continue;
    const obj = {};
    for (let c = 0; c < columns.length; c++) {
      const colName = columns[c];
      const val = rowData[c] !== undefined ? rowData[c] : null;
      obj[colName] = val === "" ? null : val;
    }
    parsedRows.push(obj);
  }

  return {
    columns,
    rows: parsedRows,
    rowCount: parsedRows.length
  };
}

/**
 * Parses JSON dataset (array of objects or object with rows array).
 */
export function parseJSON(content) {
  let data;
  if (typeof content === "string") {
    data = JSON.parse(content);
  } else {
    data = content;
  }

  let array = [];
  if (Array.isArray(data)) {
    array = data;
  } else if (data && typeof data === "object") {
    if (Array.isArray(data.rows)) array = data.rows;
    else if (Array.isArray(data.data)) array = data.data;
    else if (Array.isArray(data.items)) array = data.items;
    else array = [data];
  }

  if (array.length === 0) {
    return { columns: [], rows: [], rowCount: 0 };
  }

  const columnsSet = new Set();
  array.forEach(item => {
    if (item && typeof item === "object") {
      Object.keys(item).forEach(k => columnsSet.add(k));
    }
  });

  const columns = Array.from(columnsSet);
  const rows = array.map(item => {
    const row = {};
    columns.forEach(c => {
      row[c] = item[c] !== undefined ? item[c] : null;
    });
    return row;
  });

  return {
    columns,
    rows,
    rowCount: rows.length
  };
}

/**
 * Basic pure JS XML/ZIP extraction for simple XLSX files without binary dependencies.
 */
export function parseXLSX(bufferOrPath) {
  let buf;
  if (typeof bufferOrPath === "string") {
    buf = fs.readFileSync(bufferOrPath);
  } else {
    buf = bufferOrPath;
  }

  // Check for PK ZIP signature
  if (buf[0] === 0x50 && buf[1] === 0x4B) {
    try {
      // Decompress files from zip
      const files = extractZipEntries(buf);
      const sharedStringsXml = files["xl/sharedStrings.xml"] || "";
      const sheetXml = files["xl/worksheets/sheet1.xml"] || "";

      if (sheetXml) {
        return parseXlsxXml(sheetXml, sharedStringsXml);
      }
    } catch (err) {
      console.warn("[XLSX_PARSER] Fast ZIP extraction warning:", err.message);
    }
  }

  // Fallback: Attempt CSV parse in case file was saved as tab/comma separated with .xlsx extension
  const text = buf.toString("utf8");
  return parseCSV(text);
}

function extractZipEntries(buffer) {
  const entries = {};
  let offset = 0;
  while (offset < buffer.length - 4) {
    // Look for Local File Header Signature: 0x04034b50
    if (buffer.readUInt32LE(offset) === 0x04034b50) {
      const compression = buffer.readUInt16LE(offset + 8);
      const compressedSize = buffer.readUInt32LE(offset + 18);
      const uncompressedSize = buffer.readUInt32LE(offset + 22);
      const fileNameLen = buffer.readUInt16LE(offset + 26);
      const extraFieldLen = buffer.readUInt16LE(offset + 28);

      const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLen);
      const dataOffset = offset + 30 + fileNameLen + extraFieldLen;
      const compressedData = buffer.slice(dataOffset, dataOffset + compressedSize);

      let uncompressedData = null;
      if (compression === 0) {
        uncompressedData = compressedData;
      } else if (compression === 8) {
        try {
          uncompressedData = zlib.inflateRawSync(compressedData);
        } catch {
          // ignore individual entry error
        }
      }

      if (uncompressedData) {
        entries[fileName] = uncompressedData.toString("utf8");
      }

      offset = dataOffset + compressedSize;
    } else {
      offset++;
    }
  }
  return entries;
}

function parseXlsxXml(sheetXml, sharedStringsXml) {
  // 1. Extract shared strings
  const sharedStrings = [];
  const strMatches = sharedStringsXml.match(/<t[^>]*>(.*?)<\/t>/gs) || [];
  strMatches.forEach(m => {
    const val = m.replace(/<[^>]+>/g, "");
    sharedStrings.push(val);
  });

  // 2. Extract rows from sheet
  const rowMatches = sheetXml.match(/<row[^>]*>(.*?)<\/row>/gs) || [];
  const matrix = [];

  rowMatches.forEach(r => {
    const cMatches = r.match(/<c[^>]*>(.*?)<\/c>/gs) || [];
    const rowValues = [];
    cMatches.forEach(c => {
      const isString = c.includes('t="s"');
      const vMatch = c.match(/<v>(.*?)<\/v>/);
      if (vMatch) {
        const val = vMatch[1];
        if (isString && sharedStrings[parseInt(val, 10)] !== undefined) {
          rowValues.push(sharedStrings[parseInt(val, 10)]);
        } else {
          rowValues.push(val);
        }
      } else {
        rowValues.push(null);
      }
    });
    if (rowValues.length > 0) matrix.push(rowValues);
  });

  if (matrix.length === 0) {
    return { columns: [], rows: [], rowCount: 0 };
  }

  const rawHeaders = matrix[0];
  const columns = rawHeaders.map((h, i) => (h ? String(h).trim() : `col_${i + 1}`));
  const rows = [];

  for (let r = 1; r < matrix.length; r++) {
    const rowVals = matrix[r];
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = rowVals[i] !== undefined ? rowVals[i] : null;
    });
    rows.push(obj);
  }

  return {
    columns,
    rows,
    rowCount: rows.length
  };
}

/**
 * Universal Dataset Loader based on extension.
 */
export function loadDatasetFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`FILE_NOT_FOUND: Dataset file does not exist: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv" || ext === ".tsv" || ext === ".txt") {
    const content = fs.readFileSync(filePath, "utf8");
    return parseCSV(content);
  } else if (ext === ".json") {
    const content = fs.readFileSync(filePath, "utf8");
    return parseJSON(content);
  } else if (ext === ".xlsx" || ext === ".xls") {
    return parseXLSX(filePath);
  } else {
    // Default fallback to CSV
    const content = fs.readFileSync(filePath, "utf8");
    return parseCSV(content);
  }
}
