import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  mapSpeakerToRole,
  aggregateConsecutiveMessages,
  extractConversationalPairs,
  validateSpeakerSeparation
} from "../../platform/personal-style/speaker-separation.js";
import { loadJsonl } from "../../platform/personal-style/train-test-separation.js";

const DATASET_DIR = path.resolve("data/fine-tuning/personal-style/kaviya-style-v1");

describe("Speaker Separation Suite", () => {
  it("should map Reginald to 'user' context role and Kaviya to 'assistant' target role", () => {
    assert.equal(mapSpeakerToRole("✨ ℝ𝕖𝕘𝕚𝕟𝕒𝕝𝕕 ✨"), "user");
    assert.equal(mapSpeakerToRole("Reginald"), "user");
    assert.equal(mapSpeakerToRole("reginald"), "user");

    assert.equal(mapSpeakerToRole("Kaviya"), "assistant");
    assert.equal(mapSpeakerToRole("kaviya"), "assistant");

    // Unknown third party should return null
    assert.equal(mapSpeakerToRole("Random Interlocutor"), null);
  });

  it("should aggregate consecutive single-speaker bursts into unified turns", () => {
    const rawMessages = [
      { sender: "Reginald", text: "Hey", isSystem: false, isDeleted: false },
      { sender: "Reginald", text: "Are you free today?", isSystem: false, isDeleted: false },
      { sender: "Kaviya", text: "Hi anna", isSystem: false, isDeleted: false },
      { sender: "Kaviya", text: "I have school today", isSystem: false, isDeleted: false },
      { sender: "Kaviya", text: "Will text u later", isSystem: false, isDeleted: false }
    ];

    const aggregated = aggregateConsecutiveMessages(rawMessages);
    assert.equal(aggregated.length, 2, "Should aggregate into exactly 2 turns");

    assert.equal(aggregated[0].role, "user");
    assert.equal(aggregated[0].content, "Hey\nAre you free today?");

    assert.equal(aggregated[1].role, "assistant");
    assert.equal(aggregated[1].content, "Hi anna\nI have school today\nWill text u later");
  });

  it("should extract paired user->assistant dyads with 0 Reginald target outputs", () => {
    const parsedMessages = [
      { sender: "Reginald", text: "Where are you going?", isSystem: false, isDeleted: false },
      { sender: "Kaviya", text: "To class anna", isSystem: false, isDeleted: false },
      { sender: "Kaviya", text: "Catch up evening", isSystem: false, isDeleted: false },
      { sender: "Reginald", text: "Sure", isSystem: false, isDeleted: false },
      { sender: "Kaviya", text: "okkk", isSystem: false, isDeleted: false }
    ];

    const pairs = extractConversationalPairs(parsedMessages);
    assert.equal(pairs.length, 2);

    for (const pair of pairs) {
      assert.equal(pair.messages.length, 2);
      assert.equal(pair.messages[0].role, "user", "Prompt role must strictly be 'user'");
      assert.equal(pair.messages[1].role, "assistant", "Target role must strictly be 'assistant'");

      // Verify metadata attribution
      assert.equal(pair.metadata.userSender, "Reginald");
      assert.equal(pair.metadata.assistantSender, "Kaviya");
    }

    const validation = validateSpeakerSeparation(pairs);
    assert.equal(validation.valid, true);
    assert.equal(validation.zeroReginaldTargetOutputs, true);
    assert.equal(validation.reginaldAsTargetErrors, 0);
  });

  it("should detect and flag any corrupt pair where Reginald is assigned to target output", () => {
    const corruptDataset = [
      {
        messages: [
          { role: "user", content: "Valid prompt" },
          { role: "assistant", content: "Valid reply" }
        ],
        metadata: {
          userSender: "Reginald",
          assistantSender: "Kaviya"
        }
      },
      {
        // Contaminated turn: Reginald is wrongly in assistant role
        messages: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "I am Reginald" }
        ],
        metadata: {
          userSender: "Kaviya",
          assistantSender: "Reginald"
        }
      }
    ];

    const result = validateSpeakerSeparation(corruptDataset);
    assert.equal(result.valid, false);
    assert.equal(result.zeroReginaldTargetOutputs, false);
    assert.equal(result.reginaldAsTargetErrors, 1);
  });

  it("should verify 0 Reginald target outputs across all production fine-tuning splits", () => {
    const splits = ["personal_style_train.jsonl", "personal_style_val.jsonl", "personal_style_test.jsonl"];

    for (const splitFile of splits) {
      const fullPath = path.join(DATASET_DIR, splitFile);
      assert.ok(fs.existsSync(fullPath), `Dataset split ${splitFile} must exist`);

      const dataset = loadJsonl(fullPath);
      assert.ok(dataset.length > 0, `${splitFile} must contain dialogue turns`);

      for (let i = 0; i < dataset.length; i++) {
        const item = dataset[i];
        assert.equal(item.messages.length, 2, `${splitFile} line ${i + 1} must have 2 messages`);

        const [userMsg, assistantMsg] = item.messages;
        assert.equal(userMsg.role, "user", `Turn ${i} prompt must have role 'user'`);
        assert.equal(assistantMsg.role, "assistant", `Turn ${i} target must have role 'assistant'`);

        // Style signature check: assistant output uses Kaviya's typical discourse tokens (e.g. "anna", "nandri")
        // but must NEVER be Reginald identifying himself as the assistant
        const lowerAssistant = assistantMsg.content.toLowerCase();
        assert.ok(
          !lowerAssistant.includes("i am reginald") && !lowerAssistant.includes("iam reginald"),
          `Turn ${i} assistant must never identify as Reginald`
        );
      }
    }
  });
});
