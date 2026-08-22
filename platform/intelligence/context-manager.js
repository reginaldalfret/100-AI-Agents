/**
 * SA-S03 Platform — Unified Intelligence Context & Trace Manager
 * Prepares Tier-2 context foundation with trace IDs and stateful payload bindings.
 */

let traceCounter = 1000;

export function generateTraceId() {
  traceCounter++;
  const year = new Date().getFullYear();
  return `INT-${year}-${String(traceCounter).padStart(6, "0")}`;
}

export function createExecutionContext(rawRequest = {}) {
  const traceId = rawRequest.trace_id || generateTraceId();
  const conversationId = rawRequest.conversation_id || `conv_${Date.now()}`;
  const workflowId = rawRequest.workflow_id || null;

  return {
    trace_id: traceId,
    conversation_id: conversationId,
    workflow_id: workflowId,
    student_id: rawRequest.student_id || rawRequest.studentId || null,
    entities: rawRequest.entities || {},
    verified_facts: [],
    previous_messages: rawRequest.previous_messages || [],
    selected_agent: rawRequest.selected_agent || "agent-101",
    pending_approval: null,
    timestamp: new Date().toISOString(),

    addFact(fact) {
      this.verified_facts.push({
        ...fact,
        recorded_at: new Date().toISOString()
      });
    },

    setPendingApproval(approvalObj) {
      this.pending_approval = approvalObj;
    },

    toJSON() {
      return {
        trace_id: this.trace_id,
        conversation_id: this.conversation_id,
        workflow_id: this.workflow_id,
        student_id: this.student_id,
        entities: this.entities,
        verified_facts_count: this.verified_facts.length,
        timestamp: this.timestamp
      };
    }
  };
}
