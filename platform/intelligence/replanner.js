/**
 * Sovereign AI Workbench — Autonomous Replanner & Failure Recovery Engine
 * Detects missing data, evidence conflicts, and tool failures; generates bounded adaptive DAG replans.
 */

import { StepStatus, TaskStatus } from "./task-state.js";

export const ReplanTrigger = {
  MISSING_INFORMATION: "MISSING_INFORMATION",
  EVIDENCE_CONFLICT: "EVIDENCE_CONFLICT",
  TOOL_FAILURE: "TOOL_FAILURE",
  AGENT_UNAVAILABLE: "AGENT_UNAVAILABLE",
  OUTPUT_INVALID: "OUTPUT_INVALID",
  USER_AMENDMENT: "USER_AMENDMENT"
};

export function detectMissingInformation(taskState, currentData = {}) {
  const missing = [];
  const text = JSON.stringify(currentData).toLowerCase();

  // Check critical industrial parameters required for corrosion and remaining life
  if (!currentData.operating_temperature && !currentData.temperature && !text.includes("temp")) {
    if (taskState.goal.toLowerCase().includes("risk") || taskState.goal.toLowerCase().includes("assessment")) {
      missing.push({
        field: "operating_temperature",
        reason: "Required for high-temperature corrosion rate acceleration and API-653 stress factor calculation",
        sources_checked: ["inspection_report", "local_standards"],
        can_search_local_history: true
      });
    }
  }

  if (!currentData.nominal_thickness_mm && !currentData.t_initial && !text.includes("nominal")) {
    if (taskState.goal.toLowerCase().includes("corrosion rate")) {
      missing.push({
        field: "nominal_thickness_mm",
        reason: "Required as baseline thickness to compute annual metal loss rate",
        sources_checked: ["scanned_pdf"],
        can_search_local_history: true
      });
    }
  }

  return missing;
}

export function detectEvidenceConflicts(taskState, newFinding = {}) {
  const conflicts = [];
  const existingEvidence = taskState.evidence || [];

  if (newFinding.thickness_mm && existingEvidence.length > 0) {
    for (const ev of existingEvidence) {
      if (ev.thickness_mm && Math.abs(ev.thickness_mm - newFinding.thickness_mm) > 0.5) {
        conflicts.push({
          field: "thickness_mm",
          source_a: { source: ev.source || "historical_database", value: ev.thickness_mm },
          source_b: { source: newFinding.source || "current_inspection", value: newFinding.thickness_mm },
          discrepancy: `${Math.abs(ev.thickness_mm - newFinding.thickness_mm).toFixed(2)} mm discrepancy detected`,
          resolution_strategy: "Prioritize current verified NDT measurement, flag variance in management approval note",
          requires_hitl: true
        });
      }
    }
  }

  return conflicts;
}

export function generateReplan(taskState, trigger) {
  if (!taskState) return { success: false, reason: "Invalid task state" };

  if (taskState.replan_count >= taskState.max_replans) {
    taskState.status = TaskStatus.FAILED;
    return {
      success: false,
      replan_count: taskState.replan_count,
      reason: `Maximum replan limit (${taskState.max_replans}) reached. Halting execution to prevent infinite loop.`,
      action: "TERMINATE_SAFELY"
    };
  }

  taskState.replan_count++;
  taskState.status = TaskStatus.REPLANNING;

  const currentPlan = taskState.plan || [];
  const newSteps = [];

  // Handle Missing Information
  if (trigger.type === ReplanTrigger.MISSING_INFORMATION && trigger.missing && trigger.missing.length > 0) {
    const missingField = trigger.missing[0].field;
    
    // Insert historical database search or user query step
    const recoveryStep = {
      step_id: `replan-step-${taskState.replan_count}`,
      name: `Historical Equipment Record Search (${missingField})`,
      goal: `Query plant equipment database for historical ${missingField} on ${trigger.equipment_id || "equipment"}`,
      dependencies: [],
      required_capabilities: ["database_lookup", "rag_search"],
      preferred_modality: "text",
      preferred_model: "nemotron-3-nano",
      preferred_agent: "agent-093-rag-knowledge-agent",
      allowed_tools: ["query_local_knowledge", "search_equipment_history"],
      expected_output: `Retrieved historical ${missingField} value`,
      risk_level: "low",
      status: StepStatus.READY,
      validation_rule: (out) => Boolean(out && (out.found || out.value !== undefined)),
      retry_policy: { max_retries: 1, backoff_ms: 50 }
    };

    // Place recovery step before downstream synthesis and deliverables
    for (const step of currentPlan) {
      if (step.status === StepStatus.COMPLETED) {
        newSteps.push(step);
      } else if (step.name.includes("Synthesis") || step.name.includes("Calculation") || step.name.includes("Deliverables")) {
        if (!newSteps.some(s => s.step_id === recoveryStep.step_id)) {
          newSteps.push(recoveryStep);
        }
        // Add dependency on recovery step
        step.dependencies = [...new Set([...step.dependencies, recoveryStep.step_id])];
        newSteps.push(step);
      } else {
        newSteps.push(step);
      }
    }

    taskState.plan = newSteps;
    taskState.missing_information.push(...trigger.missing);
    taskState.status = TaskStatus.EXECUTING;

    return {
      success: true,
      replan_count: taskState.replan_count,
      trigger: trigger.type,
      adaptation: `Inserted historical search step for missing ${missingField}`,
      new_plan_length: newSteps.length
    };
  }

  // Handle Agent or Tool Failure with Substitution
  if (trigger.type === ReplanTrigger.AGENT_UNAVAILABLE || trigger.type === ReplanTrigger.TOOL_FAILURE) {
    const failedStepId = trigger.step_id;
    for (const step of currentPlan) {
      if (step.step_id === failedStepId) {
        // Fallback to general orchestrator or code specialist
        step.preferred_agent = trigger.fallback_agent || "agent-101-master-agent";
        step.preferred_model = trigger.fallback_model || "nemotron-3-nano";
        step.status = StepStatus.READY;
      }
    }

    taskState.status = TaskStatus.EXECUTING;
    return {
      success: true,
      replan_count: taskState.replan_count,
      trigger: trigger.type,
      adaptation: `Substituted failed resource with local fallback (${trigger.fallback_agent || "agent-101"})`,
      new_plan_length: currentPlan.length
    };
  }

  // Handle Evidence Conflict
  if (trigger.type === ReplanTrigger.EVIDENCE_CONFLICT && trigger.conflicts) {
    taskState.conflicts.push(...trigger.conflicts);
    taskState.requires_hitl = true;
    taskState.status = TaskStatus.EXECUTING;

    return {
      success: true,
      replan_count: taskState.replan_count,
      trigger: trigger.type,
      adaptation: "Recorded measurement conflict; flagged for mandatory Human-In-The-Loop approval note highlight",
      new_plan_length: currentPlan.length
    };
  }

  taskState.status = TaskStatus.EXECUTING;
  return {
    success: true,
    replan_count: taskState.replan_count,
    trigger: trigger.type || "GENERAL_ADAPTATION",
    adaptation: "Plan updated to reflect intermediate execution outcome",
    new_plan_length: currentPlan.length
  };
}
