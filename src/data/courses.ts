export interface Question {
  q: string;
  a: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  faculty: string;
  level: string;
  price: number;
}

// Static courses data is deprecated - use useCourses hook with Supabase instead
export const courses: Course[] = [];

export const faculties = ["IRM", "Engineering", "Sciences", "Arts"];
export const levels = ["100L", "200L", "300L", "400L"];

export function getCourseById(id: string): Course | undefined {
  // This function is deprecated - use useCourses hook instead
  return undefined;
}

export function getCoursesByFacultyAndLevel(faculty: string, level: string): Course[] {
  // This function is deprecated - use useCourses hook instead
  return [];
}
