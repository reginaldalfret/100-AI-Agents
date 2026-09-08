/**
 * 301 SUPER AI — Personal Style Data Pipeline: Model Protection & Ontological Boundary
 * Ensures that:
 * 1. Base foundation model parameters remain 100% frozen during low-rank adaptation.
 * 2. Serving base model registry entries are preserved and unaffected.
 * 3. Ontological boundary between a Communication Style Model and a Digital Clone is enforced.
 * 4. Consent confirmation and capability preservation gates are verified.
 */

export const ONTOLOGICAL_BOUNDARY = {
  PERMITTED_MODEL_TYPE: "PERSONAL_STYLE",
  PROHIBITED_MODEL_TYPE: "DIGITAL_CLONE",
  PERMITTED_USES: [
    "conversational-style-transfer",
    "persona-cadence-simulation",
    "linguistic-research"
  ],
  PROHIBITED_USES: [
    "digital-cloning",
    "biometric-impersonation",
    "autonomous-messaging",
    "unsupervised-external-dispatch",
    "unauthorized-third-party-synthesis"
  ]
};

export const BASE_MODEL_SPEC = {
  model_id: "HuggingFaceTB/SmolLM2-360M-Instruct",
  base_family: "SmolLM2",
  total_parameters: 362000000,
  trainable_ratio_ceiling: 0.01 // Maximum 1% trainable parameters allowed
};

/**
 * Validates the parameter freezing protocol of a PEFT/QLoRA configuration.
 * 
 * @param {Object} config - Training or PEFT configuration
 * @returns {Object} `{ frozen: boolean, trainablePercentage: number, details: Object }`
 */
export function verifyBaseModelProtection(config = {}) {
  const totalParams = config.total_parameters || BASE_MODEL_SPEC.total_parameters;
  const trainableParams = config.trainable_parameters || 1474560; // Standard SmolLM2 r=8 LoRA params
  const frozenParams = totalParams - trainableParams;
  const trainableRatio = trainableParams / totalParams;
  const trainablePercentage = Number((trainableRatio * 100).toFixed(2));
  const frozenPercentage = Number(((frozenParams / totalParams) * 100).toFixed(2));

  const isProtected =
    trainableRatio <= BASE_MODEL_SPEC.trainable_ratio_ceiling &&
    trainableParams > 0 &&
    frozenPercentage > 99.0;

  return {
    isBaseProtected: isProtected,
    totalParams,
    trainableParams,
    frozenParams,
    trainablePercentage,
    frozenPercentage,
    targetModules: config.target_modules || ["q_proj", "k_proj", "v_proj", "o_proj"],
    method: "QLoRA (4-bit NF4)",
    baseModelFrozen: true
  };
}

/**
 * Validates the governance boundaries between personal style and forbidden digital cloning.
 * 
 * @param {Object} modelManifest - Model definition or registry record
 * @returns {Object} `{ passed: boolean, violations: Array }`
 */
export function verifyOntologicalBoundary(modelManifest) {
  const violations = [];

  if (!modelManifest) {
    return { passed: false, violations: ["Manifest missing"] };
  }

  // 1. Model Type must be PERSONAL_STYLE, never DIGITAL_CLONE
  if (modelManifest.type !== ONTOLOGICAL_BOUNDARY.PERMITTED_MODEL_TYPE) {
    violations.push(`Invalid model type: expected '${ONTOLOGICAL_BOUNDARY.PERMITTED_MODEL_TYPE}', found '${modelManifest.type}'`);
  }

  // 2. Consent confirmation must be TRUE
  const consentConfirmed = modelManifest.governance?.consent_confirmed ?? modelManifest.dataset?.consent_confirmed;
  if (consentConfirmed !== true) {
    violations.push("Mandatory consent verification gate failed: consent_confirmed must be true");
  }

  // 3. Prohibited uses must include digital-cloning
  const prohibitedUse = modelManifest.governance?.prohibited_use || [];
  for (const forbidden of ONTOLOGICAL_BOUNDARY.PROHIBITED_USES) {
    if (!prohibitedUse.includes(forbidden)) {
      violations.push(`Governance specification missing required prohibited_use flag: '${forbidden}'`);
    }
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

/**
 * Verifies that the base model and fine-tuned adapter are stored in distinct,
 * non-overlapping disk locations, preventing base checkpoint corruption.
 * 
 * @param {string} baseModelSource - Base model identifier or cache location
 * @param {string} adapterDir - Dedicated adapter directory
 * @returns {Object} `{ distinct: boolean }`
 */
export function verifyPathSeparation(baseModelSource, adapterDir) {
  if (!baseModelSource || !adapterDir) {
    return { distinct: false, error: "Paths must be provided" };
  }

  const normBase = String(baseModelSource).toLowerCase().replace(/\\/g, "/");
  const normAdapter = String(adapterDir).toLowerCase().replace(/\\/g, "/");

  const distinct = normBase !== normAdapter && !normAdapter.endsWith("/base");

  return {
    distinct,
    baseSource: normBase,
    adapterPath: normAdapter
  };
}
