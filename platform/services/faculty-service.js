// Faculty & Staff HR Operations Service

const facultyMembers = [
  {
    facultyId: 'FAC-501',
    name: 'Dr. Ramesh Sundaram',
    department: 'Computer Science & Engineering',
    role: 'Department Head & Academic Dean',
    email: 'ramesh.sundaram@university.edu',
    workloadHoursPerWeek: 16,
    maxWorkloadHours: 20,
    adviseesCount: 24,
    committeeRoles: ['Academic Standing Committee', 'Curriculum Committee']
  },
  {
    facultyId: 'FAC-502',
    name: 'Dr. Meera Nambiar',
    department: 'Mathematics & Computing',
    role: 'Associate Professor & Scholarship Chair',
    email: 'meera.nambiar@university.edu',
    workloadHoursPerWeek: 14,
    maxWorkloadHours: 20,
    adviseesCount: 18,
    committeeRoles: ['Financial Aid Review Board', 'Graduate Admissions']
  }
];

export async function getFacultyProfile(facultyId) {
  const fac = facultyMembers.find(f => f.facultyId === facultyId || f.name.toLowerCase().includes(String(facultyId).toLowerCase()));
  if (!fac) throw new Error(`Faculty Member ${facultyId} not found`);
  return { ...fac };
}

export async function getWorkload(facultyId) {
  const fac = await getFacultyProfile(facultyId);
  return {
    facultyId: fac.facultyId,
    name: fac.name,
    workloadHoursPerWeek: fac.workloadHoursPerWeek,
    maxWorkloadHours: fac.maxWorkloadHours,
    utilizationPercent: Number(((fac.workloadHoursPerWeek / fac.maxWorkloadHours) * 100).toFixed(1)),
    availableCapacityHours: fac.maxWorkloadHours - fac.workloadHoursPerWeek
  };
}

export async function listFaculty() {
  return [...facultyMembers];
}
