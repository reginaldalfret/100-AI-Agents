/**
 * Super AI Platform — Security & Least-Privilege Policy Engine
 * Enforces least-privilege permissions, git safety guards, and migration safety gating (pnpm db:generate, prisma, drizzle).
 */

import path from "node:path";

export const ResourceCapability = Object.freeze({
  READ_CODE: "READ_CODE",
  WRITE_CODE: "WRITE_CODE",
  EXECUTE_CMD: "EXECUTE_CMD",
  READ_DB: "READ_DB",
  WRITE_DB: "WRITE_DB",
  DDL_SCHEMA: "DDL_SCHEMA",
  GIT_STATUS: "GIT_STATUS",
  GIT_COMMIT: "GIT_COMMIT",
  GIT_BRANCH: "GIT_BRANCH",
  GIT_PUSH: "GIT_PUSH",
  NETWORK_CALL: "NETWORK_CALL",
  SECRET_ACCESS: "SECRET_ACCESS",
  FILE_SYSTEM_ADMIN: "FILE_SYSTEM_ADMIN"
});

export const AgentRole = Object.freeze({
  MASTER_ORCHESTRATOR: "master_orchestrator",
  ARCHITECT: "architect",
  DEVELOPER: "developer",
  DATABASE_ENGINEER: "database_engineer",
  QA_ENGINEER: "qa_engineer",
  SECURITY_AUDITOR: "security_auditor",
  DEVOPS_ENGINEER: "devops_engineer",
  DOCS_WRITER: "docs_writer",
  RESEARCHER: "researcher",
  RESTRICTED_AGENT: "restricted_agent"
});

export const ROLE_PERMISSIONS = {
  [AgentRole.MASTER_ORCHESTRATOR]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.WRITE_CODE,
    ResourceCapability.EXECUTE_CMD,
    ResourceCapability.READ_DB,
    ResourceCapability.WRITE_DB,
    ResourceCapability.DDL_SCHEMA,
    ResourceCapability.GIT_STATUS,
    ResourceCapability.GIT_COMMIT,
    ResourceCapability.GIT_BRANCH,
    ResourceCapability.GIT_PUSH,
    ResourceCapability.NETWORK_CALL,
    ResourceCapability.SECRET_ACCESS,
    ResourceCapability.FILE_SYSTEM_ADMIN
  ],
  [AgentRole.ARCHITECT]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.GIT_STATUS,
    ResourceCapability.NETWORK_CALL
  ],
  [AgentRole.DEVELOPER]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.WRITE_CODE,
    ResourceCapability.EXECUTE_CMD,
    ResourceCapability.READ_DB,
    ResourceCapability.GIT_STATUS,
    ResourceCapability.GIT_COMMIT,
    ResourceCapability.GIT_BRANCH
  ],
  [AgentRole.DATABASE_ENGINEER]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.WRITE_CODE,
    ResourceCapability.EXECUTE_CMD,
    ResourceCapability.READ_DB,
    ResourceCapability.WRITE_DB,
    ResourceCapability.DDL_SCHEMA,
    ResourceCapability.GIT_STATUS
  ],
  [AgentRole.QA_ENGINEER]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.EXECUTE_CMD,
    ResourceCapability.READ_DB,
    ResourceCapability.GIT_STATUS
  ],
  [AgentRole.SECURITY_AUDITOR]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.READ_DB,
    ResourceCapability.GIT_STATUS
  ],
  [AgentRole.DEVOPS_ENGINEER]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.WRITE_CODE,
    ResourceCapability.EXECUTE_CMD,
    ResourceCapability.GIT_STATUS,
    ResourceCapability.GIT_BRANCH,
    ResourceCapability.NETWORK_CALL
  ],
  [AgentRole.DOCS_WRITER]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.WRITE_CODE,
    ResourceCapability.GIT_STATUS
  ],
  [AgentRole.RESEARCHER]: [
    ResourceCapability.READ_CODE,
    ResourceCapability.NETWORK_CALL
  ],
  [AgentRole.RESTRICTED_AGENT]: [
    ResourceCapability.READ_CODE
  ]
};

export const PROTECTED_BRANCHES = ["main", "master", "production", "prod", "release/*"];

export const DESTRUCTIVE_GIT_PATTERNS = [
  /\bgit\s+push\s+.*--force\b/i,
  /\bgit\s+push\s+.*-f\b/i,
  /\bgit\s+clean\s+.*-f[a-z]*d\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+branch\s+-D\s+(main|master|prod|production)\b/i
];

