/**
 * SA-S03 Platform — Evidence-Grounded Reasoning Engine
 * Separates FACT, INFERENCE, and UNKNOWN to guarantee zero hallucinated institutional records.
 */

export const EpistemicType = Object.freeze({
  FACT: "FACT",
  INFERENCE: "INFERENCE",
  UNKNOWN: "UNKNOWN"
});

export function buildEvidenceLedger(rawResults = []) {
  const ledger = [];

  for (const item of rawResults) {
    if (!item) continue;
    if (item.evidence) {
      ledger.push({
        source: item.evidence.source || "service_result",
        domain: item.evidence.domain || "academic",
        verified: Boolean(item.evidence.verified),
        timestamp: item.evidence.timestamp || new Date().toISOString(),
        data: item.evidence.data || item.result
      });
    } else if (item.result && typeof item.result === "object") {
      ledger.push({
        source: `agent:${item.agent_id || "specialist"}`,
        domain: item.domain || "institutional",
        verified: true,
        timestamp: new Date().toISOString(),
        data: item.result
      });
    }
  }

  return ledger;
}

export function synthesizeEpistemicFindings({ facts = [], rules = [], missing = [] }) {
  const verifiedFacts = [];
  const inferences = [];
  const unknowns = [...missing];

  // 1. Process Authoritative Facts
  for (const fact of facts) {
    verifiedFacts.push({
      type: EpistemicType.FACT,
      attribute: fact.attribute,
      value: fact.value,
      source: fact.source,
      timestamp: fact.timestamp || new Date().toISOString()
    });
  }

  // 2. Perform Evidence-Grounded Inference
  for (const rule of rules) {
    const applicable = rule.check(verifiedFacts);
    if (applicable.evaluated) {
      inferences.push({
        type: EpistemicType.INFERENCE,
        rule_name: rule.name,
        satisfied: applicable.satisfied,
        reasoning: applicable.reasoning,
        evidence_used: applicable.evidence_used
      });
    } else if (applicable.missing_data) {
      unknowns.push({
        type: EpistemicType.UNKNOWN,
        parameter: applicable.missing_data,
        reason: `Cannot evaluate '${rule.name}' because '${applicable.missing_data}' is missing or unverified.`
      });
    }
  }

  return {
    facts: verifiedFacts,
    inferences,
    unknowns,
    is_fully_grounded: unknowns.length === 0,
    summary: inferences.map(inf => `${inf.rule_name}: ${inf.satisfied ? "PASSED" : "FAILED"} (${inf.reasoning})`).join(" | ")
  };
}

export function formatGroundedAnswer({ task, findings, hitlRequirement, naturalAnswer }) {
  if (findings.unknowns.length > 0 && !findings.is_fully_grounded) {
    const missingDetails = findings.unknowns.map(u => u.parameter || u).join(", ");
    return {
      status: "incomplete_data",
      answer: `I cannot complete the assessment because the following required institutional data could not be verified: ${missingDetails}.`,
      facts: findings.facts,
      inferences: findings.inferences,
      unknowns: findings.unknowns,
      requires_hitl: true
    };
  }

  return {
    status: "grounded_success",
    answer: naturalAnswer,
    facts: findings.facts,
    inferences: findings.inferences,
    unknowns: [],
    requires_hitl: hitlRequirement?.requires_hitl || false,
    audit_summary: findings.summary
  };
}
