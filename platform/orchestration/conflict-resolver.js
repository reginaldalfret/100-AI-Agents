/**
 * Super AI Platform — Evidence-Based Conflict Resolver
 * Resolves discrepancies, conflicting file edits, architectural divergence, and factual contradictions
 * across multi-agent specialist outputs using evidence quality, empirical validation, and domain authority weighting.
 */

export const ConflictType = Object.freeze({
  CODE_DIFF_CONFLICT: "CODE_DIFF_CONFLICT",
  FACTUAL_DISCREPANCY: "FACTUAL_DISCREPANCY",
  ARCHITECTURE_CONFLICT: "ARCHITECTURE_CONFLICT",
  SCHEMA_MIGRATION_CONFLICT: "SCHEMA_MIGRATION_CONFLICT",
  SECURITY_DECISION_CONFLICT: "SECURITY_DECISION_CONFLICT",
  VERIFICATION_DISAGREEMENT: "VERIFICATION_DISAGREEMENT"
});

export const DOMAIN_AUTHORITY_WEIGHTS = {
  "security_auditor": {
    [ConflictType.SECURITY_DECISION_CONFLICT]: 1.0,
    [ConflictType.CODE_DIFF_CONFLICT]: 0.8,
    [ConflictType.ARCHITECTURE_CONFLICT]: 0.7,
    [ConflictType.FACTUAL_DISCREPANCY]: 0.7
  },
  "database_engineer": {
    [ConflictType.SCHEMA_MIGRATION_CONFLICT]: 1.0,
    [ConflictType.ARCHITECTURE_CONFLICT]: 0.85,
    [ConflictType.CODE_DIFF_CONFLICT]: 0.75,
    [ConflictType.FACTUAL_DISCREPANCY]: 0.8
  },
  "qa_engineer": {
    [ConflictType.VERIFICATION_DISAGREEMENT]: 1.0,
    [ConflictType.FACTUAL_DISCREPANCY]: 0.9,
    [ConflictType.CODE_DIFF_CONFLICT]: 0.8
  },
  "architect": {
    [ConflictType.ARCHITECTURE_CONFLICT]: 1.0,
    [ConflictType.SCHEMA_MIGRATION_CONFLICT]: 0.85,
    [ConflictType.CODE_DIFF_CONFLICT]: 0.8,
    [ConflictType.SECURITY_DECISION_CONFLICT]: 0.75
  },
  "developer": {
    [ConflictType.CODE_DIFF_CONFLICT]: 0.85,
    [ConflictType.FACTUAL_DISCREPANCY]: 0.7,
    [ConflictType.ARCHITECTURE_CONFLICT]: 0.6
  },
  "docs_writer": {
    [ConflictType.FACTUAL_DISCREPANCY]: 0.75,
    [ConflictType.CODE_DIFF_CONFLICT]: 0.5
  },
  "master_orchestrator": {
    [ConflictType.CODE_DIFF_CONFLICT]: 0.9,
    [ConflictType.FACTUAL_DISCREPANCY]: 0.9,
    [ConflictType.ARCHITECTURE_CONFLICT]: 0.95,
    [ConflictType.SCHEMA_MIGRATION_CONFLICT]: 0.9,
    [ConflictType.SECURITY_DECISION_CONFLICT]: 0.9,
    [ConflictType.VERIFICATION_DISAGREEMENT]: 0.95
  }
};

export class ConflictResolver {
  constructor(options = {}) {
    this.strictMode = Boolean(options.strictMode);
    this.resolutionHistory = [];
  }

  getHistory() {
    return [...this.resolutionHistory];
  }

