/**
 * 301 SUPER AI — Personal Style Data Pipeline: WhatsApp Chat Parser
 * Parses raw WhatsApp exports into structured, chronological messages.
 * Handles timestamps, AM/PM indicators (including unicode narrow spaces),
 * multiline messages, deleted messages, and system notices.
 */

// Matches: "DD/MM/YYYY, HH:MM [am/pm] - Sender: Message" or "DD/MM/YY..."
// Note: WhatsApp exports often use narrow no-break space (\u202F) or regular space (\s) before am/pm
export const WHATSAPP_LINE_REGEX = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202F]?[apAP][mM])?)\s+-\s+(.*)$/;

export const DELETED_PATTERNS = [
  /this message was deleted/i,
  /you deleted this message/i,
  /message deleted/i
];

export const SYSTEM_PATTERNS = [
  /messages and calls are end-to-end encrypted/i,
  /created group/i,
  /added you/i,
  /changed the subject/i,
  /security code changed/i,
  /left the group/i
];

/**
 * Check if a text represents a deleted message notice.
 */
export function isDeletedMessage(text) {
  if (!text || typeof text !== "string") return false;
  return DELETED_PATTERNS.some(p => p.test(text.trim()));
}

/**
 * Check if a text represents a system notification.
 */
export function isSystemMessage(text) {
  if (!text || typeof text !== "string") return false;
  return SYSTEM_PATTERNS.some(p => p.test(text.trim()));
}

/**
 * Normalizes sender name to clean ASCII or canonical name.
 */
export function normalizeSender(sender) {
  if (!sender) return "Unknown";
  const s = sender.trim();
  if (s.includes("Reginald") || s.includes("ℝ𝕖𝕘𝕚𝕟𝕒𝕝𝕕")) {
    return "Reginald";
  }
  if (s.toLowerCase().includes("kaviya")) {
    return "Kaviya";
  }
  return s;
}

/**
 * Parses raw WhatsApp chat export text into an array of structured message objects.
 * 
 * @param {string} rawText - Entire raw text file content
 * @param {Object} options
 * @param {boolean} [options.excludeDeleted=true] - Exclude deleted message notices
 * @param {boolean} [options.excludeSystem=true] - Exclude WhatsApp system notices
 * @param {boolean} [options.normalizeSenders=true] - Normalize sender names (e.g. fancy unicode)
 * @returns {Array<Object>} Parsed message objects
 */
export function parseWhatsAppChat(rawText, options = {}) {
  const {
    excludeDeleted = false,
    excludeSystem = false,
    normalizeSenders = false
  } = options;

  if (!rawText || typeof rawText !== "string") {
    return [];
  }

  const rawLines = rawText.split(/\r?\n/);
  const messages = [];
  let currentMsg = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const match = line.match(WHATSAPP_LINE_REGEX);

    if (match) {
      if (currentMsg) {
        messages.push(finalizeMessage(currentMsg));
      }

      const [, date, time, rest] = match;
      const colonIndex = rest.indexOf(":");

      let sender = null;
      let text = "";
      let isSystem = false;

      if (colonIndex !== -1) {
        sender = rest.slice(0, colonIndex).trim();
        text = rest.slice(colonIndex + 1).trim();
        if (normalizeSenders) {
          sender = normalizeSender(sender);
        }
      } else {
        // System message (e.g. Encryption disclaimer)
        sender = "System";
        text = rest.trim();
        isSystem = true;
      }

      const isDeleted = isDeletedMessage(text);
      if (!isSystem && isSystemMessage(text)) {
        isSystem = true;
      }

      currentMsg = {
        date,
        time: time.replace(/\u202F/g, " ").trim(),
        sender,
        rawSender: colonIndex !== -1 ? rest.slice(0, colonIndex).trim() : "System",
        text,
        isSystem,
        isDeleted,
        lineIndex: i + 1
      };
    } else {
      // Continuation of multiline message
      if (currentMsg) {
        currentMsg.text += "\n" + line;
      }
    }
  }

  if (currentMsg) {
    messages.push(finalizeMessage(currentMsg));
  }

  // Filter based on options
  return messages.filter(msg => {
    if (excludeDeleted && msg.isDeleted) return false;
    if (excludeSystem && msg.isSystem) return false;
    return true;
  });
}

function finalizeMessage(msg) {
  // Re-verify deletion status on accumulated text
  msg.isDeleted = isDeletedMessage(msg.text);
  return msg;
}
