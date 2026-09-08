import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  parseWhatsAppChat,
  isDeletedMessage,
  isSystemMessage,
  normalizeSender,
  WHATSAPP_LINE_REGEX
} from "../../platform/personal-style/chat-parser.js";

const RAW_CHAT_PATH = path.resolve("data/raw/chat/WhatsApp Chat with Kaviya.txt");

describe("WhatsApp Chat Parser Suite", () => {
  it("should match standard WhatsApp date-time timestamps with am/pm", () => {
    const line1 = "31/03/2026, 7:10 pm - Kaviya: Hello there";
    const line2 = "11/05/2026, 4:56 am - ✨ ℝ𝕖𝕘𝕚𝕟𝕒𝕝𝕕 ✨: Okayyy";
    const line3 = "18/05/2026, 12:45 pm - Kaviya: Good afternoon";

    assert.ok(WHATSAPP_LINE_REGEX.test(line1), "Line 1 must match timestamp pattern");
    assert.ok(WHATSAPP_LINE_REGEX.test(line2), "Line 2 must match timestamp pattern");
    assert.ok(WHATSAPP_LINE_REGEX.test(line3), "Line 3 must match timestamp pattern");

    const match1 = line1.match(WHATSAPP_LINE_REGEX);
    assert.equal(match1[1], "31/03/2026");
    assert.equal(match1[2], "7:10 pm");
  });

  it("should handle WhatsApp unicode narrow no-break space before am/pm", () => {
    // Unicode \u202F is often present in exported WhatsApp chats
    const lineWithNarrowSpace = "31/03/2026, 7:10\u202Fpm - Kaviya: Test message";
    assert.ok(WHATSAPP_LINE_REGEX.test(lineWithNarrowSpace));

    const parsed = parseWhatsAppChat(lineWithNarrowSpace);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].sender, "Kaviya");
    assert.equal(parsed[0].text, "Test message");
    assert.equal(parsed[0].time, "7:10 pm");
  });

  it("should correctly handle multiline messages across line breaks", () => {
    const rawMulti = [
      "10/05/2026, 9:50 pm - Kaviya: vanakkam makkaleh!",
      "I'm Kaviya from Grade 12, conducting a survey.",
      "Your responses will be very valuable 😊",
      "https://forms.gle/41jTEwnSMNTHDNGC7",
      "10/05/2026, 9:52 pm - ✨ ℝ𝕖𝕘𝕚𝕟𝕒𝕝𝕕 ✨: Received."
    ].join("\n");

    const parsed = parseWhatsAppChat(rawMulti);
    assert.equal(parsed.length, 2, "Should parse exactly two messages");

    const first = parsed[0];
    assert.equal(first.sender, "Kaviya");
    assert.ok(first.text.includes("vanakkam makkaleh!"));
    assert.ok(first.text.includes("I'm Kaviya from Grade 12"));
    assert.ok(first.text.includes("https://forms.gle/41jTEwnSMNTHDNGC7"));

    const second = parsed[1];
    assert.equal(second.sender, "✨ ℝ𝕖𝕘𝕚𝕟𝕒𝕝𝕕 ✨");
    assert.equal(second.text, "Received.");
  });

  it("should identify and flag deleted messages", () => {
    assert.ok(isDeletedMessage("This message was deleted"));
    assert.ok(isDeletedMessage("You deleted this message"));
    assert.ok(!isDeletedMessage("Hello how are you"));

    const rawWithDeleted = [
      "18/05/2026, 8:45 am - Kaviya: First message",
      "18/05/2026, 8:46 am - Kaviya: This message was deleted",
      "18/05/2026, 8:47 am - Kaviya: You deleted this message",
      "18/05/2026, 8:48 am - Kaviya: Final message"
    ].join("\n");

    // Including deleted messages flags them
    const all = parseWhatsAppChat(rawWithDeleted, { excludeDeleted: false });
    assert.equal(all.length, 4);
    assert.equal(all[1].isDeleted, true);
    assert.equal(all[2].isDeleted, true);
    assert.equal(all[0].isDeleted, false);

    // Excluding deleted messages filters them out
    const filtered = parseWhatsAppChat(rawWithDeleted, { excludeDeleted: true });
    assert.equal(filtered.length, 2);
    assert.equal(filtered[0].text, "First message");
    assert.equal(filtered[1].text, "Final message");
  });

  it("should identify and handle WhatsApp system notices", () => {
    const rawWithSystem = [
      "31/03/2026, 7:10 pm - Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. *Learn more*",
      "31/03/2026, 7:12 pm - Kaviya: Hey"
    ].join("\n");

    const parsed = parseWhatsAppChat(rawWithSystem, { excludeSystem: false });
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].isSystem, true);
    assert.equal(parsed[0].sender, "System");

    const withoutSystem = parseWhatsAppChat(rawWithSystem, { excludeSystem: true });
    assert.equal(withoutSystem.length, 1);
    assert.equal(withoutSystem[0].sender, "Kaviya");
  });

  it("should normalize sender aliases including mathematical alphanumeric symbols", () => {
    assert.equal(normalizeSender("✨ ℝ𝕖𝕘𝕚𝕟𝕒𝕝𝕕 ✨"), "Reginald");
    assert.equal(normalizeSender("Kaviya"), "Kaviya");
    assert.equal(normalizeSender("kaviya"), "Kaviya");
  });

  it("should successfully parse the actual WhatsApp Chat with Kaviya archive", () => {
    assert.ok(fs.existsSync(RAW_CHAT_PATH), "Raw chat file must exist in data/raw/chat/");

    const raw = fs.readFileSync(RAW_CHAT_PATH, "utf-8");
    const parsed = parseWhatsAppChat(raw, { excludeDeleted: false, excludeSystem: false });

    // The raw archive contains > 2000 total messages
    assert.ok(parsed.length > 2000, `Expected > 2000 parsed messages, got ${parsed.length}`);

    // Verify both key interlocutors are present
    const senders = new Set(parsed.map(m => normalizeSender(m.sender)));
    assert.ok(senders.has("Kaviya"), "Corpus must contain Kaviya messages");
    assert.ok(senders.has("Reginald"), "Corpus must contain Reginald messages");

    // Verify deleted messages exist in raw export and can be excluded
    const deletedCount = parsed.filter(m => m.isDeleted).length;
    assert.ok(deletedCount > 0, "Corpus should contain deleted messages");

    const clean = parseWhatsAppChat(raw, { excludeDeleted: true, excludeSystem: true });
    assert.equal(clean.filter(m => m.isDeleted).length, 0, "Clean parsed set must have 0 deleted messages");
    assert.equal(clean.filter(m => m.isSystem).length, 0, "Clean parsed set must have 0 system messages");
  });
});
