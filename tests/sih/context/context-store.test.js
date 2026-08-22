import { contextStore, entityMemory } from "../../../platform/context/index.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Persistent Context & Entity Memory Tests", [
  {
    name: "Creates and retrieves persistent session context with retention",
    fn: async () => {
      const session = contextStore.createSession({ role: "Engineer" });
      assert.ok(session.conversation_id.startsWith("CONV-"));
      assert.strictEqual(session.role, "Engineer");

      const loaded = contextStore.getSession(session.conversation_id);
      assert.strictEqual(loaded.conversation_id, session.conversation_id);
    }
  },
  {
    name: "Maintains multi-turn context and tracks entity mentions (HX-204)",
    fn: async () => {
      const session = contextStore.createSession();
      contextStore.appendMessage(session.conversation_id, {
        role: "user",
        content: "Please analyze the ultrasonic thickness report for Heat Exchanger HX-204."
      });

      const updatedSession = contextStore.getSession(session.conversation_id);
      assert.strictEqual(updatedSession.active_entity_id, "HX-204");
      assert.strictEqual(updatedSession.messages.length, 1);

      const entity = entityMemory.getEntity("HX-204");
      assert.ok(entity);
      assert.strictEqual(entity.id, "HX-204");
    }
  },
  {
    name: "Isolates context between separate conversations and allows clean reset",
    fn: async () => {
      const sessA = contextStore.createSession({ conversation_id: "CONV-A" });
      contextStore.appendMessage("CONV-A", { role: "user", content: "Check HX-204" });

      const sessB = contextStore.createSession({ conversation_id: "CONV-B" });
      contextStore.appendMessage("CONV-B", { role: "user", content: "Check Pump P-301" });

      assert.strictEqual(contextStore.getSession("CONV-A").active_entity_id, "HX-204");
      assert.strictEqual(contextStore.getSession("CONV-B").active_entity_id, "P-301");

      const resetRes = contextStore.clearSession("CONV-A");
      assert.strictEqual(resetRes.cleared, true);
    }
  }
]);
