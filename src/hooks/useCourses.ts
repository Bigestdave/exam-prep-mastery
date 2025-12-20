import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  code: string;
  title: string;
  faculty: string;
  level: string;
  price: number;
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('id, code, title, faculty, level, price')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setCourses(data);
    }
    setIsLoading(false);
  };

  const getCourseById = (id: string) => {
    return courses.find(c => c.id === id);
  };

  const getCoursesByFacultyAndLevel = (faculty: string, level: string) => {
    return courses.filter(c => c.faculty === faculty && c.level === level);
  };

  return { courses, isLoading, fetchCourses, getCourseById, getCoursesByFacultyAndLevel };
}
