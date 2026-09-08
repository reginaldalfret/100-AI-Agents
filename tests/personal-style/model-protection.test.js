import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  verifyBaseModelProtection,
  verifyOntologicalBoundary,
  verifyPathSeparation,
  BASE_MODEL_SPEC,
  ONTOLOGICAL_BOUNDARY
} from "../../platform/personal-style/model-protection.js";
import { getTrainableModelById } from "../../platform/finetuning/trainable-model-registry.js";

describe("Base Model Protection & Ontological Boundary Suite", () => {
  it("should verify base model parameters are > 99% frozen with < 1% trainable LoRA parameters", () => {
    const protection = verifyBaseModelProtection({
      total_parameters: 362000000,
      trainable_parameters: 1474560,
      target_modules: ["q_proj", "k_proj", "v_proj", "o_proj"]
    });

    assert.equal(protection.isBaseProtected, true, "Base model must be certified protected");
    assert.equal(protection.baseModelFrozen, true);
    assert.ok(protection.trainablePercentage < 1.0, `Trainable % must be < 1%, got ${protection.trainablePercentage}%`);
    assert.ok(protection.frozenPercentage > 99.0, `Frozen % must be > 99%, got ${protection.frozenPercentage}%`);
    assert.equal(protection.trainableParams, 1474560);
    assert.equal(protection.frozenParams, 360525440);
  });

  it("should fail protection check if full fine-tuning or excessive parameters are unfrozen", () => {
    const unconstrained = verifyBaseModelProtection({
      total_parameters: 362000000,
      trainable_parameters: 362000000 // 100% unfrozen (Full fine-tune)
    });

    assert.equal(unconstrained.isBaseProtected, false, "Full fine-tuning should fail base protection check");
  });

  it("should strictly enforce the ontological boundary: PERSONAL_STYLE permitted, DIGITAL_CLONE prohibited", () => {
    const validManifest = {
      model_id: "301-kaviya-style-v1",
      type: ONTOLOGICAL_BOUNDARY.PERMITTED_MODEL_TYPE,
      governance: {
        consent_confirmed: true,
        prohibited_use: [
          "digital-cloning",
          "biometric-impersonation",
          "autonomous-messaging",
          "unsupervised-external-dispatch",
          "unauthorized-third-party-synthesis"
        ],
        allowed_use: [
          "conversational-style-transfer",
          "persona-cadence-simulation",
          "linguistic-research"
        ]
      }
    };

    const audit = verifyOntologicalBoundary(validManifest);
    assert.equal(audit.passed, true, `Valid manifest must pass audit: ${JSON.stringify(audit.violations)}`);
    assert.equal(audit.violations.length, 0);

    // Corrupted manifest pretending to be a digital clone
    const cloneManifest = {
      model_id: "prohibited-clone-v1",
      type: "DIGITAL_CLONE",
      governance: {
        consent_confirmed: true,
        prohibited_use: []
      }
    };

    const cloneAudit = verifyOntologicalBoundary(cloneManifest);
    assert.equal(cloneAudit.passed, false, "Digital clone manifest must be rejected");
    assert.ok(cloneAudit.violations.some(v => v.includes("Invalid model type")));
    assert.ok(cloneAudit.violations.some(v => v.includes("missing required prohibited_use")));
  });

  it("should fail ontological boundary audit if mandatory consent is unconfirmed", () => {
    const unconfirmedManifest = {
      model_id: "301-kaviya-style-v1",
      type: ONTOLOGICAL_BOUNDARY.PERMITTED_MODEL_TYPE,
      governance: {
        consent_confirmed: false, // Revoked or not confirmed
        prohibited_use: ONTOLOGICAL_BOUNDARY.PROHIBITED_USES
      }
    };

    const audit = verifyOntologicalBoundary(unconfirmedManifest);
    assert.equal(audit.passed, false, "Unconfirmed consent must fail audit");
    assert.ok(audit.violations.some(v => v.includes("consent verification gate failed")));
  });

  it("should verify path separation between base model cache and fine-tuned adapter directory", () => {
    const baseModelSource = "models/cache/huggingface/hub/models--HuggingFaceTB--SmolLM2-360M-Instruct";
    const adapterDir = "models/fine-tuned/personal-style/kaviya-style-v1/adapter";

    const pathCheck = verifyPathSeparation(baseModelSource, adapterDir);
    assert.equal(pathCheck.distinct, true, "Base cache and fine-tuned adapter directory must be distinct");
  });

  it("should confirm trainable base model family exists in platform trainable model registry", () => {
    const smollmBase = getTrainableModelById("smollm2-1.7b") || getTrainableModelById("smollm");
    assert.ok(smollmBase, "SmolLM2 model family must exist in trainable model registry");
    assert.equal(smollmBase.trainable, true);
    assert.equal(smollmBase.base_family, "SmolLM2");
    assert.equal(smollmBase.recommended_method, "QLoRA");
  });
});
