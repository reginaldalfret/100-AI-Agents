/**
 * Sovereign AI Workbench — Autonomous Task Planner
 * Dynamically decomposes arbitrary industrial goals into structured, executable DAGs.
 */

import { createTaskState, TaskStatus, StepStatus } from "./task-state.js";
import { classifyTask } from "../models/task-classifier.js";
import { listTools } from "../tools/tool-registry.js";

export function chooseExecutionStrategy(goal = "", inputs = []) {
  const text = (typeof goal === "string" ? goal : goal.goal || "").toLowerCase();
  
  // Specific predefined workflow trigger words
  const explicitWorkflows = [
    "workflow", "predefined", "standard inspection", "regulatory audit workflow"
  ];

  const isExplicitWorkflow = explicitWorkflows.some(w => text.includes(w)) && !text.includes("whatever") && !text.includes("unseen") && !text.includes("dynamic");

  if (isExplicitWorkflow) {
    return {
      strategy: "EXISTING_WORKFLOW",
      workflow_id: text.includes("audit") ? "regulatory-audit" : "inspection-analysis",
      confidence: 0.95,
      reason: "User explicitly requested a predefined operational workflow"
    };
  }

  return {
    strategy: "AUTONOMOUS_PLAN",
    confidence: 0.98,
    reason: "Free-form industrial objective requiring dynamic step decomposition and multi-agent synthesis"
  };
}

