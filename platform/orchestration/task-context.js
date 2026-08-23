/**
 * Super AI Platform — Shared Task Context Management
 * Manages thread-safe session state, stage outputs, evidence ledger, artifacts, and checkpoints.
 */

import crypto from "node:crypto";

export class TaskContext {
  constructor(initialData = {}) {
    this.taskId = initialData.taskId || `task-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    this.prompt = initialData.prompt || "";
    this.repoContext = initialData.repoContext || {};
    this.createdAt = initialData.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.status = initialData.status || "initialized";
    
    // Core data containers
    this.variables = new Map(Object.entries(initialData.variables || {}));
    this.stageOutputs = new Map(); // stageId -> Map(agentId -> output)
    this.artifacts = [];
    this.evidenceLedger = [];
    this.securityEvents = [];
    this.metrics = {
      startTime: Date.now(),
      endTime: null,
      durationMs: 0,
      totalSpecialistsInvoked: 0,
      totalStagesExecuted: 0,
      totalConflictsResolved: 0,
      verificationsPassed: 0,
      verificationsFailed: 0,
      errorsEncountered: 0,
      ...initialData.metrics
    };
    this.checkpoints = new Map();
    this.listeners = new Set();
  }

  // Event Subscription
  subscribe(listener) {
    if (typeof listener === "function") {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  notify(event, payload = {}) {
    this.updatedAt = new Date().toISOString();
    const eventObj = { taskId: this.taskId, event, timestamp: this.updatedAt, ...payload };
    for (const listener of this.listeners) {
      try {
        listener(eventObj);
      } catch (err) {
        console.error(`Error in TaskContext listener for event '${event}':`, err);
      }
    }
  }

  // Variable Management
  set(key, value) {
    this.variables.set(key, value);
    this.notify("VARIABLE_SET", { key, value });
    return this;
  }

  get(key, defaultValue = undefined) {
    return this.variables.has(key) ? this.variables.get(key) : defaultValue;
  }

  has(key) {
    return this.variables.has(key);
  }

  delete(key) {
    const deleted = this.variables.delete(key);
    if (deleted) this.notify("VARIABLE_DELETED", { key });
    return deleted;
  }

  getAllVariables() {
    return Object.fromEntries(this.variables.entries());
  }

  // Stage & Specialist Outputs
  recordStageOutput(stageId, agentId, output) {
    if (!this.stageOutputs.has(stageId)) {
      this.stageOutputs.set(stageId, new Map());
    }
    const stageMap = this.stageOutputs.get(stageId);
    stageMap.set(agentId, {
      agentId,
      stageId,
      output,
      recordedAt: new Date().toISOString()
    });
    this.metrics.totalSpecialistsInvoked++;
    this.notify("STAGE_OUTPUT_RECORDED", { stageId, agentId, output });
  }

  getStageOutputs(stageId) {
    if (!this.stageOutputs.has(stageId)) return [];
    return Array.from(this.stageOutputs.get(stageId).values());
  }

  getSpecialistOutput(stageId, agentId) {
    if (!this.stageOutputs.has(stageId)) return null;
    return this.stageOutputs.get(stageId).get(agentId) || null;
  }

  getAllStageOutputs() {
    const result = {};
    for (const [stageId, stageMap] of this.stageOutputs.entries()) {
      result[stageId] = Array.from(stageMap.values());
    }
    return result;
  }

  // Artifacts Management
  addArtifact(artifact) {
    const artObj = {
      id: artifact.id || `art-${Date.now()}-${this.artifacts.length + 1}`,
      name: artifact.name || "Untitled Artifact",
      type: artifact.type || "file",
      path: artifact.path || "",
      content: artifact.content || "",
      metadata: artifact.metadata || {},
      createdAt: new Date().toISOString()
    };
    this.artifacts.push(artObj);
    this.notify("ARTIFACT_ADDED", { artifact: artObj });
    return artObj;
  }

  getArtifacts() {
    return [...this.artifacts];
  }

  getArtifact(idOrPath) {
    return this.artifacts.find(a => a.id === idOrPath || a.path === idOrPath) || null;
  }

  // Evidence Ledger
  recordEvidence(item) {
    const evidenceObj = {
      id: item.id || `ev-${Date.now()}-${this.evidenceLedger.length + 1}`,
      source: item.source || "specialist",
      agentId: item.agentId || "unknown",
      category: item.category || "observation",
      claim: item.claim || "",
      confidence: typeof item.confidence === "number" ? item.confidence : 1.0,
      data: item.data || null,
      citation: item.citation || "",
      timestamp: new Date().toISOString()
    };
    this.evidenceLedger.push(evidenceObj);
    this.notify("EVIDENCE_RECORDED", { evidence: evidenceObj });
    return evidenceObj;
  }

  getEvidence() {
    return [...this.evidenceLedger];
  }

  findEvidenceByQuery(query) {
    const q = String(query).toLowerCase();
    return this.evidenceLedger.filter(e => 
      e.claim.toLowerCase().includes(q) || 
      e.category.toLowerCase().includes(q) ||
      e.agentId.toLowerCase().includes(q) ||
      (e.citation && e.citation.toLowerCase().includes(q))
    );
  }

  // Security Events
  logSecurityEvent(event) {
    const secObj = {
      id: `sec-${Date.now()}-${this.securityEvents.length + 1}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.securityEvents.push(secObj);
    this.notify("SECURITY_EVENT", { event: secObj });
    return secObj;
  }

