// Centralized department taxonomy for the entire application
// Each department is grouped by category for organization

export interface DepartmentCategory {
  name: string;
  departments: string[];
}

export const departmentCategories: DepartmentCategory[] = [
  {
    name: "Medical & Clinical Sciences",
    departments: [
      "Medicine (MBBS)",
      "Nursing",
      "Pharmacy",
      "Dentistry",
      "Dental Surgery",
      "Dental Technology",
      "Dental Therapy",
    ],
  },
  {
    name: "Health Sciences",
    departments: [
      "Radiography",
      "Medical Laboratory Science (MLS)",
      "Physiotherapy",
      "Human Anatomy",
      "Human Physiology",
      "Public Health",
      "Community Health",
      "Human Nutrition & Dietetics",
      "Environmental Health Science (EHS)",
      "Health Information Management (HIM)",
      "Health Information Science",
    ],
  },
  {
    name: "Biological & Natural Sciences",
    departments: [
      "Microbiology",
      "Biochemistry",
      "Biology",
      "Biotechnology",
      "Science Laboratory Technology (SLT)",
      "Forensic Science",
      "Environmental Management & Toxicology (EMT)",
    ],
  },
  {
    name: "Physical & Mathematical Sciences",
    departments: [
      "Chemistry",
      "Physics",
      "Geology",
      "Mathematics",
      "Statistics",
    ],
  },
  {
    name: "Engineering & Technology",
    departments: [
      "Civil Engineering",
      "Mechanical Engineering",
      "Electrical & Electronics Engineering",
      "Computer Engineering",
      "Telecommunications Engineering",
      "Mechatronics Engineering",
      "Information & Communication Engineering",
      "Wood Products Engineering",
      "Biomedical Engineering",
    ],
  },
  {
    name: "Information & Communication Technology",
    departments: [
      "Computer Science",
      "Software Engineering",
      "Cyber Security",
      "Information Technology",
      "Data Science",
    ],
  },
  {
    name: "Environmental Design",
    departments: [
      "Architecture",
      "Surveying & Geoinformatics",
      "Building Technology",
      "Quantity Surveying",
    ],
  },
  {
    name: "Agriculture",
    departments: [
      "Agricultural Science",
      "Fisheries & Aquaculture",
    ],
  },
  {
    name: "Science Education",
    departments: [
      "Biology Education",
      "Chemistry Education",
      "Physics Education",
      "Mathematics Education",
    ],
  },
  {
    name: "Social Sciences & Humanities",
    departments: [
      "Information Resource Management (IRM)",
      "Library & Information Science (LIS)",
      "Mass Communication",
      "Business Administration",
      "Psychology",
      "Public Administration",
    ],
  },
];

// Flat list of all departments for dropdowns
export const allDepartments: string[] = departmentCategories.flatMap(
  (category) => category.departments
);

// Course mapping by department category (which courses each category takes)
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
  { code: "GST 106", title: "Use of English I" },
  { code: "GST 107", title: "Use of English II" },
];

// Mapping of which courses each category takes
export const categoryCourseMappings: Record<string, string[]> = {
  "Medical & Clinical Sciences": ["BIO 101", "CHM 101", "PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Health Sciences": ["BIO 101", "CHM 101", "PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Biological & Natural Sciences": ["BIO 101", "CHM 101", "PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Physical & Mathematical Sciences": ["CHM 101", "PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Engineering & Technology": ["CHM 101", "PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Information & Communication Technology": ["CHM 101", "PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Environmental Design": ["PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Agriculture": ["BIO 101", "CHM 101", "PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Science Education": ["COS 101", "GST 106", "GST 107"], // Base courses, specific subjects added per department
  "Social Sciences & Humanities": ["COS 101", "GST 106", "GST 107"],
};

// Special cases for Science Education departments
export const scienceEducationCourseMappings: Record<string, string[]> = {
  "Biology Education": ["BIO 101", "CHM 101", "COS 101", "GST 106", "GST 107"],
  "Chemistry Education": ["CHM 101", "PHY 101", "COS 101", "GST 106", "GST 107"],
  "Physics Education": ["PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"],
  "Mathematics Education": ["MTH 101", "PHY 101", "COS 101", "GST 106", "GST 107"],
};

// Special case: Biomedical Engineering takes BIO 101
export const biomedicalEngineeringCourses = ["BIO 101", "CHM 101", "PHY 101", "MTH 101", "COS 101", "GST 106", "GST 107"];

// Helper function to get courses for a specific department
export function getCoursesForDepartment(department: string): string[] {
  // Check Science Education special cases
  if (scienceEducationCourseMappings[department]) {
    return scienceEducationCourseMappings[department];
  }
  
  // Special case for Biomedical Engineering
  if (department === "Biomedical Engineering") {
    return biomedicalEngineeringCourses;
  }
  
  // Find the category for this department
  const category = departmentCategories.find((cat) =>
    cat.departments.includes(department)
  );
  
  if (category) {
    return categoryCourseMappings[category.name] || [];
  }
  
  return [];
}
