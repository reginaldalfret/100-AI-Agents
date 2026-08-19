// Admissions & Intake Management Service

const applications = [
  {
    applicationId: 'ADM-2026-001',
    applicantId: 'APP-901',
    name: 'Vikram Singh',
    email: 'vikram.singh@gmail.com',
    appliedProgram: 'B.S. Computer Science',
    entranceRank: 1420,
    highSchoolScore: 89.5,
    assignedSeatCategory: 'Merit-General',
    status: 'under_review',
    documentsSubmitted: ['DOC-8005'],
    meritScore: 91.2,
    eligibilityCheck: {
      minimumHighSchoolMet: true,
      entranceRankEligible: true,
      prerequisitesMet: true
    }
  },
  {
    applicationId: 'ADM-2026-002',
    applicantId: 'APP-902',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@gmail.com',
    appliedProgram: 'B.S. Artificial Intelligence',
    entranceRank: 840,
    highSchoolScore: 94.0,
    assignedSeatCategory: 'Merit-General',
    status: 'admitted',
    documentsSubmitted: [],
    meritScore: 95.8,
    eligibilityCheck: {
      minimumHighSchoolMet: true,
      entranceRankEligible: true,
      prerequisitesMet: true
    }
  }
];

export async function getAdmissionApplication(applicationId) {
  const app = applications.find(a => a.applicationId === applicationId || a.applicantId === applicationId);
  if (!app) throw new Error(`Admission Application ${applicationId} not found`);
  return { ...app };
}

export async function calculateMerit(applicationId) {
  const app = await getAdmissionApplication(applicationId);
  const calculatedMerit = (app.highSchoolScore * 0.4) + ((20000 - app.entranceRank) / 20000 * 100 * 0.6);
  return {
    applicationId: app.applicationId,
    applicantName: app.name,
    calculatedMeritScore: Number(calculatedMerit.toFixed(2)),
    meritCategory: calculatedMerit >= 85 ? 'High Merit Tier 1' : 'Merit Tier 2',
    eligibleForSeatAllocation: calculatedMerit >= 75
  };
}

export async function checkAdmissionEligibility(applicationId) {
  const app = await getAdmissionApplication(applicationId);
  const merit = await calculateMerit(applicationId);
  const isEligible = app.eligibilityCheck.minimumHighSchoolMet && app.eligibilityCheck.entranceRankEligible;

  return {
    applicationId: app.applicationId,
    eligible: isEligible,
    details: {
      highSchoolScore: app.highSchoolScore,
      entranceRank: app.entranceRank,
      meritScore: merit.calculatedMeritScore,
      documentsVerified: app.documentsSubmitted.length > 0
    },
    decisionRationale: isEligible 
      ? 'Applicant fulfills all entrance rank thresholds and high-school academic prerequisites.'
      : 'Applicant does not meet mandatory threshold criteria.'
  };
}

export async function getAdmissionStatus(applicationId) {
  const app = await getAdmissionApplication(applicationId);
  return {
    applicationId: app.applicationId,
    status: app.status,
    appliedProgram: app.appliedProgram,
    assignedSeatCategory: app.assignedSeatCategory
  };
}
