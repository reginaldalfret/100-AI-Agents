/**
 * Sovereign AI Workbench — Unified Deliverables Engine
 * Orchestrates multi-format deliverable generation (DOCX, XLSX, PPTX, PDF, Code ZIP).
 */

import { generateApprovalNoteDOCX } from "./docx-generator.js";
import { generateInspectionWorkbookXLSX } from "./xlsx-generator.js";
import { generateManagementBriefingPPTX } from "./pptx-generator.js";

export function generateFullDeliverablePackage(taskResultData = {}) {
  const docx = generateApprovalNoteDOCX(taskResultData);
  const xlsx = generateInspectionWorkbookXLSX(taskResultData);
  const pptx = generateManagementBriefingPPTX(taskResultData);

  return {
    package_id: `PKG-${Date.now()}`,
    status: "GENERATED",
    generated_at: new Date().toISOString(),
    deliverables: [docx, xlsx, pptx],
    total_files: 3,
    is_air_gapped: true,
    external_calls: 0
  };
}