  /**
   * Detect potential conflicts across a set of specialist outputs
   * @param {Array<{ agentId: string, role?: string, output: any, evidence?: any[] }>} specialistOutputs
   */
  detectConflicts(specialistOutputs = []) {
    const conflicts = [];
    if (!Array.isArray(specialistOutputs) || specialistOutputs.length < 2) {
      return conflicts;
    }

    // 1. Check for conflicting file proposals/edits
    const fileEdits = new Map(); // filePath -> Array<{ agentId, role, code, timestamp }>
    for (const item of specialistOutputs) {
      const out = item.output || {};
      const files = out.files || out.artifacts || (out.file ? [out] : []);
      if (Array.isArray(files)) {
        for (const f of files) {
          const filePath = f.path || f.filename || f.filePath;
          if (filePath) {
            if (!fileEdits.has(filePath)) fileEdits.set(filePath, []);
            fileEdits.get(filePath).push({
              agentId: item.agentId,
              role: item.role || "developer",
              content: f.content || f.code || "",
              confidence: item.confidence ?? 0.8,
              evidence: item.evidence || []
            });
          }
        }
      }
    }

    for (const [filePath, proposals] of fileEdits.entries()) {
      if (proposals.length > 1) {
        // Check if content differs
        const uniqueContents = new Set(proposals.map(p => p.content.trim()));
        if (uniqueContents.size > 1) {
          conflicts.push({
            id: `conf-file-${Date.now()}-${conflicts.length + 1}`,
            type: ConflictType.CODE_DIFF_CONFLICT,
            subject: filePath,
            proposals,
            description: `Multiple specialists produced differing content for file '${filePath}'.`
          });
        }
      }
    }

    // 2. Check for security or risk evaluation disagreements
    const securityDecisions = specialistOutputs.filter(
      s => s.output?.isSecure !== undefined || s.output?.securityRisk !== undefined || s.output?.passedSecurity !== undefined
    );
    if (securityDecisions.length > 1) {
      const distinct = new Set(
        securityDecisions.map(s => s.output.isSecure ?? s.output.passedSecurity ?? s.output.securityRisk)
      );
      if (distinct.size > 1) {
        conflicts.push({
          id: `conf-sec-${Date.now()}-${conflicts.length + 1}`,
          type: ConflictType.SECURITY_DECISION_CONFLICT,
          subject: "security_assessment",
          proposals: securityDecisions.map(s => ({
            agentId: s.agentId,
            role: s.role || "security_auditor",
            decision: s.output.isSecure ?? s.output.passedSecurity ?? s.output.securityRisk,
            confidence: s.confidence ?? 0.85,
            evidence: s.evidence || []
          })),
          description: `Disagreement detected on security and risk assessment.`
        });
      }
    }

    // 3. Check for architectural pattern disagreements
    const archDecisions = specialistOutputs.filter(
      s => s.output?.architecture || s.output?.pattern || s.output?.schemaType
    );
    if (archDecisions.length > 1) {
      const distinctArch = new Set(archDecisions.map(s => s.output.architecture || s.output.pattern || s.output.schemaType));
      if (distinctArch.size > 1) {
        conflicts.push({
          id: `conf-arch-${Date.now()}-${conflicts.length + 1}`,
          type: ConflictType.ARCHITECTURE_CONFLICT,
          subject: "system_architecture",
          proposals: archDecisions.map(s => ({
            agentId: s.agentId,
            role: s.role || "architect",
            pattern: s.output.architecture || s.output.pattern || s.output.schemaType,
            confidence: s.confidence ?? 0.8,
            evidence: s.evidence || []
          })),
          description: `Architectural divergence detected across specialists.`
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolve a specific conflict using evidence scoring and domain authority
   */
  resolveConflict(conflict) {
    const { type, subject, proposals } = conflict;
    let highestScore = -1;
    let winner = null;
    let rationale = "";
    const evidenceTrace = [];

    for (const proposal of proposals) {
      let score = 0;
      const role = proposal.role || "developer";
      const authorityWeight = DOMAIN_AUTHORITY_WEIGHTS[role]?.[type] || 0.6;
      score += authorityWeight * 40;

      // Confidence factor
      const confidence = typeof proposal.confidence === "number" ? proposal.confidence : 0.8;
      score += confidence * 30;

      // Evidence factor
      if (Array.isArray(proposal.evidence) && proposal.evidence.length > 0) {
        let empiricalEvidenceCount = 0;
        let citationEvidenceCount = 0;

        for (const ev of proposal.evidence) {
          if (ev.category === "test_result" || ev.category === "empirical_benchmark" || ev.category === "linter") {
            empiricalEvidenceCount++;
          } else if (ev.citation || ev.doc_id) {
            citationEvidenceCount++;
          }
        }

        score += Math.min(empiricalEvidenceCount * 15, 30);
        score += Math.min(citationEvidenceCount * 5, 10);
      }

      // Security preference: if security conflict, choose the safer (more restrictive) option if scores are close
      if (type === ConflictType.SECURITY_DECISION_CONFLICT) {
        if (proposal.decision === false || proposal.decision === "HIGH" || proposal.decision === "FAIL") {
          score += 10; // Conservative safety bias
        }
      }

      evidenceTrace.push({
        agentId: proposal.agentId,
        role,
        score: Math.round(score * 100) / 100,
        authorityWeight,
        confidence,
        evidenceCount: (proposal.evidence || []).length
      });

      if (score > highestScore) {
        highestScore = score;
        winner = proposal;
      }
    }

    rationale = `Resolved ${type} on '${subject}' in favor of ${winner.agentId} (${winner.role}) with composite evidence score ${highestScore.toFixed(1)}.`;

    const resolutionResult = {
      conflictId: conflict.id,
      type,
      subject,
      resolved: true,
      winningAgentId: winner.agentId,
      winningRole: winner.role,
      winningProposal: winner,
      compositeScore: highestScore,
      rationale,
      evidenceTrace,
      timestamp: new Date().toISOString()
    };

    this.resolutionHistory.push(resolutionResult);
    return resolutionResult;
  }

  /**
   * Process all outputs, detect conflicts, resolve them, and return a harmonized output set
   */
  resolveAll(specialistOutputs = []) {
    const detectedConflicts = this.detectConflicts(specialistOutputs);
    const resolutions = detectedConflicts.map(c => this.resolveConflict(c));

    // Build unified map of chosen file contents and decisions
    const resolvedFiles = new Map();
    for (const res of resolutions) {
      if (res.type === ConflictType.CODE_DIFF_CONFLICT && res.winningProposal) {
        resolvedFiles.set(res.subject, res.winningProposal.content);
      }
    }

    return {
      conflictsFound: detectedConflicts.length,
      conflicts: detectedConflicts,
      resolutions,
      resolvedFiles: Object.fromEntries(resolvedFiles.entries()),
      summary: resolutions.map(r => r.rationale)
    };
  }
}

export const defaultConflictResolver = new ConflictResolver();
