import assert from 'node:assert/strict';
import { test, before, after, describe } from 'node:test';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://127.0.0.1:8300';
let gatewayProcess = null;
let mockAgent002Server = null;
let mockAgent101Server = null;

function createMockAgentServer(port, agentId, agentName) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/api/health' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', agent_id: agentId, model_available: true }));
        return;
      }

      if (req.url === '/api/agent' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            res.writeHead(200);
            res.end(JSON.stringify({
              status: 'success',
              agent_id: agentId,
              agent_name: agentName,
              received_task: parsed.task,
              context: parsed.context || {},
              result: `[${agentName}] Processed task: ${parsed.task}`
            }));
          } catch {
            res.writeHead(400);
            res.end(JSON.stringify({ status: 'error', error: 'Invalid JSON' }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port already in use by actual agent or previous test run
        resolve({ server: null, port, inUse: true });
      } else {
        reject(err);
      }
    });

    server.listen(port, '127.0.0.1', () => {
      resolve({ server, port, inUse: false });
    });
  });
}

async function isGatewayHealthy(url) {
  try {
    const res = await fetch(`${url}/api/health`);
    if (res.ok) {
      const data = await res.json();
      return data.status === 'ok' || data.status === 'healthy';
    }
  } catch {
    return false;
  }
  return false;
}

async function waitForGateway(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isGatewayHealthy(url)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  return false;
}

before(async () => {
  // 1. Start mock agent servers for Agent 002 (port 8102) and Agent 101 (port 8201)
  const mock002 = await createMockAgentServer(8102, 'agent-002', 'AI Email Agent');
  if (mock002.server) mockAgent002Server = mock002.server;

  const mock101 = await createMockAgentServer(8201, 'agent-101', 'AI Master Agent');
  if (mock101.server) mockAgent101Server = mock101.server;

  // 2. Check if Gateway is already running on 8300
  const alreadyRunning = await isGatewayHealthy(GATEWAY_URL);
  if (!alreadyRunning) {
    const gatewayScript = path.join(ROOT, 'platform', 'gateway', 'src', 'server.js');
    gatewayProcess = spawn(process.execPath, [gatewayScript], {
      cwd: ROOT,
      env: { ...process.env, PORT: '8300', HOST: '127.0.0.1', PROJECT_ROOT: ROOT },
      stdio: 'pipe'
    });

    const isReady = await waitForGateway(GATEWAY_URL, 15000);
    if (!isReady) {
      throw new Error(`Gateway failed to start at ${GATEWAY_URL} within timeout`);
    }
  }
});

after(async () => {
  if (mockAgent002Server) {
    await new Promise(resolve => mockAgent002Server.close(resolve));
  }
  if (mockAgent101Server) {
    await new Promise(resolve => mockAgent101Server.close(resolve));
  }
  if (gatewayProcess) {
    gatewayProcess.kill();
  }
});

