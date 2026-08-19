// Institutional Audit & Action Logging Service
const auditLog = [];

export function logAudit({ workflowId, action, actor = 'System', stepId = null, details = {}, status = 'completed' }) {
  const entry = {
    id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    workflowId,
    stepId,
    actor,
    action,
    status,
    details
  };
  auditLog.push(entry);
  return entry;
}

export function getAuditLogs(filter = {}) {
  let list = [...auditLog];
  if (filter.workflowId) {
    list = list.filter(e => e.workflowId === filter.workflowId);
  }
  return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
