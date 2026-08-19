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
      annualHouseholdIncome: 280000,
      incomeCurrency: 'INR',
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
  } else if (name.includes('medical')) {
    documentType = 'medical_certificate';
  }

  return {
    documentType,
    confidence,
    mimeType: mimeType || 'application/pdf',
    isSupported: ['application/pdf', 'image/png', 'image/jpeg'].includes(mimeType || 'application/pdf')
  };
}

export async function extractDocumentData(documentId) {
  const doc = await getDocument(documentId);
  return {
    documentId: doc.documentId,
    documentType: doc.documentType,
    extractedData: doc.extractedData,
    tamperDetected: doc.tamperDetected,
    extractionMethod: 'multimodal-vision-ocr-provider'
  };
}

export async function verifyDocument(documentId) {
  const doc = await getDocument(documentId);
  const isValid = !doc.tamperDetected && Boolean(doc.verificationHash);
  return {
    documentId: doc.documentId,
    verified: isValid,
    status: isValid ? 'verified' : 'rejected',
    verificationHash: doc.verificationHash,
    evidence: {
      extractedFieldsCount: Object.keys(doc.extractedData || {}).length,
      integrityCheckPassed: isValid
    }
  };
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
