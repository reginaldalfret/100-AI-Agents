import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { routeTaskToLocalModel } from '../../platform/models/model-router.js';
import { LOCAL_MODELS } from '../../platform/models/model-registry.js';
import { classifyTask, TaskType } from '../../platform/models/task-classifier.js';

describe('Model Routing & Task Dispatch Test Suite', () => {
  describe('Semantic Auto-Routing', () => {
    it('auto-routes python coding tasks to local-code-specialist (Qwen Coder)', async () => {
      const res = await routeTaskToLocalModel({
        prompt: 'Write a Python script function to parse telemetry CSV and calculate standard deviation'
      });
      assert.equal(res.selected_model, 'local-code-specialist');
      assert.equal(res.modality, 'code');
      assert.equal(res.is_air_gapped, true);
    });

    it('auto-routes visual photo and defect inspection tasks through OCR/Nemotron reasoning', async () => {
      const res = await routeTaskToLocalModel({
        prompt: 'Analyze photograph of pump casing crack defect and assess corrosion severity'
      });
      assert.equal(res.selected_model, 'local-vision-ocr');
      assert.equal(res.modality, 'vision');
    });

    it('auto-routes scanned document OCR tasks to local-vision-ocr', async () => {
      const res = await routeTaskToLocalModel({
        prompt: 'Perform OCR scan extraction on scanned maintenance work order PDF'
      });
      assert.equal(res.selected_model, 'local-vision-ocr');
      assert.equal(res.modality, 'ocr');
    });

    it('auto-routes general epistemic reasoning, SOPs, and governance to nemotron-3-nano', async () => {
      const res = await routeTaskToLocalModel({
        prompt: 'Synthesize standard operating procedure for cryogenic storage tank pressure relief'
      });
      assert.equal(res.selected_model, 'nemotron-3-nano');
      assert.equal(res.modality, 'text');
    });

    it('routes based on attached file metadata', async () => {
      const imageTask = classifyTask({
        task: 'Assess condition',
        attachments: [{ name: 'heat_exchanger_flange.png', type: 'image/png' }]
      });
      assert.equal(imageTask.preferred_model_id, 'local-vision-ocr');
      assert.equal(imageTask.task_type, TaskType.VISION_MULTIMODAL);

      const codeTask = classifyTask({
        task: 'Process script',
        attachments: [{ name: 'pipeline_data.csv', type: 'text/csv' }]
      });
      assert.equal(codeTask.preferred_model_id, 'local-code-specialist');
      assert.equal(codeTask.task_type, TaskType.CODING_SANDBOX);
    });
  });

  describe('Manual Model Mode Routing', () => {
    const modes = [
      { mode: 'gemma', expectedModel: 'gemma3-1b' },
      { mode: 'gemma3', expectedModel: 'gemma3-1b' },
      { mode: 'qwen', expectedModel: 'local-code-specialist' },
      { mode: 'nemotron', expectedModel: 'nemotron-3-nano' },
      { mode: 'llama', expectedModel: 'llama3.2-1b' },
      { mode: 'granite', expectedModel: 'granite4-1b-h' },
      { mode: 'phi', expectedModel: 'phi4-mini' },
      { mode: 'smollm', expectedModel: 'smollm2-1.7b' },
      { mode: 'smollm2', expectedModel: 'smollm2-1.7b' },
      { mode: 'lfm', expectedModel: 'lfm2.5-350m' },
      { mode: 'lfm2.5', expectedModel: 'lfm2.5-350m' },
      { mode: 'lfm2.5-350m', expectedModel: 'lfm2.5-350m' },
      { mode: 'rwkv', expectedModel: 'rwkv7-0.4b' },
      { mode: 'rwkv7', expectedModel: 'rwkv7-0.4b' },
      { mode: 'rwkv7-0.4b', expectedModel: 'rwkv7-0.4b' }
    ];

    for (const { mode, expectedModel } of modes) {
      it(`routes modelMode "${mode}" strictly to ${expectedModel}`, async () => {
        const res = await routeTaskToLocalModel({
          modelMode: mode,
          prompt: 'General task prompt'
        });
        assert.equal(res.selected_model, expectedModel);
      });
    }
  });

  describe('Explicit Model Override Precedence', () => {
    const overrides = [
      { override: 'gemma3:1b', expected: 'gemma3-1b' },
      { override: 'gemma3-1b', expected: 'gemma3-1b' },
      { override: 'qwen2.5-coder:1.5b', expected: 'local-code-specialist' },
      { override: 'local-code-specialist', expected: 'local-code-specialist' },
      { override: 'nemotron-3-nano', expected: 'nemotron-3-nano' },
      { override: 'nemotron-3-nano:latest', expected: 'nemotron-3-nano' },
      { override: 'llama3.2:1b', expected: 'llama3.2-1b' },
      { override: 'llama3.2-1b', expected: 'llama3.2-1b' },
      { override: 'granite4:1b-h', expected: 'granite4-1b-h' },
      { override: 'granite4-1b-h', expected: 'granite4-1b-h' },
      { override: 'phi4-mini', expected: 'phi4-mini' },
      { override: 'phi4', expected: 'phi4-mini' },
      { override: 'smollm2:1.7b', expected: 'smollm2-1.7b' },
      { override: 'smollm2-1.7b', expected: 'smollm2-1.7b' },
      { override: 'smollm2', expected: 'smollm2-1.7b' },
      { override: 'smollm', expected: 'smollm2-1.7b' },
      { override: 'LiquidAI/lfm2.5-350m', expected: 'lfm2.5-350m' },
      { override: 'LiquidAI/lfm2.5-350m:latest', expected: 'lfm2.5-350m' },
      { override: 'lfm2.5-350m', expected: 'lfm2.5-350m' },
      { override: 'lfm', expected: 'lfm2.5-350m' },
      { override: 'mollysama/rwkv-7-g1d:0.4b', expected: 'rwkv7-0.4b' },
      { override: 'rwkv7-0.4b', expected: 'rwkv7-0.4b' },
      { override: 'rwkv7', expected: 'rwkv7-0.4b' },
      { override: 'rwkv', expected: 'rwkv7-0.4b' }
    ];

    for (const { override, expected } of overrides) {
      it(`routes explicit override "${override}" strictly to ${expected}`, async () => {
        const res = await routeTaskToLocalModel({
          model_override: override,
          prompt: 'Task prompt with contradictory keywords python code scan ocr'
        });
        assert.equal(res.selected_model, expected);
      });
    }

    it('override takes precedence over conflicting modelMode', async () => {
      const res = await routeTaskToLocalModel({
        modelMode: 'llama',
        model_override: 'phi4-mini',
        prompt: 'Analyze equation'
      });
      assert.equal(res.selected_model, 'phi4-mini');
    });
  });

  describe('Sovereign Egress & Air-Gapped Guarantees', () => {
    it('verifies all routing responses maintain 0 external calls and air-gapped isolation', async () => {
      const modelsToTest = ['gemma3-1b', 'local-code-specialist', 'nemotron-3-nano', 'llama3.2-1b', 'granite4-1b-h', 'phi4-mini', 'smollm2-1.7b', 'lfm2.5-350m', 'rwkv7-0.4b'];
      for (const modelId of modelsToTest) {
        const res = await routeTaskToLocalModel({ model_override: modelId, prompt: 'Verification ping' });
        assert.equal(res.external_calls, 0);
        assert.equal(res.is_air_gapped, true);
        assert.equal(res.is_sovereign_local, true);
        assert.ok(res.hardware_footprint.vram_mb <= 4096);
      }
    });
  });
});
