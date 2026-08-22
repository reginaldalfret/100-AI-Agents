import { getWorkflow, listWorkflows } from "./definitions/index.js";
import * as AuditService from "../services/audit-service.js";

const instances = new Map();

export class WorkflowEngine {
  static getAvailableWorkflows() {
    const list = listWorkflows();
    return list.map(w => ({
      id: w.id,
      name: w.name,
      domain: w.domain || "Industrial Operations",
      description: w.description,
      totalSteps: w.steps.length,
      steps: w.steps.map(s => ({ id: s.id, name: s.name, agent_id: s.agent_id, action: s.action, is_hitl: Boolean(s.is_hitl) }))
    }));
  }

  static getAllInstances() {
    return Array.from(instances.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  static getInstance(instanceId) {
    return instances.get(instanceId) || null;
  }

  static async startWorkflow(workflowId, input = {}) {
    const definition = getWorkflow(workflowId);
    if (!definition) throw new Error(`Workflow definition not found: ${workflowId}`);

    const instanceId = `WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const context = {
      workflow_id: instanceId,
      workflowId,
      equipment_id: input.equipment_id || input.equipmentId || "TK-101",
      filePath: input.filePath || input.file_path || "TK-101_UT_Report.pdf",
      stepOutputs: {},
      evidenceLedger: [],
      ...input
    };

    const instance = {
      id: instanceId,
      workflowId: definition.id,
      workflowName: definition.name,
      domain: definition.domain,
      status: "running",
      currentStepIndex: 0,
      totalSteps: definition.steps.length,
      currentStep: definition.steps[0].id,
      context,
      stepHistory: [],
      evidenceLedger: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: null,
      error: null
    };

    instances.set(instanceId, instance);

    AuditService.logAudit(instanceId, "SYSTEM", "WORKFLOW_STARTED", {
      workflowId: definition.id,
      workflowName: definition.name,
      equipment_id: context.equipment_id
    });

    return await this.executeNextStep(instance, definition);
  }

  static async executeNextStep(instance, definition) {
    const step = definition.steps[instance.currentStepIndex];

    if (!step) {
      instance.status = "completed";
      instance.currentStep = "finished";
      instance.updatedAt = new Date().toISOString();

      AuditService.logAudit(instance.id, "SYSTEM", "WORKFLOW_COMPLETED", {
        workflowId: instance.workflowId,
        totalSteps: instance.totalSteps,
        evidenceCount: instance.evidenceLedger.length
      });

      return instance;
    }

    instance.currentStep = step.id;
    instance.updatedAt = new Date().toISOString();

    if (step.is_hitl) {
      instance.status = "pending_approval";
      instance.pendingDecision = {
        stepId: step.id,
        agentId: step.agent_id,
        role: "Chief Inspection Engineer / General Manager",
        requiredAction: step.action || "Executive Review & Sign-off",
        timestamp: new Date().toISOString()
      };

      AuditService.logAudit(instance.id, step.agent_id || "agent-101", "HITL_DECISION_PENDING", {
        stepId: step.id,
        role: instance.pendingDecision.role
      });

      return instance;
    }

    try {
      let stepResult = null;
      if (typeof step.execute === "function") {
        stepResult = await step.execute(instance.context);
      } else {
        stepResult = { step: step.id, status: "completed", data: { action: step.action } };
      }

      instance.context.stepOutputs[step.id] = stepResult.data || stepResult;
      if (stepResult.evidence && Array.isArray(stepResult.evidence)) {
        instance.evidenceLedger.push(...stepResult.evidence);
        instance.context.evidenceLedger.push(...stepResult.evidence);
      }

      instance.stepHistory.push({
        stepId: step.id,
        agentId: step.agent_id,
        status: "completed",
        timestamp: new Date().toISOString(),
        data: stepResult.data
      });

      instance.currentStepIndex++;
      return await this.executeNextStep(instance, definition);
    } catch (err) {
      instance.status = "failed";
      instance.error = err.message;
      instance.updatedAt = new Date().toISOString();

      AuditService.logAudit(instance.id, step.agent_id || "SYSTEM", "STEP_FAILED", {
        stepId: step.id,
        error: err.message
      });

      return instance;
    }
  }

  static async submitHumanDecision(instanceId, decisionPayload = {}) {
    const instance = instances.get(instanceId);
    if (!instance) throw new Error(`Workflow instance not found: ${instanceId}`);
    if (instance.status !== "pending_approval") {
      throw new Error(`Instance is not waiting for human decision (current status: ${instance.status})`);
    }

    const decision = (decisionPayload.decision || "approved").toLowerCase();
    const definition = getWorkflow(instance.workflowId);

    if (decision === "approved" || decision === "approve") {
      AuditService.logAudit(instanceId, "HUMAN_OPERATOR", "HUMAN_DECISION_APPROVED", {
        stepId: instance.pendingDecision?.stepId,
        notes: decisionPayload.notes || "Approved by executive authority"
      });

      instance.status = "running";
      instance.pendingDecision = null;
      instance.currentStepIndex++;
      return await this.executeNextStep(instance, definition);
    } else {
      instance.status = "rejected";
      instance.pendingDecision = null;
      instance.updatedAt = new Date().toISOString();

      AuditService.logAudit(instanceId, "HUMAN_OPERATOR", "HUMAN_DECISION_REJECTED", {
        stepId: instance.currentStep,
        notes: decisionPayload.notes || "Rejected by executive authority"
      });

      return instance;
    }
  }
}
