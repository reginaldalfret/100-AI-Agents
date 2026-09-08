/**
 * 301 SUPER AI — Personal Style Data Pipeline: Train/Val/Test Separation
 * Verifies dataset integrity, exact sample counts (200 train, 25 val, 25 test),
 * schema conformance, and 0 exact overlap / 0% data contamination.
 */

import fs from "node:fs";
import path from "node:path";

export const DEFAULT_SPLIT_COUNTS = {
  TRAIN: 200,
  VAL: 25,
  TEST: 25,
  TOTAL: 250
};

/**
 * Reads a JSONL file and parses each line into a JavaScript object.
 * 
 * @param {string} filePath - Absolute path to .jsonl file
 * @returns {Array<Object>}
 */
export function loadJsonl(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(`Failed to parse line ${idx + 1} in ${filePath}: ${err.message}`);
      }
    });
}

/**
 * Normalizes a conversation turn into a deterministic fingerprint string for overlap checking.
 */
export function turnFingerprint(turn) {
  const msgs = turn.messages || [];
  return msgs
    .map(m => `${m.role || ""}:${(m.content || "").trim().toLowerCase()}`)
    .join("|||");
}

/**
 * Checks for exact dialogue turn overlap between two datasets.
 * 
 * @param {Array<Object>} setA 
 * @param {Array<Object>} setB 
 * @returns {Object} `{ overlapCount: number, overlapItems: Array, contaminationRate: number }`
 */
export function calculateTurnOverlap(setA, setB) {
  const fingerprintsA = new Set(setA.map(turnFingerprint));
  const overlapItems = [];

  for (const itemB of setB) {
    const fpB = turnFingerprint(itemB);
    if (fingerprintsA.has(fpB)) {
      overlapItems.push(itemB);
    }
  }

  const overlapCount = overlapItems.length;
  const contaminationRate = setB.length > 0 ? (overlapCount / setB.length) : 0;

  return {
    overlapCount,
    overlapItems,
    contaminationRate,
    isClean: overlapCount === 0
  };
}

/**
 * Validates the schema of each record in a dataset.
 * 
 * @param {Array<Object>} dataset 
 * @returns {Object} `{ valid: boolean, errors: Array }`
 */
export function validateDatasetSchema(dataset) {
  const errors = [];

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    if (!item || typeof item !== "object") {
      errors.push(`Record ${i}: Not a valid JSON object`);
      continue;
    }

    if (!Array.isArray(item.messages) || item.messages.length !== 2) {
      errors.push(`Record ${i}: Expected 'messages' array of length 2`);
      continue;
    }

    const [userMsg, assistantMsg] = item.messages;

    if (!userMsg || userMsg.role !== "user" || typeof userMsg.content !== "string" || !userMsg.content.trim()) {
      errors.push(`Record ${i}: messages[0] must be non-empty user message`);
    }

    if (!assistantMsg || assistantMsg.role !== "assistant" || typeof assistantMsg.content !== "string" || !assistantMsg.content.trim()) {
      errors.push(`Record ${i}: messages[1] must be non-empty assistant message`);
    }
  }

  return {
    valid: errors.length === 0,
    errorCount: errors.length,
    errors
  };
}

/**
 * Performs complete audit across train, val, and test splits.
 * 
 * @param {string} datasetDir - Directory containing personal_style_train.jsonl, etc.
 * @param {Object} [expectedCounts] - Expected sample sizes
 * @returns {Object} Full verification report
 */
export function verifyTrainTestSeparation(datasetDir, expectedCounts = DEFAULT_SPLIT_COUNTS) {
  const trainPath = path.join(datasetDir, "personal_style_train.jsonl");
  const valPath = path.join(datasetDir, "personal_style_val.jsonl");
  const testPath = path.join(datasetDir, "personal_style_test.jsonl");

  const trainData = loadJsonl(trainPath);
  const valData = loadJsonl(valPath);
  const testData = loadJsonl(testPath);

  // 1. Schema Validation
  const trainSchema = validateDatasetSchema(trainData);
  const valSchema = validateDatasetSchema(valData);
  const testSchema = validateDatasetSchema(testData);

  // 2. Count Validation
  const counts = {
    train: trainData.length,
    val: valData.length,
    test: testData.length,
    total: trainData.length + valData.length + testData.length
  };

  const countsMatch =
    counts.train === expectedCounts.TRAIN &&
    counts.val === expectedCounts.VAL &&
    counts.test === expectedCounts.TEST;

  // 3. Overlap Verification
  const trainValOverlap = calculateTurnOverlap(trainData, valData);
  const trainTestOverlap = calculateTurnOverlap(trainData, testData);
  const valTestOverlap = calculateTurnOverlap(valData, testData);

  const zeroOverlap =
    trainValOverlap.overlapCount === 0 &&
    trainTestOverlap.overlapCount === 0 &&
    valTestOverlap.overlapCount === 0;

  return {
    success: countsMatch && zeroOverlap && trainSchema.valid && valSchema.valid && testSchema.valid,
    counts,
    expectedCounts,
    countsMatch,
    overlaps: {
      trainVal: trainValOverlap,
      trainTest: trainTestOverlap,
      valTest: valTestOverlap,
      zeroOverlap
    },
    schemas: {
      trainValid: trainSchema.valid,
      valValid: valSchema.valid,
      testValid: testSchema.valid
    }
  };
}
