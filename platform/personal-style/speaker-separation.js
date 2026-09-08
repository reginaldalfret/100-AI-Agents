/**
 * 301 SUPER AI — Personal Style Data Pipeline: Speaker Separation
 * Separates dialogue into user context and target assistant turns.
 * Strictly guarantees that interlocutor (Reginald) is mapped to 'user',
 * target speaker (Kaviya) is mapped to 'assistant', and ZERO interlocutor
 * outputs are ever assigned to the target assistant role.
 */

import { normalizeSender } from "./chat-parser.js";

/**
 * Maps a sender name to a dialogue role ("user" | "assistant" | null).
 */
export function mapSpeakerToRole(sender, options = {}) {
  const {
    userSpeaker = "Reginald",
    assistantSpeaker = "Kaviya"
  } = options;

  const normalized = normalizeSender(sender);

  if (typeof userSpeaker === "function") {
    if (userSpeaker(sender, normalized)) return "user";
  } else if (normalized.toLowerCase() === userSpeaker.toLowerCase()) {
    return "user";
  }

  if (typeof assistantSpeaker === "function") {
    if (assistantSpeaker(sender, normalized)) return "assistant";
  } else if (normalized.toLowerCase() === assistantSpeaker.toLowerCase()) {
    return "assistant";
  }

  return null;
}

/**
 * Aggregates consecutive messages from the same speaker into single turns.
 * 
 * @param {Array<Object>} messages - Parsed chat messages
 * @param {Object} options - Speaker separation configuration
 * @returns {Array<Object>} Aggregated turns with roles
 */
export function aggregateConsecutiveMessages(messages, options = {}) {
  const turns = [];
  let currentTurn = null;

  for (const msg of messages) {
    if (msg.isSystem || msg.isDeleted) continue;

    const role = mapSpeakerToRole(msg.sender, options);
    if (!role) continue;

    if (currentTurn && currentTurn.role === role) {
      currentTurn.content += "\n" + msg.text.trim();
      currentTurn.rawMessages.push(msg);
    } else {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      currentTurn = {
        role,
        sender: msg.sender,
        normalizedSender: normalizeSender(msg.sender),
        content: msg.text.trim(),
        rawMessages: [msg]
      };
    }
  }

  if (currentTurn) {
    turns.push(currentTurn);
  }

  return turns;
}

/**
 * Extracts paired (user -> assistant) conversational turns from raw messages.
 * 
 * @param {Array<Object>} messages - Parsed chat messages
 * @param {Object} options - Separation options
 * @returns {Array<Object>} Array of `{ messages: [{ role: "user", content }, { role: "assistant", content }] }`
 */
export function extractConversationalPairs(messages, options = {}) {
  const aggregated = aggregateConsecutiveMessages(messages, options);
  const pairs = [];

  for (let i = 0; i < aggregated.length - 1; i++) {
    const current = aggregated[i];
    const next = aggregated[i + 1];

    if (current.role === "user" && next.role === "assistant") {
      pairs.push({
        messages: [
          { role: "user", content: current.content },
          { role: "assistant", content: next.content }
        ],
        metadata: {
          userSender: current.normalizedSender,
          assistantSender: next.normalizedSender,
          rawUserCount: current.rawMessages.length,
          rawAssistantCount: next.rawMessages.length
        }
      });
    }
  }

  return pairs;
}

/**
 * Validates that speaker separation guarantees are strictly fulfilled:
 * 1. Reginald is exclusively the context user
 * 2. Kaviya is exclusively the target assistant
 * 3. Exactly 0 Reginald target outputs (zero assistant contamination)
 * 
 * @param {Array<Object>} dataset - List of `{ messages: [...] }` records
 * @param {Object} options - Expected speaker mapping
 * @returns {Object} Validation summary
 */
export function validateSpeakerSeparation(dataset, options = {}) {
  const {
    userSpeaker = "Reginald",
    assistantSpeaker = "Kaviya"
  } = options;

  let totalTurns = 0;
  let validPairs = 0;
  let reginaldAsTargetErrors = 0;
  let kaviyaAsUserErrors = 0;
  let emptyContentErrors = 0;

  for (const item of dataset) {
    totalTurns++;
    const msgs = item.messages || [];

    if (msgs.length !== 2) {
      continue;
    }

    const [userMsg, assistantMsg] = msgs;

    if (!userMsg.content || !assistantMsg.content) {
      emptyContentErrors++;
    }

    if (userMsg.role !== "user" || assistantMsg.role !== "assistant") {
      continue;
    }

    validPairs++;

    // Check metadata if present
    if (item.metadata) {
      if (item.metadata.assistantSender && item.metadata.assistantSender.toLowerCase() !== assistantSpeaker.toLowerCase()) {
        reginaldAsTargetErrors++;
      }
      if (item.metadata.userSender && item.metadata.userSender.toLowerCase() !== userSpeaker.toLowerCase()) {
        kaviyaAsUserErrors++;
      }
    }
  }

  return {
    valid: reginaldAsTargetErrors === 0 && emptyContentErrors === 0,
    totalTurns,
    validPairs,
    reginaldAsTargetErrors,
    kaviyaAsUserErrors,
    emptyContentErrors,
    zeroReginaldTargetOutputs: reginaldAsTargetErrors === 0
  };
}
