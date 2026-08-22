import { queryLocalKnowledgeBase, listKnowledgeDocuments } from "../../platform/knowledge/index.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("Local Knowledge Base & Vector RAG Tests", [
  {
    name: "Loads refinery SOPs and technical standards",
    fn: async () => {
      const docs = listKnowledgeDocuments();
      assert.ok(docs.length >= 2);
      assert.ok(docs.some(d => d.standard_ref.includes("OISD-STD-129")));
    }
  },
  {
    name: "Searches retirement thickness standards with exact citations",
    fn: async () => {
      const res = queryLocalKnowledgeBase("Crude storage tank Shell Course 3 retirement limit API-653");
      assert.ok(res.citations.length > 0);
      assert.strictEqual(res.citations[0].doc_id, "SOP-MRPL-INSP-042");
      assert.strictEqual(res.citations[0].page, 14);
      assert.ok(res.citations[0].excerpt.includes("6.80 mm"));
    }
  },
  {
    name: "Confirms RAG execution uses zero external API calls",
    fn: async () => {
      const res = queryLocalKnowledgeBase("Permit to work hot work gas test");
      assert.strictEqual(res.external_calls, 0);
      assert.strictEqual(res.is_air_gapped, true);
    }
  }
]);
