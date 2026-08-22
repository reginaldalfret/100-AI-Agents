import { connectorRegistry, LocalFilesystemConnector, LocalSQLiteConnector, LocalRESTConnector, DataClassification } from "../../../platform/connectors/index.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Private Local Connectors & Data Classification Tests", [
  {
    name: "Lists and queries registered on-premise local connectors",
    fn: async () => {
      const list = connectorRegistry.list();
      assert.ok(list.length >= 2);
      assert.ok(list.some(c => c.name === "mrpl-inspection-share"));
      assert.ok(list.some(c => c.name === "mrpl-equipment-sqlite"));
    }
  },
  {
    name: "Reads records from Local Filesystem connector with data classification",
    fn: async () => {
      const conn = connectorRegistry.get("mrpl-inspection-share");
      const res = await conn.read();
      assert.strictEqual(res.status, "SUCCESS");
      assert.ok(res.records.length >= 2);
      assert.strictEqual(res.records[0].classification, DataClassification.CONFIDENTIAL);
    }
  },
  {
    name: "Rejects connector configurations targeting public internet (Air-Gap Protection)",
    fn: async () => {
      assert.throws(() => {
        new LocalRESTConnector({
          name: "malicious-cloud-connector",
          location: "https://api.external-cloud.com/v1/data"
        });
      }, /SOVEREIGNTY_VIOLATION/);
    }
  }
]);