export const MIGRATION_COMMAND_PATTERNS = [
  /\bpnpm\s+db:generate\b/i,
  /\bpnpm\s+db:push\b/i,
  /\bpnpm\s+db:migrate\b/i,
  /\bnpx\s+prisma\s+migrate\b/i,
  /\bnpx\s+prisma\s+db\s+push\b/i,
  /\bnpx\s+prisma\s+generate\b/i,
  /\bdrizzle-kit\s+(generate|push|migrate|drop)\b/i,
  /\balembic\s+upgrade\b/i,
  /\bknex\s+migrate:\w+\b/i,
  /\btypeorm\s+migration:run\b/i,
  /\bmongoose\b.*schema/i
];

export const DANGEROUS_COMMAND_PATTERNS = [
  /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s+(\/|~\/|\.\.|\*)\b/i,
  /\b(del|erase)\s+\/[fF]\s+\/[sS]\s+[cC]:\\/i,
  /\bformat\s+[a-zA-Z]:/i,
  /\bmkfs\b/i,
  /\b(curl|wget)\s+.*\|\s*(sh|bash|powershell|cmd)\b/i,
  /\bshutdown\b/i,
  /\bdrop\s+database\b/i,
  /\btruncate\s+table\b/i
];

export class SecurityPolicy {
  constructor(options = {}) {
    this.allowDangerousCommands = Boolean(options.allowDangerousCommands);
    this.allowedPaths = options.allowedPaths || [];
    this.bypassTokens = new Set(options.bypassTokens || []);
    this.auditLog = [];
  }

