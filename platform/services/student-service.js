// Student Data & Document Management Service
const students = [
  {
    id: 'STU-1001',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@university.edu',
    program: 'B.S. Computer Science',
    semester: 4,
    status: 'enrolled',
    admissionStatus: 'admitted',
    gpa: 3.85,
    attendanceRate: 94.5,
    householdIncome: 45000,
    documents: [
      { type: 'high_school_transcript', status: 'verified', uploadedAt: '2025-08-10' },
      { type: 'id_proof', status: 'verified', uploadedAt: '2025-08-10' },
      { type: 'financial_statement', status: 'verified', uploadedAt: '2026-01-15' }
    ]
  },
  {
    id: 'STU-1002',
    name: 'Priya Patel',
    email: 'priya.patel@university.edu',
    program: 'B.S. Artificial Intelligence',
    semester: 3,
    status: 'enrolled',
    admissionStatus: 'admitted',
    gpa: 3.92,
    attendanceRate: 98.0,
    householdIncome: 28000,
    documents: [
      { type: 'high_school_transcript', status: 'verified', uploadedAt: '2025-08-11' },
      { type: 'id_proof', status: 'verified', uploadedAt: '2025-08-11' },
      { type: 'income_certificate', status: 'verified', uploadedAt: '2026-01-20' }
    ]
  },
  {
    id: 'STU-1003',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@university.edu',
    program: 'B.S. Data Science',
    semester: 5,
    status: 'at_risk',
    admissionStatus: 'admitted',
    gpa: 2.30,
    attendanceRate: 64.0,
    householdIncome: 75000,
    documents: [
      { type: 'high_school_transcript', status: 'verified', uploadedAt: '2024-08-15' },
      { type: 'id_proof', status: 'verified', uploadedAt: '2024-08-15' }
    ]
  },
  {
    id: 'STU-1004',
    name: 'Ananya Rao',
    email: 'ananya.rao@university.edu',
    program: 'M.S. Software Engineering',
    semester: 4,
    status: 'graduating',
    admissionStatus: 'admitted',
    gpa: 3.78,
    attendanceRate: 92.0,
    householdIncome: 60000,
    documents: [
      { type: 'bachelors_transcript', status: 'verified', uploadedAt: '2025-01-10' },
      { type: 'id_proof', status: 'verified', uploadedAt: '2025-01-10' },
      { type: 'thesis_clearance', status: 'verified', uploadedAt: '2026-07-20' }
    ]
  },
  {
    id: 'STU-1005',
    name: 'Vikram Sengupta',
    email: 'vikram.sengupta@university.edu',
    program: 'B.S. Computer Science',
    semester: 1,
    status: 'applicant',
    admissionStatus: 'pending_verification',
    gpa: 3.60,
    attendanceRate: 100.0,
    householdIncome: 52000,
    documents: [
      { type: 'high_school_transcript', status: 'submitted', uploadedAt: '2026-08-01' },
      { type: 'id_proof', status: 'submitted', uploadedAt: '2026-08-01' },
      { type: 'recommendation_letter', status: 'submitted', uploadedAt: '2026-08-02' }
    ]
  }
];

export function getAllStudents() {
  return JSON.parse(JSON.stringify(students));
}

export function getStudentById(id) {
  const s = students.find(item => item.id.toLowerCase() === id.toLowerCase());
  return s ? JSON.parse(JSON.stringify(s)) : null;
}

export const getStudent = getStudentById;

export function updateStudent(id, fields) {
  const index = students.findIndex(item => item.id.toLowerCase() === id.toLowerCase());
  if (index === -1) throw new Error(`Student not found: ${id}`);
  students[index] = { ...students[index], ...fields };
  return JSON.parse(JSON.stringify(students[index]));
}

export function updateDocumentStatus(studentId, docType, status, comments = '') {
  const s = students.find(item => item.id.toLowerCase() === studentId.toLowerCase());
  if (!s) throw new Error(`Student not found: ${studentId}`);
  const doc = s.documents.find(d => d.type === docType);
  if (!doc) throw new Error(`Document ${docType} not found for student ${studentId}`);
  doc.status = status;
  doc.verifiedAt = new Date().toISOString();
  doc.comments = comments;
  return JSON.parse(JSON.stringify(doc));
}
