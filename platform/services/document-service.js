// Document Intelligence Service with Multimodal Vision/OCR Extraction Abstraction

const documentStore = [
  {
    documentId: 'DOC-8001',
    studentId: 'STU-1001',
    documentType: 'high_school_transcript',
    filename: 'aarav_sharma_12th_transcript.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1048576,
    uploadedAt: '2025-08-10T10:00:00Z',
    status: 'verified',
    extractedData: {
      institution: 'National Higher Secondary School',
      completionYear: 2024,
      overallPercentage: 92.4,
      mathScore: 95,
      physicsScore: 90,
      chemistryScore: 92
    },
    verificationHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    tamperDetected: false
  },
  {
    documentId: 'DOC-8002',
    studentId: 'STU-1002',
    documentType: 'income_certificate',
    filename: 'priya_patel_income_cert_2026.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 524288,
    uploadedAt: '2026-01-20T14:30:00Z',
    status: 'verified',
    extractedData: {
      issuingAuthority: 'Tahsildar Revenue Office - Zone 4',
      certificateNumber: 'REV/INC/2026/09482',
      beneficiaryName: 'Priya Patel',
      fatherName: 'Kishore Patel',
      annualHouseholdIncome: 28000,
      incomeCurrency: 'USD',
      issueDate: '2026-01-15',
      validUntil: '2027-03-31'
    },
    verificationHash: 'sha256:9b73c26781fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9011',
    tamperDetected: false
  },
  {
    documentId: 'DOC-8005',
    studentId: 'STU-1005',
    documentType: 'admission_application_dossier',
    filename: 'vikram_singh_application_dossier.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2097152,
    uploadedAt: '2026-02-01T09:15:00Z',
    status: 'pending_verification',
    extractedData: {
      applicantName: 'Vikram Singh',
      entranceExam: 'JEE Advanced',
      entranceRank: 1420,
      highSchoolPercentage: 89.5,
      selectedProgram: 'B.S. Computer Science'
    },
    verificationHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    tamperDetected: false
  },
  {
    documentId: 'DOC-DEMO-001-MARKSHEET',
    studentId: 'STU-DEMO-001',
    documentType: 'high_school_transcript',
    filename: 'demo_student_official_mark_sheet.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 819200,
    uploadedAt: '2026-08-15T11:00:00Z',
    status: 'verified',
    extractedData: {
      studentName: 'Demosthenes Rao',
      institution: 'Metropolitan High School',
      gpa: 3.90,
      marksPercentage: 94.2,
      majorSubjects: ['Mathematics (98)', 'Computer Science (96)', 'Physics (92)']
    },
    verificationHash: 'sha256:d8f7e2c9001bfa8291a1829cd8823491fa30281baf92384102948201948201aa',
    tamperDetected: false
  },
  {
    documentId: 'DOC-DEMO-001-INCOME',
    studentId: 'STU-DEMO-001',
    documentType: 'income_certificate',
    filename: 'demo_student_income_certificate.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 412000,
    uploadedAt: '2026-08-15T11:05:00Z',
    status: 'verified',
    extractedData: {
      beneficiaryName: 'Demosthenes Rao',
      annualHouseholdIncome: 32000,
      currency: 'USD',
      issuingAuthority: 'Department of Revenue & Social Welfare',
      certificateNo: 'REV-GOV-2026-88392',
      verificationStatus: 'AUTHENTIC'
    },
    verificationHash: 'sha256:39a82019fba8201948201948201948201948201948201948201948201948201b',
    tamperDetected: false
  },
  {
    documentId: 'DOC-CONFLICT-001',
    studentId: 'STU-1003',
    documentType: 'income_certificate',
    filename: 'rohan_mehta_conflicting_income.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 524288,
    uploadedAt: '2026-08-18T10:00:00Z',
    status: 'conflict_detected',
    extractedData: {
      beneficiaryName: 'Rohan Mehta',
      annualHouseholdIncome: 120000, // Conflicting with Database $180,000
      declaredDatabaseIncome: 180000
    },
    verificationHash: 'sha256:conflict89218392183921839218392183921839218392183921839218392183',
    tamperDetected: false
  },
  {
    documentId: 'DOC-CORRUPT-001',
    studentId: 'STU-1005',
    documentType: 'corrupted_file',
    filename: 'corrupted_file.bin',
    mimeType: 'application/octet-stream',
    sizeBytes: 128,
    uploadedAt: '2026-08-19T00:00:00Z',
    status: 'error_unreadable',
    extractedData: null,
    verificationHash: null,
    tamperDetected: true
  }
];

