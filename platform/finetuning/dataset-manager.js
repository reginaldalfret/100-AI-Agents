/**
 * Sovereign AI Workbench — Fine-Tuning Dataset Manager
 * Handles dataset ingestion, type detection, quality gating, column mapping, and train/val/test splitting.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { loadDatasetFile, parseCSV } from "../datasets/dataset-parser.js";
import { profileDataset } from "../datasets/schema-profiler.js";

const DATASETS_DIR = path.resolve("data/fine-tuning/datasets");
if (!fs.existsSync(DATASETS_DIR)) {
  fs.mkdirSync(DATASETS_DIR, { recursive: true });
}

export const DatasetType = {
  INSTRUCTION: "INSTRUCTION",
  QUESTION_ANSWER: "QUESTION_ANSWER",
  INPUT_OUTPUT: "INPUT_OUTPUT",
  CLASSIFICATION: "CLASSIFICATION",
  TABULAR: "TABULAR",
  UNKNOWN: "UNKNOWN"
};

/**
 * Detects dataset structural type based on column names.
 */
export function detectDatasetType(columns = []) {
  const colNames = columns.map(c => (typeof c === "string" ? c : c.sqlName || c.originalName || "").toLowerCase());

  const hasInstruction = colNames.some(c => c.includes("instruction") || c.includes("prompt") || c.includes("task"));
  const hasOutput = colNames.some(c => c.includes("output") || c.includes("response") || c.includes("answer") || c.includes("target") || c.includes("completion"));
  const hasInput = colNames.some(c => c.includes("input") || c.includes("context") || c.includes("query"));
  const hasQuestion = colNames.some(c => c.includes("question") || c.includes("inquiry"));
  const hasLabel = colNames.some(c => c.includes("label") || c.includes("category") || c.includes("class"));

  if (hasInstruction && hasOutput) return DatasetType.INSTRUCTION;
  if (hasQuestion && hasOutput) return DatasetType.QUESTION_ANSWER;
  if (hasInput && hasOutput) return DatasetType.INPUT_OUTPUT;
  if (hasLabel && (hasInput || hasInstruction || colNames.some(c => c.includes("text")))) return DatasetType.CLASSIFICATION;

  // If purely tabular with domain stats
  if (colNames.length >= 2) return DatasetType.TABULAR;
  return DatasetType.UNKNOWN;
}

/**
 * Data Quality Gate: checks missing outputs, empty rows, duplicates, token lengths.
 */
export function validateDatasetQuality(rows = [], mapping = { instruction: "instruction", input: "input", output: "output" }) {
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  let emptyRowCount = 0;
  let missingOutputCount = 0;
  let totalTokens = 0;
  let maxTokens = 0;

  const seenHashes = new Set();
  const validExamples = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== "object" || Object.keys(row).length === 0) {
      emptyRowCount++;
      invalidCount++;
      continue;
    }

    const instruction = String(row[mapping.instruction] || row.instruction || row.question || row.prompt || "").trim();
    const input = String(row[mapping.input] || row.input || row.context || "").trim();
    const output = String(row[mapping.output] || row.output || row.response || row.answer || "").trim();

    if (!output) {
      missingOutputCount++;
      invalidCount++;
      errors.push(`Row ${i + 1}: Missing output target`);
      continue;
    }

    if (!instruction && !input) {
      invalidCount++;
      errors.push(`Row ${i + 1}: Missing instruction or input prompt`);
      continue;
    }

    const rowHash = crypto.createHash("sha256").update(`${instruction}|${input}|${output}`).digest("hex");
    if (seenHashes.has(rowHash)) {
      duplicateCount++;
      invalidCount++;
      continue;
    }
    seenHashes.add(rowHash);

    // Token length calculation approximation (~4 chars per token)
    const combinedLength = instruction.length + input.length + output.length;
    const tokens = Math.ceil(combinedLength / 4);
    totalTokens += tokens;
    if (tokens > maxTokens) maxTokens = tokens;

    if (tokens > 4096) {
      invalidCount++;
      errors.push(`Row ${i + 1}: Exceeds maximum sequence length of 4096 tokens (${tokens} tokens)`);
      continue;
    }

    validCount++;
    validExamples.push({
      instruction,
      input,
      output,
      tokens
    });
  }

  const passed = validCount >= 3 && validCount >= rows.length * 0.7;

  return {
    passed,
    validExamples: validCount,
    invalidExamples: invalidCount,
    duplicateExamples: duplicateCount,
    emptyRows: emptyRowCount,
    missingOutputs: missingOutputCount,
    totalTokens,
    averageTokens: validCount > 0 ? Math.round(totalTokens / validCount) : 0,
    maxTokens,
    examples: validExamples,
    errors: errors.slice(0, 10)
  };
}

/**
 * Splits valid dataset into Training, Validation, and Test sets with SHA-256 hash tracking.
 */
export function splitDataset(examples = [], trainRatio = 0.8, valRatio = 0.1, testRatio = 0.1) {
  if (examples.length === 0) {
    throw new Error("Cannot split empty dataset");
  }

  // Shuffle reproducibly
  const shuffled = [...examples].sort((a, b) => a.instruction.localeCompare(b.instruction));

  const total = shuffled.length;
  const trainEnd = Math.max(1, Math.floor(total * trainRatio));
  const valEnd = Math.max(trainEnd + 1, Math.floor(total * (trainRatio + valRatio)));

  const trainSet = shuffled.slice(0, trainEnd);
  const valSet = shuffled.slice(trainEnd, valEnd);
  const testSet = shuffled.slice(valEnd);

  const datasetHash = crypto.createHash("sha256").update(JSON.stringify(shuffled)).digest("hex");

  return {
    datasetHash,
    totalCount: total,
    trainCount: trainSet.length,
    valCount: valSet.length,
    testCount: testSet.length,
    trainSet,
    valSet,
    testSet
  };
}

/**
 * Ingests a training dataset file into the fine-tuning datasets directory.
 */
export function ingestTrainingDataset({ filename, buffer, content, originalName }) {
  const datasetId = `ft_ds_${crypto.randomBytes(5).toString("hex")}`;
  const ext = path.extname(filename || originalName || "data.csv").toLowerCase();
  const safeName = `${datasetId}_${path.basename(filename || originalName || "data", ext)}${ext}`;
  const targetPath = path.join(DATASETS_DIR, safeName);

  if (buffer) {
    fs.writeFileSync(targetPath, buffer);
  } else if (content) {
    fs.writeFileSync(targetPath, content, "utf8");
  }

  const parsed = loadDatasetFile(targetPath);
  const profile = profileDataset(parsed);
  const detectedType = detectDatasetType(profile.columns);

  const record = {
    dataset_id: datasetId,
    filename: originalName || filename || safeName,
    path: targetPath,
    format: ext.replace(/^\./, "").toUpperCase(),
    rows: profile.rowCount,
    columns: profile.columnCount,
    columnNames: profile.columns.map(c => c.originalName),
    detectedType,
    isCompatible: detectedType !== DatasetType.TABULAR && detectedType !== DatasetType.UNKNOWN,
    notice: detectedType === DatasetType.TABULAR ? "Dataset requires training-example transformation." : null,
    profile,
    created_at: new Date().toISOString()
  };

  return record;
}
