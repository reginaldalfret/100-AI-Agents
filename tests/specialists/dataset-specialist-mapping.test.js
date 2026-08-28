/**
 * tests/specialists/dataset-specialist-mapping.test.js
 * 
 * Verifies that dataset files and metadata automatically classify
 * to the appropriate specialist:
 * - Cybersecurity dataset -> CYBERSECURITY
 * - Healthcare dataset -> HEALTHCARE
 * - Ambiguous dataset -> UNKNOWN (with explicit 2 options)
 */

import assert from 'node:assert';
import { detectDatasetDomain, SpecialistDomain } from '../../platform/specialists/specialist-manager.js';

console.log('Running: tests/specialists/dataset-specialist-mapping.test.js');

// 1. Cyber filename & headers
const cyberDet = detectDatasetDomain(
  'cve_vulnerability_soc_logs.csv',
  ['incident_id', 'cve_id', 'threat_level', 'ip_address', 'attack_vector']
);
assert.strictEqual(cyberDet.domain, SpecialistDomain.CYBERSECURITY);
assert.strictEqual(cyberDet.specialist.model, 'babar_jamali/qwen3-1.7b-cyber:latest');

// 2. Healthcare filename & headers
const healthDet = detectDatasetDomain(
  'patient_clinical_diagnosis_cases.xlsx',
  ['patient_id', 'symptom_summary', 'diagnosis_code', 'vital_signs', 'treatment']
);
assert.strictEqual(healthDet.domain, SpecialistDomain.HEALTHCARE);
assert.strictEqual(healthDet.specialist.model, 'medgemma:4b-it-q4_K_M');

// 3. Ambiguous dataset fallback
const unknownDet = detectDatasetDomain(
  'generic_raw_records.csv',
  ['col_a', 'col_b', 'col_c']
);
assert.strictEqual(unknownDet.domain, 'UNKNOWN');
assert.strictEqual(unknownDet.options.length, 2);
assert.ok(unknownDet.options.includes('cybersecurity'));
assert.ok(unknownDet.options.includes('healthcare'));

console.log('✓ tests/specialists/dataset-specialist-mapping.test.js passed successfully.');