export async function getDocument(documentId) {
  const doc = documentStore.find(d => d.documentId === documentId);
  if (!doc) throw new Error(`Document ${documentId} not found`);
  return { ...doc };
}

export async function getDocumentsByStudent(studentId) {
  return documentStore.filter(d => d.studentId === studentId);
}

export async function classifyDocument({ filename, mimeType, sampleBase64 }) {
  const name = (filename || '').toLowerCase();
  let documentType = 'general_institutional_document';
  let confidence = 0.95;

  if (name.includes('transcript') || name.includes('marksheet')) {
    documentType = 'academic_transcript';
  } else if (name.includes('income') || name.includes('salary')) {
    documentType = 'income_certificate';
  } else if (name.includes('id') || name.includes('passport') || name.includes('aadhar')) {
    documentType = 'government_id';
  } else if (name.includes('application') || name.includes('dossier')) {
    documentType = 'admission_application_dossier';
  } else if (name.includes('receipt') || name.includes('fee')) {
    documentType = 'fee_receipt';
  }

  const isSupported = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'].includes(mimeType || 'application/pdf');

  return {
    documentType,
    confidence,
    mimeType: mimeType || 'application/pdf',
    isSupported,
    status: isSupported ? 'VALID' : 'UNSUPPORTED_FILE_TYPE'
  };
}

export async function extractDocumentData(documentId) {
  const doc = await getDocument(documentId);
  if (doc.status === 'error_unreadable' || !doc.extractedData) {
    return {
      documentId: doc.documentId,
      status: 'ERROR',
      error: 'Unreadable or corrupted document data',
      extractionMethod: 'multimodal-vision-ocr-provider'
    };
  }

  return {
    documentId: doc.documentId,
    documentType: doc.documentType,
    status: 'SUCCESS',
    extractedData: doc.extractedData,
    tamperDetected: doc.tamperDetected,
    extractionMethod: 'multimodal-vision-ocr-provider'
  };
}

export async function verifyDocument(documentId) {
  const doc = await getDocument(documentId);
  const isValid = !doc.tamperDetected && Boolean(doc.verificationHash) && doc.status !== 'error_unreadable';
  return {
    documentId: doc.documentId,
    verified: isValid,
    status: isValid ? 'verified' : 'rejected',
    verificationHash: doc.verificationHash,
    evidence: {
      extractedFieldsCount: doc.extractedData ? Object.keys(doc.extractedData).length : 0,
      integrityCheckPassed: isValid
    }
  };
}

export function detectDataConflict({ dbValue, docValue, fieldName = 'annual_income' }) {
  if (dbValue === undefined || docValue === undefined) {
    return { conflict: false, status: 'NO_DATA' };
  }

  const numDb = Number(dbValue);
  const numDoc = Number(docValue);

  if (!isNaN(numDb) && !isNaN(numDoc) && Math.abs(numDb - numDoc) > 100) {
    return {
      conflict: true,
      fieldName,
      dbValue: numDb,
      docValue: numDoc,
      difference: Math.abs(numDb - numDoc),
      status: 'DATA_CONFLICT_ESCALATED',
      recommendation: 'Escalate to Financial Aid Committee for physical document audit and tax return verification.'
    };
  }

  return { conflict: false, status: 'CONSISTENT' };
}

export async function compareDocuments(docId1, docId2) {
  const d1 = await getDocument(docId1);
  const d2 = await getDocument(docId2);
  
  const studentMatch = d1.studentId === d2.studentId;
  return {
    docId1,
    docId2,
    consistent: studentMatch,
    matchSummary: studentMatch 
      ? 'Identity attributes correlate consistently across both documents.'
      : 'Mismatch in student identity correlation.'
  };
}