export function createPlan(goalInput, inputs = [], options = {}) {
  const goalText = typeof goalInput === "string" ? goalInput : goalInput.goal || "";
  const attachments = Array.isArray(inputs) ? inputs : (goalInput.attachments || []);
  const text = goalText.toLowerCase();

  const taskState = createTaskState({
    goal: goalText,
    inputs: attachments,
    execution_strategy: options.execution_strategy || "AUTONOMOUS_PLAN"
  });

  const steps = [];
  let stepIndex = 1;

  // 1. Ingestion & Visual / Document Extraction Step
  const hasImage = attachments.some(a => /\.(png|jpg|jpeg|webp|bmp|dwg|dxf)$/i.test(a.name || ""));
  const hasPDF = attachments.some(a => /\.(pdf)$/i.test(a.name || ""));
  const mentionsVisual = text.includes("photo") || text.includes("image") || text.includes("picture") || text.includes("drawing") || text.includes("p&id") || text.includes("defect") || text.includes("corrosion");
  const mentionsDocument = text.includes("report") || text.includes("document") || text.includes("ndt") || text.includes("scanned") || text.includes("pdf") || text.includes("inspection");

  if (hasImage || mentionsVisual) {
    steps.push({
      step_id: `step-${stepIndex++}`,
      name: "Visual Defect & Component Inspection",
      goal: "Analyze image evidence, detect corrosion/CUI/crack anomalies and extract equipment tags",
      dependencies: [],
      required_capabilities: ["vision_analysis", "defect_detection"],
      preferred_modality: "vision",
      preferred_model: "local-vision-ocr",
      preferred_agent: "agent-051-image-analysis-agent",
      allowed_tools: ["analyze_image", "extract_p_and_id"],
      expected_output: "Structured visual defect findings and severity ratings",
      risk_level: "low",
      status: StepStatus.READY,
      validation_rule: (out) => Boolean(out && (out.visual_findings || out.defects_detected || out.equipment_id)),
      retry_policy: { max_retries: 2, backoff_ms: 100 }
    });
  }

  if (hasPDF || mentionsDocument || steps.length === 0) {
    const prevDeps = steps.map(s => s.step_id);
    steps.push({
      step_id: `step-${stepIndex++}`,
      name: "Document Ingestion & NDT Thickness Extraction",
      goal: "Ingest scanned inspection report and extract ultrasonic thickness measurements table",
      dependencies: [],
      required_capabilities: ["document_ocr", "table_extraction"],
      preferred_modality: "ocr",
      preferred_model: "local-vision-ocr",
      preferred_agent: "agent-045-pdf-processing-agent",
      allowed_tools: ["extract_ndt_tables", "read_scanned_pdf"],
      expected_output: "Extracted tabular thickness measurements and equipment metadata",
      risk_level: "low",
      status: StepStatus.READY,
      validation_rule: (out) => Boolean(out && (out.thickness_table || out.measurements || out.text)),
      retry_policy: { max_retries: 2, backoff_ms: 100 }
    });
  }

  // 2. Local Knowledge & Statutory Standard Retrieval Step
  const ingestDeps = steps.map(s => s.step_id);
  steps.push({
    step_id: `step-${stepIndex++}`,
    name: "Statutory Standards & SOP Retrieval",
    goal: "Query local vector RAG for OISD-STD-129, API-653, and refinery operating limits",
    dependencies: [...ingestDeps],
    required_capabilities: ["rag_search", "standards_lookup"],
    preferred_modality: "text",
    preferred_model: "nemotron-3-nano",
    preferred_agent: "agent-093-rag-knowledge-agent",
    allowed_tools: ["query_local_knowledge", "search_sop_standards"],
    expected_output: "Grounded standard citations with mandatory retirement thickness limits",
    risk_level: "low",
    status: StepStatus.PENDING,
    validation_rule: (out) => Boolean(out && Array.isArray(out.citations) && out.citations.length > 0),
    retry_policy: { max_retries: 2, backoff_ms: 100 }
  });

  // 3. Quantitative Risk & Sandbox Calculation Step (If calculations/data/formulas mentioned)
  const isComputation = text.includes("calculate") || text.includes("corrosion rate") || text.includes("remaining life") || text.includes("risk") || text.includes("formula") || text.includes("python");
  let calcStepId = null;
  if (isComputation) {
    calcStepId = `step-${stepIndex++}`;
    steps.push({
      step_id: calcStepId,
      name: "Corrosion Rate & Remaining Life Calculation",
      goal: "Execute verified corrosion rate and remaining life formulas in isolated Python sandbox",
      dependencies: [...ingestDeps],
      required_capabilities: ["code_execution", "sandbox_math"],
      preferred_modality: "code",
      preferred_model: "local-code-specialist",
      preferred_agent: "agent-055-code-review-agent",
      allowed_tools: ["execute_python_sandbox", "calculate_corrosion_rate"],
      expected_output: "Accurate numerical corrosion rate (mm/yr) and remaining life (years)",
      risk_level: "low",
      status: StepStatus.PENDING,
      validation_rule: (out) => Boolean(out && (out.corrosion_rate_mm_yr !== undefined || out.remaining_life_years !== undefined)),
      retry_policy: { max_retries: 2, backoff_ms: 100 }
    });
  }

  // 4. Multi-Agent Epistemic Reasoning & Synthesis Step
  const synthDeps = steps.map(s => s.step_id);
  const synthStepId = `step-${stepIndex++}`;
  steps.push({
    step_id: synthStepId,
    name: "Multi-Agent Engineering Synthesis & Risk Assessment",
    goal: "Correlate visual findings, thickness measurements, and statutory standards into comprehensive risk evaluation",
    dependencies: [...synthDeps],
    required_capabilities: ["epistemic_reasoning", "orchestration", "risk_assessment"],
    preferred_modality: "text",
    preferred_model: "nemotron-3-nano",
    preferred_agent: "agent-101-master-agent",
    allowed_tools: ["synthesize_inspection_findings", "assess_structural_risk"],
    expected_output: "Synthesized engineering assessment with actionable maintenance recommendations",
    risk_level: "medium",
    status: StepStatus.PENDING,
    validation_rule: (out) => Boolean(out && (out.risk_level || out.summary || out.recommendations)),
    retry_policy: { max_retries: 2, backoff_ms: 100 }
  });

  // 5. Official Deliverable Generation Step
  const delivStepId = `step-${stepIndex++}`;
  steps.push({
    step_id: delivStepId,
    name: "Multi-Format Deliverables Generation",
    goal: "Generate formal Approval Note (.docx), Inspection Workbook (.xlsx), and Management Briefing (.pptx)",
    dependencies: [synthStepId],
    required_capabilities: ["deliverable_generation", "office_authoring"],
    preferred_modality: "text",
    preferred_model: "nemotron-3-nano",
    preferred_agent: "agent-049-report-generation-agent",
    allowed_tools: ["generate_approval_note", "generate_inspection_workbook", "generate_management_slides"],
    expected_output: "Generated official files saved strictly on E: drive",
    risk_level: "low",
    status: StepStatus.PENDING,
    validation_rule: (out) => Boolean(out && Array.isArray(out.deliverables) && out.deliverables.length >= 1),
    retry_policy: { max_retries: 2, backoff_ms: 100 }
  });

  // 6. Human-In-The-Loop Sign-Off Checkpoint
  steps.push({
    step_id: `step-${stepIndex++}`,
    name: "Human-In-The-Loop Verification & Approval",
    goal: "Present grounded findings and generated deliverables for authorized Plant Inspector sign-off",
    dependencies: [delivStepId],
    required_capabilities: ["hitl_approval"],
    preferred_modality: "text",
    preferred_model: "nemotron-3-nano",
    preferred_agent: "agent-101-master-agent",
    allowed_tools: ["request_human_approval"],
    expected_output: "Signed approval record with timestamp and inspector ID",
    risk_level: "high",
    requires_hitl: true,
    status: StepStatus.PENDING,
    validation_rule: (out) => Boolean(out && (out.approved !== undefined || out.approval_id)),
    retry_policy: { max_retries: 1, backoff_ms: 0 }
  });

  taskState.plan = steps;
  taskState.selected_agents = [...new Set(steps.map(s => s.preferred_agent))];
  taskState.selected_models = [...new Set(steps.map(s => s.preferred_model))];
  taskState.requires_hitl = steps.some(s => s.requires_hitl);

  return taskState;
}

export function validatePlan(taskState) {
  if (!taskState || !Array.isArray(taskState.plan) || taskState.plan.length === 0) {
    return { valid: false, errors: ["Plan contains no executable steps"] };
  }

  const stepIds = new Set(taskState.plan.map(s => s.step_id));
  const errors = [];

  for (const step of taskState.plan) {
    for (const dep of step.dependencies) {
      if (!stepIds.has(dep)) {
        errors.push(`Step ${step.step_id} has unresolved dependency: ${dep}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    step_count: taskState.plan.length,
    agents_involved: taskState.selected_agents,
    models_involved: taskState.selected_models,
    requires_hitl: taskState.requires_hitl
  };
}
