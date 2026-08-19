// Finance, Billing & Scholarship Service
const studentAccounts = [
  {
    studentId: 'STU-1001',
    tuitionFee: 12000,
    paidAmount: 12000,
    outstandingBalance: 0,
    activeScholarships: [],
    financialAidEligible: true
  },
  {
    studentId: 'STU-1002',
    tuitionFee: 12000,
    paidAmount: 4000,
    outstandingBalance: 8000,
    activeScholarships: [],
    financialAidEligible: true
  },
  {
    studentId: 'STU-1003',
    tuitionFee: 12000,
    paidAmount: 6000,
    outstandingBalance: 6000,
    activeScholarships: [],
    financialAidEligible: false
  },
  {
    studentId: 'STU-1004',
    tuitionFee: 15000,
    paidAmount: 15000,
    outstandingBalance: 0,
    activeScholarships: ['Graduate Research Grant'],
    financialAidEligible: false
  },
  {
    studentId: 'STU-1005',
    tuitionFee: 12000,
    paidAmount: 0,
    outstandingBalance: 12000,
    activeScholarships: [],
    financialAidEligible: true
  }
];

const scholarshipSchemes = [
  {
    id: 'SCH-MERIT',
    name: 'Presidential Merit Scholarship',
    minGpa: 3.80,
    minAttendance: 90.0,
    maxIncome: Infinity,
    awardAmount: 6000,
    description: 'High-academic achievement award'
  },
  {
    id: 'SCH-NEED',
    name: 'Institutional Need-Based Grant',
    minGpa: 3.00,
    minAttendance: 85.0,
    maxIncome: 35000,
    awardAmount: 8000,
    description: 'Financial aid for students from low/middle income households'
  },
  {
    id: 'SCH-STEM',
    name: 'Future AI & Technology Fellowship',
    minGpa: 3.75,
    minAttendance: 95.0,
    maxIncome: 60000,
    awardAmount: 5000,
    description: 'Special award for top students in Computer Science / AI'
  }
];

export function getAllScholarshipSchemes() {
  return JSON.parse(JSON.stringify(scholarshipSchemes));
}

export function getStudentFinancials(studentId) {
  const acc = studentAccounts.find(item => item.studentId.toUpperCase() === studentId.toUpperCase());
  return acc ? JSON.parse(JSON.stringify(acc)) : null;
}

export function evaluateScholarship(student, schemeId) {
  const scheme = scholarshipSchemes.find(s => s.id === schemeId || s.name.toLowerCase() === schemeId.toLowerCase());
  if (!scheme) throw new Error(`Scholarship scheme not found: ${schemeId}`);

  const gpaMatch = student.gpa >= scheme.minGpa;
  const attendanceMatch = student.attendanceRate >= scheme.minAttendance;
  const incomeMatch = student.householdIncome <= scheme.maxIncome;

  const eligible = gpaMatch && attendanceMatch && incomeMatch;
  const reasons = [];
  if (!gpaMatch) reasons.push(`GPA ${student.gpa} is below required ${scheme.minGpa}`);
  if (!attendanceMatch) reasons.push(`Attendance ${student.attendanceRate}% is below required ${scheme.minAttendance}%`);
  if (!incomeMatch) reasons.push(`Household income $${student.householdIncome} exceeds max $${scheme.maxIncome}`);

  return {
    studentId: student.id,
    studentName: student.name,
    schemeId: scheme.id,
    schemeName: scheme.name,
    awardAmount: scheme.awardAmount,
    eligible,
    checks: {
      gpa: { actual: student.gpa, required: scheme.minGpa, pass: gpaMatch },
      attendance: { actual: student.attendanceRate, required: scheme.minAttendance, pass: attendanceMatch },
      income: { actual: student.householdIncome, required: scheme.maxIncome, pass: incomeMatch }
    },
    reasons: reasons.length > 0 ? reasons : ['All academic and financial criteria met successfully.']
  };
}

export function getScholarship(schemeId) {
  const scheme = scholarshipSchemes.find(s => s.id === schemeId || s.name.toLowerCase() === schemeId.toLowerCase());
  if (!scheme) throw new Error(`Scholarship scheme not found: ${schemeId}`);
  return JSON.parse(JSON.stringify(scheme));
}

export function evaluateScholarshipEligibility(studentIdOrStudent, schemeId = 'SCH-MERIT') {
  const student = typeof studentIdOrStudent === 'object'
    ? studentIdOrStudent
    : (function() {
        const studentAccounts = [{ id: 'STU-1001', name: 'Aarav Sharma', gpa: 3.85, attendanceRate: 94.5, householdIncome: 45000 },
          { id: 'STU-1002', name: 'Priya Patel', gpa: 3.92, attendanceRate: 98.0, householdIncome: 28000 },
          { id: 'STU-1003', name: 'Rohan Mehta', gpa: 2.30, attendanceRate: 64.0, householdIncome: 75000 },
          { id: 'STU-1004', name: 'Ananya Rao', gpa: 3.78, attendanceRate: 92.0, householdIncome: 60000 },
          { id: 'STU-1005', name: 'Vikram Sengupta', gpa: 3.60, attendanceRate: 100.0, householdIncome: 52000 }];
        const found = studentAccounts.find(s => s.id.toUpperCase() === String(studentIdOrStudent).toUpperCase());
        return found || { id: studentIdOrStudent, name: 'Student', gpa: 3.8, attendanceRate: 95.0, householdIncome: 40000 };
      })();

  const res = evaluateScholarship(student, schemeId);
  return {
    ...res,
    scholarshipId: res.schemeId,
    scholarshipName: res.schemeName
  };
}

export function applyScholarshipAward(studentId, amount, schemeName = 'Scholarship Award') {
  const acc = studentAccounts.find(item => item.studentId.toUpperCase() === String(studentId).toUpperCase());
  if (!acc) throw new Error(`Student account not found: ${studentId}`);
  
  acc.activeScholarships.push(schemeName);
  acc.paidAmount += amount;
  acc.outstandingBalance = Math.max(0, acc.outstandingBalance - amount);
  return JSON.parse(JSON.stringify(acc));
}

export const getStudentFeeStatus = getStudentFinancials;

