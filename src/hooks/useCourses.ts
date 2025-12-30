import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Course {
  id: string;
  code: string;
  title: string;
  faculty: string;
  level: string;
  price: number;
}

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching courses:", error);
        throw error;
      }
      
      return data as Course[];
    },
  });
};
