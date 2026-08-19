import { AdmissionVerificationWorkflow } from './admission-verification.js';
import { ScholarshipEligibilityWorkflow } from './scholarship-eligibility.js';
import { AttendanceInterventionWorkflow } from './attendance-intervention.js';
import { CourseOverrideWorkflow } from './course-override.js';
import { GraduationClearanceWorkflow } from './graduation-clearance.js';

export const WORKFLOW_DEFINITIONS = [
  AdmissionVerificationWorkflow,
  ScholarshipEligibilityWorkflow,
  AttendanceInterventionWorkflow,
  CourseOverrideWorkflow,
  GraduationClearanceWorkflow
];

export function getWorkflowDefinition(id) {
  return WORKFLOW_DEFINITIONS.find(w => w.id === id) || null;
}
