/**
 * Sovereign AI Workbench — Fine-Tuning Dataset Formatter
 * Converts tabular CSV/XLSX datasets into Alpaca, ChatML, and ShareGPT JSONL training formats.
 */

import fs from "node:fs";
import path from "node:path";

export const TrainingFormat = {
  ALPACA: "alpaca",
  CHATML: "chatml",
  SHAREGPT: "sharegpt"
};

/**
 * Formats raw dataset rows into structured LLM training pairs with train/validation split.
 */
export function formatDatasetForTraining({
  rows = [],
  mapping = {
    instruction: "instruction",
    input: "input",
    output: "output",
    system: "system"
  },
  format = TrainingFormat.ALPACA,
  systemPrompt = "You are a specialized fine-tuned assistant for 301 Super AI.",
  trainSplit = 0.8
}) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("DATASET_EMPTY: Cannot format empty dataset for fine-tuning");
  }

  const formattedSamples = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    if (!row || typeof row !== "object") continue;

    const instructionVal = row[mapping.instruction] || row.instruction || row.prompt || row.question || row.task || "";
    const inputVal = row[mapping.input] || row.input || row.context || "";
    const outputVal = row[mapping.output] || row.output || row.response || row.answer || row.target || "";
    const systemVal = row[mapping.system] || row.system || systemPrompt;

    if (!instructionVal && !outputVal) continue;

    if (format === TrainingFormat.CHATML) {
      const messages = [{ role: "system", content: String(systemVal).trim() }];
      const userMsg = inputVal ? `${instructionVal}\n\nContext:\n${inputVal}` : String(instructionVal);
      messages.push({ role: "user", content: userMsg.trim() });
      messages.push({ role: "assistant", content: String(outputVal).trim() });
      formattedSamples.push({ messages });
    } else if (format === TrainingFormat.SHAREGPT) {
      const conversations = [
        { from: "system", value: String(systemVal).trim() },
        { from: "human", value: inputVal ? `${instructionVal}\n\n${inputVal}` : String(instructionVal).trim() },
        { from: "gpt", value: String(outputVal).trim() }
      ];
      formattedSamples.push({ conversations });
    } else {
      // Default: Alpaca format
      formattedSamples.push({
        instruction: String(instructionVal).trim(),
        input: String(inputVal).trim(),
        output: String(outputVal).trim(),
        system: String(systemVal).trim()
      });
    }
  }

  if (formattedSamples.length === 0) {
    throw new Error("FORMATTING_FAILED: No valid instruction/output samples could be constructed");
  }

  // Shuffle & Split into Train / Validation sets
  const shuffled = [...formattedSamples].sort(() => 0.5 - Math.random());
  const splitIndex = Math.max(1, Math.floor(shuffled.length * trainSplit));
  const trainSet = shuffled.slice(0, splitIndex);
  const valSet = shuffled.slice(splitIndex);

  // Compute dataset statistics
  const totalTokensEstimated = formattedSamples.reduce((acc, sample) => {
    const str = JSON.stringify(sample);
    return acc + Math.ceil(str.length / 4);
  }, 0);

  return {
    totalSamples: formattedSamples.length,
    trainCount: trainSet.length,
    valCount: valSet.length,
    estimatedTokens: totalTokensEstimated,
    avgTokensPerSample: Math.round(totalTokensEstimated / formattedSamples.length),
    format,
    trainSet,
    valSet
  };
}

/**
 * Saves train and val datasets as JSONL files in the target job directory.
 */
export function exportTrainingFiles(jobDir, formattedData) {
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }

  const trainPath = path.join(jobDir, "train.jsonl");
  const valPath = path.join(jobDir, "val.jsonl");

  const trainLines = formattedData.trainSet.map(item => JSON.stringify(item)).join("\n");
  const valLines = formattedData.valSet.map(item => JSON.stringify(item)).join("\n");

  fs.writeFileSync(trainPath, trainLines, "utf8");
  fs.writeFileSync(valPath, valLines, "utf8");

  return {
    trainPath,
    valPath,
    trainCount: formattedData.trainCount,
    valCount: formattedData.valCount
  };
}