  getSecurityEvents() {
    return [...this.securityEvents];
  }

  // Metrics
  trackMetric(name, value = 1) {
    if (typeof this.metrics[name] === "number") {
      this.metrics[name] += value;
    } else {
      this.metrics[name] = value;
    }
  }

  finalizeMetrics() {
    this.metrics.endTime = Date.now();
    this.metrics.durationMs = this.metrics.endTime - this.metrics.startTime;
    return this.metrics;
  }

  getMetrics() {
    return {
      ...this.metrics,
      currentDurationMs: Date.now() - this.metrics.startTime,
      artifactsCount: this.artifacts.length,
      evidenceCount: this.evidenceLedger.length
    };
  }

  // Checkpointing & Rollback
  createCheckpoint(name) {
    const checkpointName = name || `cp-${Date.now()}`;
    const snapshot = {
      name: checkpointName,
      createdAt: new Date().toISOString(),
      variables: new Map(this.variables),
      stageOutputs: new Map(Array.from(this.stageOutputs.entries()).map(([k, v]) => [k, new Map(v)])),
      artifacts: [...this.artifacts],
      evidenceLedger: [...this.evidenceLedger],
      metrics: { ...this.metrics }
    };
    this.checkpoints.set(checkpointName, snapshot);
    this.notify("CHECKPOINT_CREATED", { checkpoint: checkpointName });
    return checkpointName;
  }

  rollbackToCheckpoint(name) {
    const snapshot = this.checkpoints.get(name);
    if (!snapshot) {
      throw new Error(`Checkpoint '${name}' not found.`);
    }
    this.variables = new Map(snapshot.variables);
    this.stageOutputs = new Map(Array.from(snapshot.stageOutputs.entries()).map(([k, v]) => [k, new Map(v)]));
    this.artifacts = [...snapshot.artifacts];
    this.evidenceLedger = [...snapshot.evidenceLedger];
    this.metrics = { ...snapshot.metrics };
    this.notify("CHECKPOINT_RESTORED", { checkpoint: name });
    return true;
  }

  listCheckpoints() {
    return Array.from(this.checkpoints.keys());
  }

  // String Template Variable Interpolation
  interpolate(template) {
    if (typeof template !== "string") return template;

    return template.replace(/(\$\{([^}]+)\}|\{\{([^}]+)\})/g, (match, p1, expr1, expr2) => {
      const expr = (expr1 || expr2).trim();

      // Check context variable
      if (this.variables.has(expr)) {
        const val = this.variables.get(expr);
        return typeof val === "object" ? JSON.stringify(val) : String(val);
      }

      // Check nested props (e.g. stage.output or analysis.technologies)
      const parts = expr.split(".");
      if (parts[0] === "context" && parts.length > 1) {
        const subKey = parts.slice(1).join(".");
        if (this.variables.has(subKey)) return String(this.variables.get(subKey));
      }

      if (parts[0] === "stage" && parts.length >= 3) {
        const stageId = parts[1];
        const agentId = parts[2];
        const out = this.getSpecialistOutput(stageId, agentId);
        if (out) return typeof out.output === "object" ? JSON.stringify(out.output) : String(out.output);
      }

      return match;
    });
  }

  toJSON() {
    return {
      taskId: this.taskId,
      prompt: this.prompt,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      variables: this.getAllVariables(),
      stageOutputs: this.getAllStageOutputs(),
      artifacts: this.getArtifacts(),
      evidenceLedger: this.getEvidence(),
      securityEvents: this.getSecurityEvents(),
      metrics: this.getMetrics()
    };
  }
}
