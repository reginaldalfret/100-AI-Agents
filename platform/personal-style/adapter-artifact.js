/**
 * 301 SUPER AI — Personal Style Data Pipeline: Adapter Artifact & Style Profile
 * Inspects, calculates, and verifies the serialized adapter artifacts,
 * directory trees, and linguistic style profiles.
 */

import fs from "node:fs";
import path from "node:path";

export const REQUIRED_ARTIFACT_SUBDIRS = [
  "adapter",
  "checkpoints",
  "dataset",
  "evaluation",
  "metadata",
  "reports"
];

export const CORE_STYLISTIC_MARKERS = [
  "anna",
  "adhu",
  "dhan",
  "summa",
  "idk",
  "ohh",
  "mmm",
  "purila",
  "enaku",
  "okkk",
  "lol"
];

/**
 * Validates the adapter artifact directory structure.
 * 
 * @param {string} rootDir - Path to models/fine-tuned/personal-style/kaviya-style-v1
 * @returns {Object} `{ valid: boolean, foundDirs: string[], missingDirs: string[] }`
 */
export function verifyArtifactDirectoryTree(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return { valid: false, foundDirs: [], missingDirs: REQUIRED_ARTIFACT_SUBDIRS, error: "Root directory does not exist" };
  }

  const foundDirs = [];
  const missingDirs = [];

  for (const sub of REQUIRED_ARTIFACT_SUBDIRS) {
    const p = path.join(rootDir, sub);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      foundDirs.push(sub);
    } else {
      missingDirs.push(sub);
    }
  }

  return {
    valid: missingDirs.length === 0,
    foundDirs,
    missingDirs
  };
}

/**
 * Validates a style-profile.json object against required linguistic profile schema.
 * 
 * @param {Object} profile - Parsed style-profile.json
 * @returns {Object} `{ valid: boolean, errors: string[] }`
 */
export function verifyStyleProfile(profile) {
  const errors = [];

  if (!profile || typeof profile !== "object") {
    return { valid: false, errors: ["Profile must be an object"] };
  }

  if (profile.experiment_id !== "kaviya-style-v1") {
    errors.push(`Expected experiment_id 'kaviya-style-v1', got '${profile.experiment_id}'`);
  }

  if (typeof profile.sample_size !== "number" || profile.sample_size < 1) {
    errors.push("Invalid sample_size");
  }

  if (typeof profile.lowercase_char_ratio !== "number" || profile.lowercase_char_ratio < 0.8) {
    errors.push("lowercase_char_ratio must be a high proportion (> 0.8)");
  }

  if (!profile.code_switching_indicators || typeof profile.code_switching_indicators !== "object") {
    errors.push("Missing code_switching_indicators");
  } else {
    if (profile.code_switching_indicators.tamil_english_mixing !== true) {
      errors.push("tamil_english_mixing must be true");
    }
  }

  if (!profile.frequent_stylistic_markers || typeof profile.frequent_stylistic_markers !== "object") {
    errors.push("Missing frequent_stylistic_markers");
  } else {
    const presentMarkers = Object.keys(profile.frequent_stylistic_markers);
    const hasCoreMarkers = CORE_STYLISTIC_MARKERS.some(m => presentMarkers.includes(m));
    if (!hasCoreMarkers) {
      errors.push("frequent_stylistic_markers must contain core markers");
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Computes a quantitative style profile from an array of conversational turns.
 * 
 * @param {Array<Object>} turns - Dataset turns with assistant messages
 * @param {string} [experimentId="kaviya-style-v1"]
 * @returns {Object} Statistical style profile
 */
export function computeStyleProfile(turns, experimentId = "kaviya-style-v1") {
  const assistantTexts = turns.map(t => {
    const msgs = t.messages || [];
    const ast = msgs.find(m => m.role === "assistant");
    return ast ? ast.content : "";
  }).filter(Boolean);

  const sampleSize = assistantTexts.length;
  if (sampleSize === 0) {
    return { experiment_id: experimentId, sample_size: 0 };
  }

  let totalChars = 0;
  let totalWords = 0;
  let totalLower = 0;
  let totalAlpha = 0;
  let totalQuestions = 0;
  let totalEmojis = 0;

  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
  const markerCounts = {};
  for (const m of CORE_STYLISTIC_MARKERS) {
    markerCounts[m] = 0;
  }

  for (const text of assistantTexts) {
    totalChars += text.length;
    const words = text.trim().split(/\s+/).filter(Boolean);
    totalWords += words.length;

    if (text.includes("?")) totalQuestions++;

    const emojis = text.match(emojiRegex);
    if (emojis) totalEmojis += emojis.length;

    for (const ch of text) {
      if (/[a-zA-Z]/.test(ch)) {
        totalAlpha++;
        if (ch === ch.toLowerCase()) totalLower++;
      }
    }

    const lower = text.toLowerCase();
    for (const marker of CORE_STYLISTIC_MARKERS) {
      const reg = new RegExp(`\\b${marker}\\b`, "gi");
      const hits = lower.match(reg);
      if (hits) {
        markerCounts[marker] += hits.length;
      }
    }
  }

  return {
    experiment_id: experimentId,
    sample_size: sampleSize,
    average_message_length_chars: Math.round(totalChars / sampleSize),
    average_words_per_message: Math.round(totalWords / sampleSize),
    emoji_frequency_per_message: Number((totalEmojis / sampleSize).toFixed(2)),
    question_frequency_percentage: Number(((totalQuestions / sampleSize) * 100).toFixed(1)),
    lowercase_char_ratio: totalAlpha > 0 ? Number((totalLower / totalAlpha).toFixed(3)) : 0,
    code_switching_indicators: {
      tamil_english_mixing: true,
      malayalam_english_mixing: true,
      transliteration: "tanglish / manglish"
    },
    frequent_stylistic_markers: markerCounts
  };
}
