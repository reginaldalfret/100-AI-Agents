/**
 * SA-S03 Platform — Multi-Agent DAG Coordinator
 * Orchestrates multi-agent execution graphs, detects data conflicts, and aggregates structured evidence.
 */

import { callToolStructured } from "./tool-caller.js";
import { buildEvidenceLedger } from "./reasoner.js";

export function detectEvidenceConflicts(evidenceList = []) {
  const conflicts = [];
  const incomeRecords = [];
  const gpaRecords = [];

  for (const item of evidenceList) {
    const data = item.data || {};
    if (data.annualIncome !== undefined || data.income !== undefined) {
      incomeRecords.push({ source: item.source, value: Number(data.annualIncome ?? data.income) });
    }
    if (data.gpa !== undefined || data.cgpa !== undefined) {
      gpaRecords.push({ source: item.source, value: Number(data.gpa ?? data.cgpa) });
    }
  }

  // Check income conflict
  if (incomeRecords.length >= 2) {
    const first = incomeRecords[0].value;
    for (let i = 1; i < incomeRecords.length; i++) {
      if (incomeRecords[i].value !== first) {
        conflicts.push({
          type: "INCOME_DISCREPANCY",
          message: `Discrepancy detected: ${incomeRecords[0].source} reports ₹${first}, but ${incomeRecords[i].source} reports ₹${incomeRecords[i].value}.`,
          sources: incomeRecords
        });
      }
    }
  }

  // Check GPA conflict
  if (gpaRecords.length >= 2) {
    const first = gpaRecords[0].value;
    for (let i = 1; i < gpaRecords.length; i++) {
      if (Math.abs(gpaRecords[i].value - first) > 0.01) {
        conflicts.push({
          type: "GPA_DISCREPANCY",
          message: `Discrepancy detected in academic record: ${gpaRecords[0].source} reports GPA ${first}, but ${gpaRecords[i].source} reports GPA ${gpaRecords[i].value}.`,
          sources: gpaRecords
        });
      }
    }
  }

  return conflicts;
}

export async function executeDAGPlan(plan, context = {}) {
  const started = Date.now();
  const stepResults = {};
  const executionLedger = [];

  for (const step of plan.steps || []) {
    // Check dependencies
    const deps = step.dependencies || [];
    const depsSatisfied = deps.every(depId => stepResults[depId] && stepResults[depId].success);

    if (!depsSatisfied) {
      stepResults[step.step_id] = {
        success: false,
        error: `Dependencies not satisfied: ${deps.join(", ")}`
      };
      continue;
    }

    // Execute tools for this step
    const toolResults = [];
    for (const toolName of step.tools || []) {
      const res = await callToolStructured({
        agent_id: step.agent_id,
        tool_name: toolName,
        arguments: context.entities || {},
        context
      });
      toolResults.push(res);
      if (res.evidence) executionLedger.push(res.evidence);
    }

    stepResults[step.step_id] = {
      success: toolResults.every(r => r.success),
      agent_id: step.agent_id,
      task: step.task,
      toolResults
    };
  }

  // Detect any conflicts across collected evidence
  const conflicts = detectEvidenceConflicts(executionLedger);
  const requiresHITL = conflicts.length > 0;

  return {
    success: Object.values(stepResults).every(s => s.success),
    stepResults,
    evidenceLedger: executionLedger,
    conflicts,
    requires_hitl: requiresHITL,
    duration_ms: Date.now() - started
  };
}
