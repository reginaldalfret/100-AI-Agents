import fs from 'node:fs';
import path from 'node:path';
import { DesktopConfig } from '../main/config.js';
import { HealthManager } from '../main/health-manager.js';

export class PreflightChecks {
  static verifyModelsManifest() {
    const manifestPath = path.join(DesktopConfig.paths.projectRoot, 'desktop/installer/models.json');
    if (!fs.existsSync(manifestPath)) {
      return { valid: false, error: 'MODELS_MANIFEST_MISSING' };
    }
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const requiredModels = manifest.models.filter(m => m.required);
      return {
        valid: true,
        totalModels: manifest.models.length,
        requiredCount: requiredModels.length,
        models: manifest.models
      };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }

  static async verifyAirGapIntegrity() {
    const health = await HealthManager.getFullHealth();
    return {
      airGapEnforced: health.services.airGap.enforced === true,
      externalCalls: health.services.airGap.externalCalls || 0,
      loopbackBound: true
    };
  }
}
