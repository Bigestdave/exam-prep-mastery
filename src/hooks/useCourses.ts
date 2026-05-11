import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Course {
  id: string;
  code: string;
  title: string;
  faculty: string;
  level: string;
  price: number;
}

// Module-level cache so revisits show data instantly (stale-while-revalidate).
let coursesCache: Course[] | null = null;
const SS_KEY = 'lcu_courses_cache_v1';
if (coursesCache === null && typeof sessionStorage !== 'undefined') {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (raw) coursesCache = JSON.parse(raw);
  } catch {}
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(coursesCache ?? []);
  const [isLoading, setIsLoading] = useState(coursesCache === null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    if (coursesCache === null) setIsLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('id, code, title, faculty, level, price')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load courses:', error);
      // Only complain if we have nothing cached to show.
      if (!coursesCache) {
        toast({
          title: "Couldn't load courses",
          description: "Check your connection and try again.",
          variant: "destructive",
        });
      }
    } else {
      const next = data ?? [];
      coursesCache = next;
      try { sessionStorage.setItem(SS_KEY, JSON.stringify(next)); } catch {}
      setCourses(next);
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
