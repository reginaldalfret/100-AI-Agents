import { evidenceGraph, EvidenceRelation, SourceAuthority } from "../../../platform/evidence/index.js";
import { runTestSuite } from "../harness.js";
import assert from "node:assert";

await runTestSuite("Evidence Graph & Provenance Tests", [
  {
    name: "Adds evidence nodes and relationships (SUPPORTS, CONTRADICTS)",
    fn: async () => {
      const nodeA = evidenceGraph.addEvidenceNode({
        id: "EV-HIST-2025",
        entity_id: "HX-204",
        title: "Historical Inspection 2025",
        numeric_value: 6.80,
        authority: SourceAuthority.HISTORICAL_LOG
      });

      const nodeB = evidenceGraph.addEvidenceNode({
        id: "EV-NDT-2026",
        entity_id: "HX-204",
        title: "Live Ultrasonic Scan 2026",
        numeric_value: 5.90,
        authority: SourceAuthority.NDT_INSPECTION_REPORT
      });

      const edge = evidenceGraph.addRelationship(nodeB.id, nodeA.id, EvidenceRelation.CONTRADICTS, {
        discrepancy: "0.90 mm reduction detected"
      });

      assert.strictEqual(edge.relation, EvidenceRelation.CONTRADICTS);
      const conflicts = evidenceGraph.findConflicts("HX-204");
      assert.strictEqual(conflicts.length, 1);
      assert.ok(conflicts[0].resolution_advice.includes("Authority level: 70"));
    }
  },
  {
    name: "Exports comprehensive evidence package with zero external dependencies",
    fn: async () => {
      const pkg = evidenceGraph.exportEvidencePackage("INV-TEST-01", "HX-204");
      assert.ok(pkg.package_id.startsWith("EV-PKG-"));
      assert.ok(pkg.nodes.length >= 2);
      assert.strictEqual(pkg.sovereign_guarantee.total_external_calls, 0);
      assert.strictEqual(pkg.sovereign_guarantee.is_air_gapped, true);
    }
  }
]);
