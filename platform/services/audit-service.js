// Institutional Audit & Action Logging Service
const auditLog = [];

export function logAudit(workflowIdOrObj, agentId, action, details = {}, status = 'completed') {
  let entry;
  if (typeof workflowIdOrObj === 'object' && workflowIdOrObj !== null) {
    const { workflowId, action: act, actor = 'System', stepId = null, details: dt = {}, status: st = 'completed' } = workflowIdOrObj;
    entry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      workflowId,
      stepId,
      actor,
      agentId: actor,
      action: act,
      status: st,
      details: dt
    };
  } else {
    entry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      workflowId: workflowIdOrObj,
      stepId: null,
      actor: agentId || 'System',
      agentId: agentId || 'System',
      action,
      status,
      details
    };
  }

  auditLog.push(entry);
  return entry;
}

export function getAuditLogs(filter = {}) {
  let list = [...auditLog];
  if (filter && filter.workflowId) {
    list = list.filter(e => e.workflowId === filter.workflowId);
  }
  return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function getAuditTrail(workflowId) {
  return getAuditLogs({ workflowId });
}