describe('Gateway Workflows & Educational Platform Integration Tests', () => {
  test('Gateway Health check endpoint returns status ok and agent metrics', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.status === 'ok' || data.status === 'healthy');
    assert.equal(data.service, '100-to-1-gateway');
    assert.ok(typeof data.total_agents === 'number');
    assert.ok(data.total_agents > 0);
  });

  test('GET /api/workflows returns available educational workflows', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/workflows`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(typeof data.total === 'number');
    assert.ok(Array.isArray(data.workflows));
    assert.ok(data.workflows.length >= 4);

    const workflowIds = data.workflows.map(w => w.id);
    assert.ok(workflowIds.includes('scholarship-eligibility'), 'Must include scholarship-eligibility');
    assert.ok(workflowIds.includes('admission-verification'), 'Must include admission-verification');
    assert.ok(workflowIds.includes('course-override'), 'Must include course-override');
    assert.ok(workflowIds.includes('attendance-intervention'), 'Must include attendance-intervention');

    // Verify workflow definition structure
    const scholarshipWf = data.workflows.find(w => w.id === 'scholarship-eligibility');
    assert.ok(scholarshipWf.name);
    assert.ok(scholarshipWf.description);
    assert.ok(scholarshipWf.category);
    assert.ok(Array.isArray(scholarshipWf.steps));
    assert.ok(scholarshipWf.totalSteps > 0);
  });

  test('POST /api/workflows/start validation: missing workflow_id returns 400', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/workflows/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.status, 'error');
    assert.match(data.error, /workflow_id is required/i);
  });

  test('POST /api/workflows/start launches scholarship-eligibility and returns instance in pending_approval state', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/workflows/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: 'scholarship-eligibility',
        studentId: 'STU-1001',
        schemeId: 'SCH-MERIT'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'success');
    assert.ok(data.instance);
    assert.ok(data.instance.id.startsWith('WF-'));
    assert.equal(data.instance.workflowId, 'scholarship-eligibility');
    assert.equal(data.instance.status, 'pending_approval');
    assert.ok(data.instance.pendingDecision);
    assert.equal(data.instance.pendingDecision.stepId, 'committee-approval');
    assert.equal(data.instance.context.studentId, 'STU-1001');
    assert.equal(data.instance.context.studentName, 'Aarav Sharma');
  });

  test('POST /api/workflows/start launches admission-verification and returns instance in pending_approval state', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/workflows/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: 'admission-verification',
        studentId: 'STU-1005'
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'success');
    assert.ok(data.instance);
    assert.ok(data.instance.id.startsWith('WF-'));
    assert.equal(data.instance.workflowId, 'admission-verification');
    assert.equal(data.instance.status, 'pending_approval');
    assert.ok(data.instance.pendingDecision);
    assert.equal(data.instance.pendingDecision.stepId, 'admissions-approval');
  });

  test('POST /api/workflows/instances/:id/decision approves the step and advances to completion', async () => {
    // 1. Start a scholarship-eligibility workflow
    const startRes = await fetch(`${GATEWAY_URL}/api/workflows/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: 'scholarship-eligibility',
        studentId: 'STU-1002',
        schemeId: 'SCH-NEED'
      })
    });
    const startData = await startRes.json();
    assert.equal(startData.status, 'success');
    const instanceId = startData.instance.id;
    assert.equal(startData.instance.status, 'pending_approval');

    // 2. Submit approval decision
    const decisionRes = await fetch(`${GATEWAY_URL}/api/workflows/instances/${instanceId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'approved',
        notes: 'Approved need-based aid for Priya Patel by Scholarship Committee.'
      })
    });

    assert.equal(decisionRes.status, 200);
    const decisionData = await decisionRes.json();
    assert.equal(decisionData.status, 'success');
    assert.ok(decisionData.instance);
    assert.equal(decisionData.instance.id, instanceId);
    assert.equal(decisionData.instance.status, 'completed');
    assert.ok(decisionData.instance.result);
    assert.equal(decisionData.instance.currentStep, 'finished');
    assert.ok(decisionData.instance.context.stepOutputs['disbursement-and-notification']);

    // 3. Verify retrieving instance status via GET /api/workflows/instances/:id
    const getRes = await fetch(`${GATEWAY_URL}/api/workflows/instances/${instanceId}`);
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.status, 'success');
    assert.equal(getData.instance.status, 'completed');
  });

  test('POST /api/workflows/instances/:id/decision rejects and halts the workflow', async () => {
    // 1. Start a course-override workflow
    const startRes = await fetch(`${GATEWAY_URL}/api/workflows/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: 'course-override',
        studentId: 'STU-1003',
        courseCode: 'CS301'
      })
    });
    const startData = await startRes.json();
    const instanceId = startData.instance.id;

    // 2. Reject decision
    const decisionRes = await fetch(`${GATEWAY_URL}/api/workflows/instances/${instanceId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'rejected',
        notes: 'Prerequisite requirement CS201 not met.'
      })
    });

    assert.equal(decisionRes.status, 200);
    const decisionData = await decisionRes.json();
    assert.equal(decisionData.status, 'success');
    assert.equal(decisionData.instance.status, 'rejected');
  });

  test('POST /api/workflows/instances/:id/decision validation: invalid decision returns 400', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/workflows/instances/non-existent-wf/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'maybe'
      })
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.status, 'error');
    assert.match(data.error, /decision must be 'approved' or 'rejected'/i);
  });

  test('GET /api/institution/data returns students, courses, scholarships, and audit logs', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/institution/data`);
    assert.equal(res.status, 200);
    const data = await res.json();

    // Verify students array
    assert.ok(Array.isArray(data.students), 'students must be an array');
    assert.ok(data.students.length >= 5, 'must contain at least 5 students');
    const stu1 = data.students.find(s => s.id === 'STU-1001');
    assert.ok(stu1);
    assert.equal(stu1.name, 'Aarav Sharma');
    assert.ok(stu1.email);
    assert.ok(stu1.program);
    assert.ok(typeof stu1.gpa === 'number');
    assert.ok(Array.isArray(stu1.documents));

    // Verify courses array
    assert.ok(Array.isArray(data.courses), 'courses must be an array');
    assert.ok(data.courses.length >= 4, 'must contain at least 4 courses');
    const course = data.courses.find(c => c.code === 'CS101');
    assert.ok(course);
    assert.equal(course.title, 'Introduction to Computer Science');

    // Verify scholarship schemes array
    assert.ok(Array.isArray(data.scholarshipSchemes), 'scholarshipSchemes must be an array');
    assert.ok(data.scholarshipSchemes.length >= 3, 'must contain at least 3 scholarship schemes');
    const meritScheme = data.scholarshipSchemes.find(s => s.id === 'SCH-MERIT');
    assert.ok(meritScheme);
    assert.equal(meritScheme.name, 'Presidential Merit Scholarship');

    // Verify audit logs array
    assert.ok(Array.isArray(data.auditLogs), 'auditLogs must be an array');
    assert.ok(data.auditLogs.length >= 1, 'must contain at least 1 audit log entry');
    assert.ok(data.auditLogs[0].id);
    assert.ok(data.auditLogs[0].action);
    assert.ok(data.auditLogs[0].timestamp);
  });

  test('POST /api/chat routes to Agent 002 (AI Email Agent)', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: 'agent-002',
        task: 'Draft an official scholarship award notification email for student STU-1001.',
        context: { studentId: 'STU-1001', awardAmount: 6000 }
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.gateway, '100-to-1');
    assert.ok(data.agent);
    assert.equal(data.agent.agent_id, 'agent-002');
    assert.equal(data.agent.name, 'AI Email Agent');
    assert.equal(data.agent.category, 'foundation');
    assert.ok(data.result);
    assert.equal(data.result.agent_id, 'agent-002');
    assert.equal(data.result.status, 'success');
  });

  test('POST /api/chat routes to Agent 101 (AI Master Agent)', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: 'agent-101',
        task: 'Coordinate holistic student evaluation for scholarship and course override.',
        context: { studentId: 'STU-1001' }
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.gateway, '100-to-1');
    assert.ok(data.agent);
    assert.equal(data.agent.agent_id, 'agent-101');
    assert.equal(data.agent.name, 'AI Master Agent');
    assert.equal(data.agent.category, 'master');
    assert.ok(data.result);
    assert.equal(data.result.agent_id, 'agent-101');
    assert.equal(data.result.status, 'success');
  });

  test('POST /api/chat validation: missing agent_id or task returns 400', async () => {
    const resNoAgent = await fetch(`${GATEWAY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'Hello' })
    });
    assert.equal(resNoAgent.status, 400);
    const dataNoAgent = await resNoAgent.json();
    assert.match(dataNoAgent.error, /agent_id is required/i);

    const resNoTask = await fetch(`${GATEWAY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: 'agent-002', task: '' })
    });
    assert.equal(resNoTask.status, 400);
    const dataNoTask = await resNoTask.json();
    assert.match(dataNoTask.error, /task is required/i);
  });

  test('POST /api/chat validation: unknown agent returns 404', async () => {
    const res = await fetch(`${GATEWAY_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: 'agent-999', task: 'Hello non-existent agent' })
    });
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.match(data.error, /Unknown agent: agent-999/i);
  });
});
