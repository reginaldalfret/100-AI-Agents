import { generateApprovalNoteDOCX, generateInspectionWorkbookXLSX, generateManagementBriefingPPTX, generateFullDeliverablePackage } from "../../platform/deliverables/index.js";
import { runTestSuite } from "./harness.js";
import assert from "node:assert";
import fs from "node:fs";

await runTestSuite("Deliverables Engine (DOCX, XLSX, PPTX) Tests", [
  {
    name: "Generates official Approval Note (.docx)",
    fn: async () => {
      const doc = generateApprovalNoteDOCX({ equipment_id: "TK-101", risk_level: "CRITICAL" });
      assert.strictEqual(doc.deliverable_type, "DOCX");
      assert.ok(fs.existsSync(doc.file_path));
      const content = fs.readFileSync(doc.file_path, "utf8");
      assert.ok(content.includes("MANGALORE REFINERY AND PETROCHEMICALS LIMITED"));
      assert.ok(content.includes("TK-101"));
    }
  },
  {
    name: "Generates structured inspection workbook (.xlsx)",
    fn: async () => {
      const sheet = generateInspectionWorkbookXLSX({ equipment_id: "TK-101" });
      assert.strictEqual(sheet.deliverable_type, "XLSX");
      assert.ok(fs.existsSync(sheet.file_path));
      const content = fs.readFileSync(sheet.file_path, "utf8");
      assert.ok(content.includes("Shell Course 3"));
      assert.ok(content.includes("CRITICAL_DEFECT"));
    }
  },
  {
    name: "Generates PowerPoint executive slide deck (.pptx)",
    fn: async () => {
      const deck = generateManagementBriefingPPTX({ equipment_id: "TK-101" });
      assert.strictEqual(deck.deliverable_type, "PPTX");
      assert.ok(fs.existsSync(deck.file_path));
      assert.strictEqual(deck.slides_count, 4);
    }
  },
  {
    name: "Generates Full Multi-Format Deliverables Package",
    fn: async () => {
      const pkg = generateFullDeliverablePackage({ equipment_id: "TK-101" });
      assert.strictEqual(pkg.total_files, 3);
      assert.strictEqual(pkg.external_calls, 0);
    }
  }
]);
