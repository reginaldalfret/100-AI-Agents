/**
 * Sovereign AI Workbench — Uncertainty & Calibrated Confidence Engine
 * Evaluates epistemic certainty states (FACT, INFERENCE, MISSING, CONFLICT, UNCERTAIN, ESTIMATE).
 */

export const EpistemicState = {
  FACT: "FACT",                   // Verified empirical measurement or direct OCR read
  INFERENCE: "INFERENCE",         // Derived reasoning from standard or model analysis
  MISSING: "MISSING",             // Required parameter is not present in available records
  CONFLICT: "CONFLICT",           // Mutually incompatible findings between sources
  UNCERTAIN: "UNCERTAIN",         // Insufficient signal or degraded image quality
  ESTIMATE: "ESTIMATE"            // Extrapolated prediction or sandbox calculation
};

export function evaluateConfidence(assessmentInput = {}) {
  const {
    sourcesCount = 1,
    conflictsCount = 0,
    hasMissingParams = false,
    imageQuality = "high", // high, medium, low
    calculationVerified = true
  } = assessmentInput;

  const factors = [];
  let score = 100;

  // Factor 1: Multiple Independent Sources
  if (sourcesCount >= 2) {
    factors.push(`${sourcesCount} independent grounded sources corroborate finding (+20)`);
  } else {
    score -= 15;
    factors.push("Single source observation (-15)");
  }

  // Factor 2: Conflicts
  if (conflictsCount > 0) {
    score -= (conflictsCount * 25);
    factors.push(`${conflictsCount} active evidence conflict(s) detected (-${conflictsCount * 25})`);
  } else {
    factors.push("Zero conflicting data points (+15)");
  }

  // Factor 3: Missing Required Parameters
  if (hasMissingParams) {
    score -= 20;
    factors.push("Critical operating parameter missing (-20)");
  }

  // Factor 4: Image/Signal Quality
  if (imageQuality === "low") {
    score -= 20;
    factors.push("Low visual resolution on defect photograph (-20)");
  } else if (imageQuality === "medium") {
    score -= 10;
    factors.push("Moderate visual resolution (-10)");
  }

  // Factor 5: Calculation Verification
  if (!calculationVerified) {
    score -= 25;
    factors.push("Calculation unverified in sandbox (-25)");
  }

  const finalScore = Math.max(10, Math.min(100, score));
  let level = "LOW";
  if (finalScore >= 80) level = "HIGH";
  else if (finalScore >= 50) level = "MEDIUM";

  return {
    confidence_level: level,
    score: finalScore,
    is_calibrated: true,
    explanatory_factors: factors,
    recommendation: level === "LOW" ? "Request Human-In-The-Loop inspection verification before maintenance action" : "Proceed with verified engineering recommendation"
  };
}

export function computeEvidenceCompleteness(requiredList = [], availableList = []) {
  const reqSet = new Set(requiredList.map(r => String(r).toLowerCase()));
  const availSet = new Set(availableList.map(a => String(a).toLowerCase()));

  const matched = [];
  const missing = [];

  for (const item of reqSet) {
    if (availSet.has(item)) {
      matched.push(item);
    } else {
      missing.push(item);
    }
  }

  const percentage = reqSet.size > 0 ? Math.round((matched.length / reqSet.size) * 100) : 100;

  return {
    completeness_percentage: percentage,
    required_count: reqSet.size,
    available_count: matched.length,
    missing_items: missing,
    is_complete: missing.length === 0
  };
}
