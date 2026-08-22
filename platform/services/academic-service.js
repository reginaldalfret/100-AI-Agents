// Academic Management & Course Prerequisite Service
const courses = [
  {
    code: 'CS101',
    title: 'Introduction to Computer Science',
    credits: 4,
    prerequisites: [],
    capacity: 60,
    enrolled: 54,
    schedule: 'Mon/Wed 09:00-10:30'
  },
  {
    code: 'CS201',
    title: 'Data Structures and Algorithms',
    credits: 4,
    prerequisites: ['CS101'],
    capacity: 50,
    enrolled: 48,
    schedule: 'Tue/Thu 11:00-12:30'
  },
  {
    code: 'CS301',
    title: 'Operating Systems and Systems Programming',
    credits: 4,
    prerequisites: ['CS201'],
    capacity: 45,
    enrolled: 42,
    schedule: 'Mon/Wed 14:00-15:30'
  },
  {
    code: 'AI401',
    title: 'Advanced Machine Learning & Neural Networks',
    credits: 4,
    prerequisites: ['CS201', 'MATH205'],
    capacity: 35,
    enrolled: 30,
    schedule: 'Tue/Thu 14:00-15:30'
  }
];

const completedCourses = {
  'STU-1001': ['CS101', 'CS201', 'MATH205'],
  'STU-1002': ['CS101', 'CS201', 'MATH205'],
  'STU-1003': ['CS101'],
  'STU-1004': ['CS101', 'CS201', 'CS301', 'AI401', 'MATH205'],
  'STU-1005': []
};

const attendanceLogs = [
  { studentId: 'STU-1001', courseCode: 'CS301', totalClasses: 28, attended: 27, rate: 96.4 },
  { studentId: 'STU-1002', courseCode: 'AI401', totalClasses: 26, attended: 26, rate: 100.0 },
  { studentId: 'STU-1003', courseCode: 'CS201', totalClasses: 28, attended: 18, rate: 64.2 },
  { studentId: 'STU-1004', courseCode: 'AI401', totalClasses: 26, attended: 24, rate: 92.3 }
];

export function getAllCourses() {
  return JSON.parse(JSON.stringify(courses));
}

export function getCourse(code) {
  const c = courses.find(item => item.code.toUpperCase() === code.toUpperCase());
  return c ? JSON.parse(JSON.stringify(c)) : null;
}

export function getStudentCompletedCourses(studentId) {
  return completedCourses[studentId.toUpperCase()] || [];
}

export function checkPrerequisites(studentId, courseCode) {
  const course = getCourse(courseCode);
  if (!course) throw new Error(`Course not found: ${courseCode}`);
  
  const completed = getStudentCompletedCourses(studentId);
  const missing = course.prerequisites.filter(req => !completed.includes(req));
  
  return {
    studentId,
    courseCode,
    eligible: missing.length === 0,
    prerequisites: course.prerequisites,
    missingPrerequisites: missing,
    completedPrerequisites: course.prerequisites.filter(req => completed.includes(req))
  };
}

export function getStudentAttendance(studentId) {
  const logs = attendanceLogs.filter(l => l.studentId.toUpperCase() === studentId.toUpperCase());
  const overallRate = logs.length > 0
    ? Number((logs.reduce((sum, l) => sum + l.rate, 0) / logs.length).toFixed(1))
    : 100.0;
  return {
    studentId,
    percentage: overallRate,
    logs,
    overallRate,
    isAtRisk: overallRate < 75.0
  };
}

export const getAttendance = getStudentAttendance;
export const listCourses = getAllCourses;

