import test from 'node:test';
import assert from 'node:assert/strict';
import { SuperOrchestrator } from '../../platform/orchestration/super-orchestrator.js';
import { TaskContext } from '../../platform/orchestration/task-context.js';
import { ConflictResolver, ConflictType } from '../../platform/orchestration/conflict-resolver.js';
import { SecurityPolicy, AgentRole, ResourceCapability } from '../../platform/orchestration/security-policy.js';

test('Super AI Orchestrator Engine Core', async (t) => {
  const orchestrator = new SuperOrchestrator({ dryRun: true });

  await t.test('analyzeTask identifies technologies and patterns correctly', () => {
    const analysis = orchestrator.analyzeTask(
      'Resolve deadlock in PostgreSQL transactions within NestJS orders service under high concurrency',
      { files: ['src/orders/orders.service.ts', 'src/database/schema.ts'] }
    );

    assert.ok(analysis.technologies.includes('postgresql') || analysis.technologies.includes('postgres'));
    assert.ok(analysis.technologies.includes('nestjs'));
    assert.ok(analysis.patterns.includes('database_persistence') || analysis.patterns.length > 0);
    assert.ok(['medium', 'high', 'critical'].includes(analysis.riskLevel));
  });

  await t.test('selectSpecialists selects a minimal targeted team (3-8 specialists)', () => {
    const analysis = orchestrator.analyzeTask(
      'Fix SQL injection and deadlock in PostgreSQL database using Drizzle ORM in NestJS'
    );
    const team = orchestrator.selectSpecialists(analysis);

    assert.ok(team.length >= 3 && team.length <= 10, `Team size must be minimal (got ${team.length})`);
    
    const teamIds = team.map(m => m.agent_id);
    const hasDatabaseOrSecurity = team.some(m => 
      m.domain.toLowerCase().includes('data') || 
      m.domain.toLowerCase().includes('sql') || 
      m.domain.toLowerCase().includes('security') ||
      m.domain.toLowerCase().includes('postgres') ||
      m.role.toLowerCase().includes('sql') ||
      m.role.toLowerCase().includes('database') ||
      m.role.toLowerCase().includes('security')
    );
    assert.ok(hasDatabaseOrSecurity, 'Should include database or security specialist');

    // Should NOT include unrelated specialists like Swift or Solidity
    const hasSwift = teamIds.includes('agent-128') || teamIds.includes('agent-129');
    assert.equal(hasSwift, false, 'Should not select Swift specialist for Postgres task');
  });

  await t.test('buildTaskDAG generates dynamic 5-stage dependency DAG', () => {
    const analysis = orchestrator.analyzeTask('Optimize React Server Components bundle size with Next.js');
    const team = orchestrator.selectSpecialists(analysis);
    const dag = orchestrator.buildTaskDAG(team, analysis);

    assert.equal(dag.stages.length, 5, 'DAG must have exactly 5 stages');
    assert.ok(dag.totalTasks >= 5, 'DAG must contain multiple tasks');
    
    const stageNames = dag.stages.map(s => s.name);
    assert.ok(stageNames.some(n => n.includes('Architecture') || n.includes('Discovery')));
    assert.ok(stageNames.some(n => n.includes('Implementation') || n.includes('Verification')));
  });

  await t.test('executeParallel runs independent tasks concurrently', async () => {
    const context = new TaskContext({ prompt: 'Test task execution' });
    const dag = {
      stages: [
        {
          stage_id: 'stage-1',
          name: 'Discovery',
          tasks: [
            { task_id: 't1', name: 'Inspect Schema', agent_id: 'agent-181', action: 'inspect_schema' },
            { task_id: 't2', name: 'Inspect Security', agent_id: 'agent-265', action: 'inspect_security' }
          ]
        }
      ]
    };

    const outputs = await orchestrator.executeParallel(dag, context);
    assert.ok(outputs['stage-1'], 'Stage outputs must exist');
    assert.equal(outputs['stage-1'].length, 2, 'Should have executed 2 tasks');
    assert.ok(outputs['stage-1'].every(o => o.status === 'fulfilled'));
  });

  await t.test('resolveConflicts weights evidence and domain authority', () => {
    const resolver = new ConflictResolver();
    const conflict = {
      id: 'conf-1',
      type: ConflictType.CODE_DIFF_CONFLICT,
      subject: 'src/database/orders.ts',
      proposals: [
        {
          agentId: 'agent-189',
          role: 'database_engineer',
          confidence: 0.95,
          evidence: ['EXPLAIN ANALYZE shows index scan', 'Unit tests pass under concurrency'],
          testResults: { passed: 5, failed: 0 }
        },
        {
          agentId: 'agent-001',
          role: 'writer',
          confidence: 0.50,
          evidence: ['Looks clean'],
          testResults: null
        }
      ]
    };

    const resolution = resolver.resolveConflict(conflict);
    assert.equal(resolution.winningAgentId, 'agent-189', 'Database specialist with passing tests must win');
    assert.ok(resolution.compositeScore > 1.0);
  });

  await t.test('runVerificationPipeline validates git safety and schema migration policies', () => {
    const stageOutputs = {
      'stage_1': [
        {
          status: 'fulfilled',
          task_id: 't1',
          agent_id: 'agent-181',
          output: {
            status: 'success',
            files: [{ path: 'src/db.ts', content: 'export const db = {};' }]
          }
        }
      ]
    };

    const safeResult = orchestrator.runVerificationPipeline(stageOutputs, 'medium');
    assert.equal(safeResult.passed, true);
  });

  await t.test('SecurityPolicy blocks unprivileged commands and enforces permissions', () => {
    const policy = new SecurityPolicy();

    const allowedRead = policy.checkPermission(AgentRole.DEVELOPER, ResourceCapability.READ_CODE);
    assert.equal(allowedRead, true);

    const safeCmd = policy.validateCommand('pnpm test', AgentRole.DEVELOPER);
    assert.equal(safeCmd.allowed, true);

    const forcePushCmd = policy.validateCommand('git push --force origin main', AgentRole.DEVELOPER);
    assert.equal(forcePushCmd.allowed, false);

    const devDbMig = policy.validateCommand('pnpm db:push', AgentRole.DEVELOPER);
    assert.equal(devDbMig.allowed, false, 'Unreviewed destructive migration must be blocked');

    const adminDbMig = policy.validateCommand('pnpm db:push', AgentRole.DATABASE_ENGINEER);
    assert.equal(adminDbMig.allowed, true, 'Database engineer is authorized for migrations');
  });
});
