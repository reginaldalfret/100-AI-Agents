/**
 * Verification Test Suite for Super Orchestrator and Platform Orchestration Layer
 */

import { SuperOrchestrator } from "../platform/orchestration/super-orchestrator.js";
import { TaskContext } from "../platform/orchestration/task-context.js";
import { ConflictResolver, ConflictType } from "../platform/orchestration/conflict-resolver.js";
import { SecurityPolicy, AgentRole, ResourceCapability } from "../platform/orchestration/security-policy.js";
import { routingRegistry, WorkforceDomain } from "../platform/intelligence/routing-registry.js";
import { routeRequest, getWorkforceStatus } from "../platform/intelligence/router.js";

async function runTests() {
  console.log("=== RUNNING SUPER ORCHESTRATOR TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Test Routing Registry (301 Agents)
  console.log("\n[1] Testing Routing Registry & 301-Agent Mapping...");
  const workforceStatus = routingRegistry.getWorkforceStatus();
  assert(workforceStatus.total_agents >= 301, `Workforce has at least 301 agents (found: ${workforceStatus.total_agents})`);
  assert(workforceStatus.available_specialists >= 301, "All specialists ready");
  
  const reactMatch = routingRegistry.findAgentsByTechnology("react");
  assert(reactMatch.primary.agent_id === "agent-062", "React maps to agent-062");

  const postgresMatch = routingRegistry.findAgentsByTechnology("postgresql");
  assert(postgresMatch.primary.agent_id === "agent-064", "PostgreSQL maps to agent-064");

  const dockerMatch = routingRegistry.findAgentsByTechnology("docker");
  assert(dockerMatch.primary.agent_id === "agent-065", "Docker maps to agent-065");

  // 2. Test Security Policy & Least Privilege
  console.log("\n[2] Testing Security Policy & Migration/Git Gating...");
  const security = new SecurityPolicy();

  // Permissions
  assert(security.checkPermission(AgentRole.DEVELOPER, ResourceCapability.WRITE_CODE) === true, "Developer can write code");
  assert(security.checkPermission(AgentRole.SECURITY_AUDITOR, ResourceCapability.WRITE_CODE) === false, "Security auditor cannot write code");

  // Git Safety
  const forcePushCheck = security.validateGitOperation("git push origin main --force");
  assert(forcePushCheck.allowed === false, "Destructive git push --force is blocked");

  const safeGitCheck = security.validateGitOperation("git checkout -b feature/auth-flow");
  assert(safeGitCheck.allowed === true, "Safe git checkout is allowed");

  // Migration Safety Gating (pnpm db:generate)
  const clientGenCheck = security.validateMigrationCommand("pnpm db:generate");
  assert(clientGenCheck.allowed === true && clientGenCheck.gated === true, "pnpm db:generate is identified as gated client generation");

  const unreviewedMigrationCheck = security.validateMigrationCommand("npx prisma migrate dev", { role: AgentRole.DEVELOPER });
  assert(unreviewedMigrationCheck.allowed === false, "Destructive prisma migration without dry-run/approval is gated/blocked");

  const approvedMigrationCheck = security.validateMigrationCommand("npx prisma migrate dev --preview", { role: AgentRole.DEVELOPER });
  assert(approvedMigrationCheck.allowed === true, "Prisma migration with preview/dry-run is approved");

  // 3. Test Task Context
  console.log("\n[3] Testing Task Context State Management...");
  const ctx = new TaskContext({ prompt: "Build fullstack dashboard for student ${context.studentId}" });
  ctx.set("studentId", "STU-8821");
  const interpolated = ctx.interpolate(ctx.prompt);
  assert(interpolated === "Build fullstack dashboard for student STU-8821", "TaskContext string interpolation works");

  ctx.recordEvidence({ claim: "PostgreSQL port 5432 verified", confidence: 0.99, category: "empirical_validation" });
  assert(ctx.getEvidence().length === 1, "Evidence recorded in ledger");

  const cpName = ctx.createCheckpoint("phase_1");
  ctx.set("studentId", "STU-9999");
  ctx.rollbackToCheckpoint(cpName);
  assert(ctx.get("studentId") === "STU-8821", "Checkpoint rollback restored prior state");

  // 4. Test Conflict Resolver
  console.log("\n[4] Testing Conflict Resolver...");
  const resolver = new ConflictResolver();
  const conflictingOutputs = [
    {
      agentId: "agent-061",
      role: "developer",
      confidence: 0.8,
      output: {
        files: [{ path: "schema.prisma", content: "model User { id String @id }" }]
      }
    },
    {
      agentId: "agent-064",
      role: "database_engineer",
      confidence: 0.95,
      output: {
        files: [{ path: "schema.prisma", content: "model User { id String @id @default(uuid()) \n email String @unique }" }]
      },
      evidence: [{ category: "empirical_benchmark", citation: "UUID standard format" }]
    }
  ];

  const conflictResult = resolver.resolveAll(conflictingOutputs);
  assert(conflictResult.conflictsFound === 1, "Conflict detected in schema.prisma");
  assert(conflictResult.resolutions[0].winningAgentId === "agent-064", "Database Specialist won conflict over developer on schema");

  // 5. Test Super Orchestrator End-to-End
  console.log("\n[5] Testing Super Orchestrator Pipeline...");
  const orchestrator = new SuperOrchestrator({ dryRun: true });
  const prompt = "Build a fullstack Next.js and PostgreSQL system with pnpm db:generate schema migration and automated jest tests";
  
  // Analyze
  const analysis = orchestrator.analyzeTask(prompt, { files: ["package.json", "schema.prisma"] });
  assert(analysis.technologies.includes("nextjs") || analysis.technologies.includes("react"), "Analyzed Next.js technology");
  assert(analysis.technologies.includes("postgresql"), "Analyzed PostgreSQL technology");
  assert(analysis.migrationRequired === true, "Identified migration requirement");

  // Select Specialists
  const specialists = orchestrator.selectSpecialists(analysis);
  assert(specialists.some(s => s.agent_id === "agent-101"), "Master Orchestrator included");
  assert(specialists.some(s => s.domain === WorkforceDomain.DATABASE_ORM), "Database specialist included");

  // Build DAG
  const dag = orchestrator.buildTaskDAG(specialists, analysis);
  assert(dag.stages.length === 5, "Generated 5-stage DAG");

  // Execute End-to-End
  const fullResult = await orchestrator.orchestrate(prompt, { dryRun: true });
  assert(fullResult.ok === true, "Orchestration pipeline succeeded");
  assert(fullResult.verification.passed === true, "Verification gate passed");
  assert(fullResult.dag.stages.length === 5, "Result contains full execution DAG");
  assert(fullResult.metrics.totalStagesExecuted === 5, "All 5 stages executed");

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
