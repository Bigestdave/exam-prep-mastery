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
      "Office and Information Management",
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
  { code: "ACC 101", title: "Principles of Accounting" },
];

// Departments that have COS 101 (52 departments across 3 groups)
export const cos101Departments: string[] = [
  // Group A
  "Human Anatomy",
  "Human Physiology",
  "Environmental Health Science",
  "Environmental Management & Toxicology",
  "Health Information Management",
  "Architecture",
  "Surveying & Geoinformatics",
  "Estate Management",
  "Building Technology",
  "Urban & Regional Planning",
  "Quantity Surveying",
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
  // Group B
  "Nursing Science",
  "Physiotherapy",
  "Biochemistry",
  "Biology",
  "Biotechnology",
  "Chemistry",
  "Computer Science",
  "Cyber Security",
  "Forensic Science",
  "Geology",
  "Information Technology",
  "Microbiology",
  "Physics with Electronics",
  "Science Laboratory Technology (SLT)",
  "Software Engineering",
  // Group C
  "Medicine & Surgery (MBBS)",
  "Dentistry (BDS)",
  "Dental Technology",
  "Dental Therapy",
  "Pharmacy (Pharm.D)",
  "Medical Laboratory Science (MLS)",
  "Public Health",
  "Radiography & Radiation Science",
  "Human Nutrition & Dietetics",
];

// Base courses by type (without COS 101 and ACC 101 - added separately)
const scienceBaseCourses = ["BIO 101", "CHM 101", "PHY 101", "MTH 101"];
const partialScienceBaseCourses = ["PHY 101", "MTH 101"];

// Departments that have ACC 101 (business/management focused)
export const acc101Departments: string[] = [
  "Accounting",
  "Business Administration",
  "Banking & Finance",
  "Marketing",
  "Entrepreneurship",
  "Human Resource Management",
  "Economics",
  "Public Administration",
];

// Special cases for Science Education departments
export const scienceEducationCourseMappings: Record<string, string[]> = {
  "Biology Education": ["BIO 101", "CHM 101"],
  "Chemistry Education": ["CHM 101", "PHY 101"],
  "Physics Education": ["PHY 101", "MTH 101"],
  "Mathematics Education": ["MTH 101", "PHY 101"],
};

// Special case: Biomedical Engineering takes BIO 101 (but no COS 101 since Engineering is excluded)
export const biomedicalEngineeringCourses = ["BIO 101", "CHM 101", "PHY 101", "MTH 101"];

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
    const baseCourses = scienceEducationCourseMappings[department];
    // Science Education departments don't have COS 101
    return baseCourses;
  }

  // Special case for Biomedical Engineering (no COS 101)
  if (department === "Biomedical Engineering") {
    return biomedicalEngineeringCourses;
  }

  // Find the faculty for this department
  const faculty = getFacultyForDepartment(department);
  if (!faculty) return [];

  let courses: string[] = [];

  // Assign base courses based on course type
  if (faculty.courseType === "science") {
    courses = [...scienceBaseCourses];
  } else if (faculty.courseType === "partial-science") {
    courses = [...partialScienceBaseCourses];
  }
  // non-science departments get no base science courses

  // Add COS 101 only if department is in the COS 101 list
  if (cos101Departments.includes(department)) {
    courses.push("COS 101");
  }

  // Add ACC 101 only if department is in the ACC 101 list
  if (acc101Departments.includes(department)) {
    courses.push("ACC 101");
  }

  return courses;
}

// Check if a department has any courses available
export function departmentHasCourses(department: string): boolean {
  return getCoursesForDepartment(department).length > 0;
}
