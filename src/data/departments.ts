// Centralized department taxonomy for the entire application
// Each faculty is grouped with its departments

export interface FacultyCategory {
  name: string;
  departments: string[];
  courseType: "science" | "partial-science" | "non-science";
}

export const facultyCategories: FacultyCategory[] = [
  {
    name: "Faculty of Basic Medical & Health Sciences",
    courseType: "science",
    departments: [
      "Nursing Science",
      "Medical Laboratory Science (MLS)",
      "Radiography & Radiation Science",
      "Physiotherapy",
      "Human Anatomy",
      "Human Physiology",
      "Public Health",
      "Community Health",
      "Human Nutrition & Dietetics",
      "Environmental Health Science",
      "Health Information Management",
      "Health Information Science",
      "Medical Social Work",
    ],
  },
  {
    name: "College of Medicine & Dental Sciences",
    courseType: "science",
    departments: [
      "Medicine & Surgery (MBBS)",
      "Dentistry (BDS)",
      "Dental Technology",
      "Dental Therapy",
    ],
  },
  {
    name: "Faculty of Pharmacy",
    courseType: "science",
    departments: ["Pharmacy (Pharm.D)"],
  },
  {
    name: "Faculty of Natural & Applied Sciences",
    courseType: "science",
    departments: [
      "Microbiology",
      "Biochemistry",
      "Science Laboratory Technology (SLT)",
      "Forensic Science",
      "Biotechnology",
      "Biology",
      "Chemistry",
      "Physics with Electronics",
      "Geology",
      "Environmental Management & Toxicology",
      "Mathematics",
      "Statistics",
    ],
  },
  {
    name: "Faculty of Engineering & Technology",
    courseType: "science",
    departments: [
      "Civil Engineering",
      "Mechanical Engineering",
      "Electrical & Electronics Engineering",
      "Computer Engineering",
      "Telecommunications Engineering",
      "Mechatronics Engineering",
      "Biomedical Engineering",
      "Information & Communication Engineering",
      "Wood Products Engineering",
    ],
  },
  {
    name: "Faculty of Information & Communication Technology",
    courseType: "partial-science",
    departments: [
      "Computer Science",
      "Software Engineering",
      "Cyber Security",
      "Data Science",
      "Information Technology",
    ],
  },
  {
    name: "Faculty of Communication & Information Sciences",
    courseType: "non-science",
    departments: [
      "Mass Communication & Media Studies",
      "Information Resources Management (IRM)",
      "Library & Information Science",
    ],
  },
  {
    name: "Faculty of Social & Management Sciences",
    courseType: "non-science",
    departments: [
      "Accounting",
      "Business Administration",
      "Economics",
      "International Relations",
      "Political Science",
      "Public Administration",
      "Sociology",
      "Psychology",
      "Criminology & Security Studies",
      "Banking & Finance",
      "Marketing",
      "Entrepreneurship",
      "Human Resource Management",
      "Social Work",
    ],
  },
  {
    name: "Faculty of Environmental Design & Management",
    courseType: "partial-science",
    departments: [
      "Architecture",
      "Estate Management",
      "Surveying & Geoinformatics",
      "Building Technology",
      "Urban & Regional Planning",
      "Quantity Surveying",
    ],
  },
  {
    name: "Faculty of Law",
    courseType: "non-science",
    departments: ["LL.B Law"],
  },
  {
    name: "Faculty of Arts & Humanities",
    courseType: "non-science",
    departments: [
      "English & Literary Studies",
      "History & International Studies",
      "Creative Arts",
      "Philosophy",
      "Religious Studies",
    ],
  },
  {
    name: "Faculty of Education",
    courseType: "non-science",
    departments: [
      "Educational Management",
      "Guidance & Counselling",
      "Business Education",
      "Social Studies Education",
      "Computer Science Education",
      "Physical & Health Education",
      "Biology Education",
      "Chemistry Education",
      "Physics Education",
      "Mathematics Education",
    ],
  },
  {
    name: "Faculty of Agriculture",
    courseType: "science",
    departments: ["Agricultural Science", "Fisheries & Aquaculture"],
  },
];

// Flat list of all departments for dropdowns
export const allDepartments: string[] = facultyCategories.flatMap(
  (faculty) => faculty.departments
);

// Course mapping by course type
export interface CourseMapping {
  code: string;
  title: string;
}

export const baseCourses: CourseMapping[] = [
  { code: "BIO 101", title: "General Biology I" },
  { code: "CHM 101", title: "General Chemistry I" },
  { code: "PHY 101", title: "General Physics I" },
  { code: "MTH 101", title: "General Mathematics I" },
  { code: "COS 101", title: "Introduction to Computer Science" },
];

// Science folder: BIO, CHM, PHY, MTH, COS
const scienceCourses = ["BIO 101", "CHM 101", "PHY 101", "MTH 101", "COS 101"];

// Partial science: PHY, MTH, COS (no BIO, CHM)
const partialScienceCourses = ["PHY 101", "MTH 101", "COS 101"];

// Non-science: No courses available (empty array)
const nonScienceCourses: string[] = [];

// Course type mappings
export const courseTypeMappings: Record<string, string[]> = {
  science: scienceCourses,
  "partial-science": partialScienceCourses,
  "non-science": nonScienceCourses,
};

// Special cases for Science Education departments (they use science folder)
export const scienceEducationCourseMappings: Record<string, string[]> = {
  "Biology Education": ["BIO 101", "CHM 101", "COS 101"],
  "Chemistry Education": ["CHM 101", "PHY 101", "COS 101"],
  "Physics Education": ["PHY 101", "MTH 101", "COS 101"],
  "Mathematics Education": ["MTH 101", "PHY 101", "COS 101"],
};

// Special case: Biomedical Engineering takes BIO 101
export const biomedicalEngineeringCourses = ["BIO 101", "CHM 101", "PHY 101", "MTH 101", "COS 101"];

// Helper function to get the faculty for a department
export function getFacultyForDepartment(department: string): FacultyCategory | undefined {
  return facultyCategories.find((faculty) =>
    faculty.departments.includes(department)
  );
}

// Helper function to get courses for a specific department
export function getCoursesForDepartment(department: string): string[] {
  // Check Science Education special cases first
  if (scienceEducationCourseMappings[department]) {
    return scienceEducationCourseMappings[department];
  }

  // Special case for Biomedical Engineering
  if (department === "Biomedical Engineering") {
    return biomedicalEngineeringCourses;
  }

  // Find the faculty for this department
  const faculty = getFacultyForDepartment(department);

  if (faculty) {
    return courseTypeMappings[faculty.courseType] || [];
  }

  return [];
}

// Check if a department has any courses available
export function departmentHasCourses(department: string): boolean {
  return getCoursesForDepartment(department).length > 0;
}