  logEvent(type, outcome, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      outcome,
      details
    };
    this.auditLog.push(entry);
    return entry;
  }

  getAuditLog() {
    return [...this.auditLog];
  }

  checkPermission(role, capability) {
    const allowedCaps = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[AgentRole.RESTRICTED_AGENT];
    const isAllowed = allowedCaps.includes(capability);
    this.logEvent("PERMISSION_CHECK", isAllowed ? "ALLOWED" : "DENIED", { role, capability });
    return isAllowed;
  }

  enforceLeastPrivilege(agentId, role, requestedCapability, targetResource = "") {
    const allowed = this.checkPermission(role, requestedCapability);
    if (!allowed) {
      const err = new Error(
        `SECURITY_VIOLATION: Agent '${agentId}' with role '${role}' lacks required capability '${requestedCapability}' for resource '${targetResource}'.`
      );
      err.code = "INSUFFICIENT_PRIVILEGES";
      throw err;
    }
    return true;
  }

  validateGitOperation(command, options = {}) {
    const cmdStr = String(command || "").trim();
    
    // Check for destructive git flags
    for (const pattern of DESTRUCTIVE_GIT_PATTERNS) {
      if (pattern.test(cmdStr)) {
        this.logEvent("GIT_SAFETY", "BLOCKED", { command: cmdStr, reason: "Destructive git operation forbidden" });
        return {
          allowed: false,
          code: "DESTRUCTIVE_GIT_FORBIDDEN",
          reason: `Destructive git operation detected in '${cmdStr}'. Force pushes, hard resets, and destructive cleans are blocked by default.`
        };
      }
    }

    // Check for direct push or modification of protected branches
    const isPushToProtected = PROTECTED_BRANCHES.some(b => {
      const branchRegex = new RegExp(`\\bgit\\s+push\\s+.*\\b${b.replace("*", ".*")}\\b`, "i");
      return branchRegex.test(cmdStr);
    });

    if (isPushToProtected && !options.allowProtectedBranchPush) {
      this.logEvent("GIT_SAFETY", "BLOCKED", { command: cmdStr, reason: "Direct push to protected branch" });
      return {
        allowed: false,
        code: "PROTECTED_BRANCH_VIOLATION",
        reason: `Direct push to protected branch is blocked. Create a feature branch and pull request instead.`
      };
    }

    // Gating check for dirty worktree if clean workspace requested
    if (options.requireCleanWorktree && options.isWorktreeDirty) {
      this.logEvent("GIT_SAFETY", "BLOCKED", { command: cmdStr, reason: "Dirty git workspace" });
      return {
        allowed: false,
        code: "DIRTY_WORKTREE",
        reason: "Cannot execute branch operation with uncommitted changes. Stash or commit working tree changes first."
      };
    }

    this.logEvent("GIT_SAFETY", "ALLOWED", { command: cmdStr });
    return { allowed: true, code: "OK" };
  }

  validateMigrationCommand(command, context = {}) {
    const cmdStr = String(command || "").trim();
    let isMigration = false;
    let matchedPattern = null;

    for (const pattern of MIGRATION_COMMAND_PATTERNS) {
      if (pattern.test(cmdStr)) {
        isMigration = true;
        matchedPattern = pattern.toString();
        break;
      }
    }

    if (!isMigration) {
      return { isMigration: false, allowed: true, gated: false };
    }

    // If it's a migration command, check safety gating
    // pnpm db:generate / prisma / drizzle migrations requires:
    // 1. Validated schema
    // 2. Dry run preview OR explicit safety token OR database engineer approval
    const hasDryRun = cmdStr.includes("--dry-run") || cmdStr.includes("--preview") || context.dryRun;
    const hasApprovalToken = context.migrationApprovalToken && this.bypassTokens.has(context.migrationApprovalToken);
    const isDBEngineer = context.role === AgentRole.DATABASE_ENGINEER || context.role === AgentRole.MASTER_ORCHESTRATOR;

    if (cmdStr.includes("db:generate") || cmdStr.includes("prisma generate") || cmdStr.includes("drizzle-kit generate")) {
      // Generation is non-destructive to live data, but gated for schema validation
      this.logEvent("MIGRATION_SAFETY", "GATED_CLIENT_GEN", { command: cmdStr, matchedPattern });
      return {
        isMigration: true,
        allowed: true,
        gated: true,
        type: "SCHEMA_GENERATE",
        warning: "Database client/types generation will run. Ensure schema file is free of syntax errors."
      };
    }

    // Destructive / Schema push or migration commands
    if (!hasDryRun && !hasApprovalToken && !isDBEngineer) {
      this.logEvent("MIGRATION_SAFETY", "BLOCKED", {
        command: cmdStr,
        reason: "Unreviewed database migration execution"
      });
      return {
        isMigration: true,
        allowed: false,
        gated: true,
        type: "DESTRUCTIVE_DDL",
        code: "MIGRATION_GATING_FAILED",
        reason: `Migration command '${cmdStr}' modifies database state. It requires a dry-run preview or explicit Database Specialist verification before applying.`
      };
    }

    this.logEvent("MIGRATION_SAFETY", "APPROVED", { command: cmdStr, hasDryRun, isDBEngineer });
    return {
      isMigration: true,
      allowed: true,
      gated: false,
      type: "MIGRATION_APPROVED"
    };
  }

  validateCommand(command, role = AgentRole.DEVELOPER) {
    const cmdStr = String(command || "").trim();

    // Check blacklist
    for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
      if (pattern.test(cmdStr)) {
        this.logEvent("COMMAND_SAFETY", "BLOCKED_DANGEROUS", { command: cmdStr });
        return {
          allowed: false,
          code: "DANGEROUS_COMMAND_BLOCKED",
          reason: `Command execution blocked: dangerous system-level command pattern detected in '${cmdStr}'.`
        };
      }
    }

    // Check git safety if command is git
    if (cmdStr.startsWith("git ") || cmdStr.includes(" git ")) {
      const gitRes = this.validateGitOperation(cmdStr);
      if (!gitRes.allowed) return gitRes;
    }

    // Check migration gating
    const migRes = this.validateMigrationCommand(cmdStr, { role });
    if (migRes.isMigration && !migRes.allowed) {
      return migRes;
    }

    this.logEvent("COMMAND_SAFETY", "ALLOWED", { command: cmdStr, role });
    return { allowed: true, code: "OK", migrationMeta: migRes.isMigration ? migRes : null };
  }

  validateFilePath(filePath, projectRoot = "") {
    if (!filePath) return { allowed: false, reason: "Empty path" };
    const normalized = path.normalize(filePath);

    // Prevent directory traversal attacks
    if (normalized.includes("..") && !normalized.startsWith(".")) {
      const resolved = path.resolve(projectRoot || process.cwd(), normalized);
      const rootResolved = path.resolve(projectRoot || process.cwd());
      if (!resolved.startsWith(rootResolved)) {
        return { allowed: false, reason: "Path traversal outside workspace root is prohibited." };
      }
    }

    // Block sensitive files
    const sensitiveFiles = [".env.production", "id_rsa", "id_ed25519", ".git/config", "passwd", "shadow", "SAM"];
    for (const s of sensitiveFiles) {
      if (normalized.toLowerCase().endsWith(s.toLowerCase())) {
        return { allowed: false, reason: `Access to sensitive file '${s}' is restricted.` };
      }
    }

    return { allowed: true };
  }
}

export const defaultSecurityPolicy = new SecurityPolicy();
