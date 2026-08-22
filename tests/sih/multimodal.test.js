import { processScannedDocumentOCR, analyzeEngineeringDrawing, analyzeSitePhotograph, executeMultimodalPipeline } from "../../platform/multimodal/index.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";

await runTestSuite("Multimodal Pipeline (OCR, Drawings, Site Photos) Tests", [
  {
    name: "Extracts NDT thickness tables from scanned PDF",
    fn: async () => {
      const ocr = await processScannedDocumentOCR("TK-101_UT_Report.pdf");
      assert.strictEqual(ocr.metadata.equipment_id, "TK-101");
      assert.strictEqual(ocr.extracted_tables.length, 1);
      const shell3 = ocr.extracted_tables[0].rows.find(r => r.Location === "Shell Course 3");
      assert.strictEqual(shell3.Measured_Min_mm, 5.90);
      assert.strictEqual(shell3.Status, "CRITICAL_DEFECT");
    }
  },
  {
    name: "Extracts equipment tags and valves from P&ID schematic",
    fn: async () => {
      const drawing = await analyzeEngineeringDrawing("DWG-CDU-201.png");
      assert.ok(drawing.extracted_entities.tanks.length >= 2);
      assert.ok(drawing.extracted_entities.valves.some(v => v.includes("PSV-101A")));
    }
  },
  {
    name: "Detects CUI and flange defect from site photo",
    fn: async () => {
      const photo = await analyzeSitePhotograph("flange_corrosion.jpg");
      assert.ok(photo.findings.length >= 2);
      assert.strictEqual(photo.findings[0].defect_type, "CORROSION_UNDER_INSULATION");
    }
  },
  {
    name: "Unified Multimodal Pipeline executes with zero external calls",
    fn: async () => {
      const res = await executeMultimodalPipeline("TK-101_UT_Report.pdf");
      assert.strictEqual(res.external_calls, 0);
      assert.strictEqual(res.structured_findings.equipment_id, "TK-101");
      assert.strictEqual(res.structured_findings.compliance_status, "NON_COMPLIANT_API_653");
    }
  }
]);
