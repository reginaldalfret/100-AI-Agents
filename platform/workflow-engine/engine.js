import http from 'node:http';
import { getWorkflowDefinition, WORKFLOW_DEFINITIONS } from './definitions/index.js';
import { StudentService, AuditService } from '../services/index.js';

const instances = new Map();

function postAgent(apiUrl, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/agent', apiUrl);
    const body = JSON.stringify(payload);

    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 60000
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ status: 'success', result: data });
        }
      });
    });

    req.on('timeout', () => req.destroy(new Error('Agent call timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export class WorkflowEngine {
  static getAvailableWorkflows() {
    return WORKFLOW_DEFINITIONS.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      category: w.category,
      totalSteps: w.steps.length,
      steps: w.steps.map(s => ({ id: s.id, name: s.name, type: s.type, agentName: s.agentName }))
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
    const definition = getWorkflowDefinition(workflowId);
    if (!definition) throw new Error(`Workflow definition not found: ${workflowId}`);

    const instanceId = `WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let student = null;
    if (input.studentId) {
      student = StudentService.getStudentById(input.studentId);
    }

    const context = {
      workflowInstanceId: instanceId,
      workflowId,
      studentId: input.studentId || (student ? student.id : null),
      studentName: student ? student.name : input.studentName || 'Student',
      studentEmail: student ? student.email : input.studentEmail || 'student@university.edu',
      program: student ? student.program : input.program || 'General Academic',
      gpa: student ? student.gpa : null,
      courseCode: input.courseCode || 'CS201',
      schemeId: input.schemeId || 'SCH-MERIT',
      stepOutputs: {},
      ...input
    };

    const instance = {
      id: instanceId,
      workflowId: definition.id,
      workflowName: definition.name,
      category: definition.category,
      status: 'running',
      currentStepIndex: 0,
      totalSteps: definition.steps.length,
      currentStep: definition.steps[0].id,
      context,
      stepHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: null,
      error: null
    };

    instances.set(instanceId, instance);

    AuditService.logAudit({
      workflowId: instanceId,
      action: 'WORKFLOW_STARTED',
      details: { workflowName: definition.name, studentId: context.studentId }
    });

    await this._runSteps(instance, definition);
    return instance;
  }

  static async submitDecision(instanceId, decision, notes = '') {
    const instance = instances.get(instanceId);
    if (!instance) throw new Error(`Workflow instance not found: ${instanceId}`);
    if (instance.status !== 'pending_approval') {
      throw new Error(`Instance is not waiting for approval (current status: ${instance.status})`);
    }

    const definition = getWorkflowDefinition(instance.workflowId);
    const step = definition.steps[instance.currentStepIndex];

    AuditService.logAudit({
      workflowId: instanceId,
      stepId: step.id,
      action: `HUMAN_DECISION_${decision.toUpperCase()}`,
      actor: 'Academic Committee / Administrator',
      details: { decision, notes, stepName: step.name }
    });

    if (decision === 'rejected') {
      instance.status = 'rejected';
      instance.updatedAt = new Date().toISOString();
      instance.stepHistory.push({
        stepId: step.id,
        stepName: step.name,
        type: step.type,
        status: 'rejected',
        decision,
        notes,
        completedAt: new Date().toISOString()
      });
      return instance;
    }

    // Decision is approved
    instance.stepHistory.push({
      stepId: step.id,
      stepName: step.name,
      type: step.type,
      status: 'approved',
      decision: 'approved',
      notes,
      completedAt: new Date().toISOString()
    });

    instance.currentStepIndex += 1;
    instance.status = 'running';
    instance.updatedAt = new Date().toISOString();

    await this._runSteps(instance, definition);
    return instance;
  }

  static async _runSteps(instance, definition) {
    while (instance.currentStepIndex < definition.steps.length) {
      const step = definition.steps[instance.currentStepIndex];
      instance.currentStep = step.id;
      instance.updatedAt = new Date().toISOString();

      if (step.type === 'human_approval') {
        const stepResult = await step.execute(instance.context, instance.context.stepOutputs);
        instance.status = 'pending_approval';
        instance.pendingDecision = {
          stepId: step.id,
          stepName: step.name,
          description: step.description,
          data: stepResult
        };
        return;
      }

      try {
        let output;
        if (step.type === 'agent_task' && step.taskPrompt) {
          const prompt = typeof step.taskPrompt === 'function' ? step.taskPrompt(instance.context) : step.taskPrompt;
          // Execute agent task
          output = await step.execute(instance.context, instance.context.stepOutputs);
          output.agentPrompt = prompt;
        } else {
          output = await step.execute(instance.context, instance.context.stepOutputs);
        }

        instance.context.stepOutputs[step.id] = output;
        instance.stepHistory.push({
          stepId: step.id,
          stepName: step.name,
          type: step.type,
          agentId: step.agentId || null,
          agentName: step.agentName || null,
          status: 'completed',
          output,
          completedAt: new Date().toISOString()
        });

        AuditService.logAudit({
          workflowId: instance.id,
          stepId: step.id,
          action: 'STEP_COMPLETED',
          details: { stepName: step.name, outputSummary: Object.keys(output) }
        });

        instance.currentStepIndex += 1;
      } catch (err) {
        instance.status = 'failed';
        instance.error = err.message;
        instance.updatedAt = new Date().toISOString();
        AuditService.logAudit({
          workflowId: instance.id,
          stepId: step.id,
          action: 'STEP_FAILED',
          status: 'failed',
          details: { error: err.message }
        });
        return;
      }
    }

    instance.status = 'completed';
    instance.currentStep = 'finished';
    instance.updatedAt = new Date().toISOString();
    instance.result = {
      message: `${definition.name} completed successfully.`,
      finalOutputs: instance.context.stepOutputs
    };

    AuditService.logAudit({
      workflowId: instance.id,
      action: 'WORKFLOW_COMPLETED',
      details: { totalSteps: definition.steps.length }
    });
  }
}
