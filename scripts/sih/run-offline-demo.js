/**
 * Sovereign AI Workbench — Deterministic Offline Demo Runner
 * Executes the complete flagship industrial scenario offline and verifies zero external egress.
 */

import { WorkflowEngine } from "../../platform/workflow-engine/engine.js";
import { egressMonitor } from "../../platform/security/egress-monitor.js";
import { routeTaskToLocalModel } from "../../platform/models/model-router.js";
import { queryLocalKnowledgeBase } from "../../platform/knowledge/rag-engine.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");

export async function executeOfflineDemoRehearsal(rehearsalId = 1) {
  const startTime = Date.now();
  console.log(`\n============================================================`);
  console.log(`STARTING OFFLINE DEMO REHEARSAL #${rehearsalId}`);
  console.log(`Scenario: Static Equipment Inspection (HX-204) -> Approval Package`);
  console.log(`============================================================\n`);

  egressMonitor.reset();

  // 1. Task Classification & Local Model Routing
  const routing = await routeTaskToLocalModel({
    prompt: "Analyze scanned ultrasonic thickness report for Heat Exchanger HX-204 and check API-653 retirement limits",
    attachments: [{ name: "HX-204_UT_Report.pdf" }]
  });

  console.log(`  [STEP 1] Model Auto-Router: ${routing.model_name} (${routing.selected_model})`);
  console.log(`           Modality: ${routing.pipeline.join(" -> ")} | External Calls: ${routing.external_calls}`);

  // 2. Launch Autonomous Industrial Workflow
  const instance = await WorkflowEngine.startWorkflow("inspection-report-analysis", {
    equipment_id: "HX-204",
    filePath: "HX-204_UT_Report.pdf"
  });

  console.log(`  [STEP 2] Workflow Launched: ${instance.id} (Status: ${instance.status})`);
  console.log(`           Agents Executed: ${instance.stepHistory.map(s => s.agentId).join(", ")}`);
  console.log(`           Evidence Collected: ${instance.evidenceLedger.length} items`);

  // 3. Human Approval Simulation (Chief Inspection Engineer Sign-off)
  console.log(`  [STEP 3] Human-in-the-Loop Gate: Awaiting Chief Engineer authorization...`);
  const finalized = await WorkflowEngine.submitHumanDecision(instance.id, {
    decision: "approved",
    notes: "Authorized by Chief Inspection Engineer (V. N. Hegde). Emergency outage approved."
  });

  console.log(`           Decision: APPROVED | Final Workflow Status: ${finalized.status}`);

  // 4. Verify Deliverables Generated
  const deliverables = finalized.context.stepOutputs["deliverable-synthesis"]?.deliverables || [];
  console.log(`  [STEP 4] Deliverables Generated (${deliverables.length} files):`);
  deliverables.forEach(d => {
    console.log(`           - [${d.deliverable_type}] ${d.file_name} (${d.size_bytes} bytes)`);
  });

  // 5. Final Egress Sniffer Verification
  const metrics = egressMonitor.getMetrics();
  const durationMs = Date.now() - startTime;

  console.log(`\n  --- REHEARSAL METRICS & SOVEREIGNTY PROOF ---`);
  console.log(`  Duration: ${(durationMs / 1000).toFixed(2)}s`);
  console.log(`  External AI API Calls: ${metrics.external_ai_calls}`);
  console.log(`  Cloud API Calls: ${metrics.cloud_api_calls}`);
  console.log(`  External Data Transfers: ${metrics.external_data_transfers_bytes} bytes`);
  console.log(`  Zero Data Exfiltration: ${metrics.zero_data_exfiltration_verified ? "VERIFIED (PASS)" : "FAILED"}`);
  console.log(`============================================================\n`);

  if (metrics.external_ai_calls !== 0 || !metrics.zero_data_exfiltration_verified) {
    throw new Error(`Rehearsal #${rehearsalId} failed zero egress verification.`);
  }

  return {
    rehearsal_id: rehearsalId,
    status: "PASS",
    duration_ms: durationMs,
    workflow_id: instance.id,
    deliverables_count: deliverables.length,
    external_calls: metrics.external_ai_calls
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await executeOfflineDemoRehearsal(1);
}
