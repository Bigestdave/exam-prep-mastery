export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          ip_address: string | null
          last_active: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: string | null
          last_active?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          ip_address?: string | null
          last_active?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      course_questions: {
        Row: {
          answer_text: string
          course_id: string
          created_at: string | null
          id: string
          question_index: number
          question_text: string
          quiz_options: Json | null
          structured_content: Json | null
          updated_at: string | null
        }
        Insert: {
          answer_text: string
          course_id: string
          created_at?: string | null
          id?: string
          question_index: number
          question_text: string
          quiz_options?: Json | null
          structured_content?: Json | null
          updated_at?: string | null
        }
        Update: {
          answer_text?: string
          course_id?: string
          created_at?: string | null
          id?: string
          question_index?: number
          question_text?: string
          quiz_options?: Json | null
          structured_content?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_requests: {
        Row: {
          course_code: string
          course_name: string
          course_rep_name: string
          course_rep_phone: string
          created_at: string
          department: string
          extra_notes: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_code: string
          course_name: string
          course_rep_name: string
          course_rep_phone: string
          created_at?: string
          department: string
          extra_notes?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_code?: string
          course_name?: string
          course_rep_name?: string
          course_rep_phone?: string
          created_at?: string
          department?: string
          extra_notes?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_uploads: {
        Row: {
          course_code: string
          course_title: string
          created_at: string
          department: string
          error_message: string | null
          id: string
          level: string
          pdf_url: string
          questions_generated: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_code: string
          course_title: string
          created_at?: string
          department: string
          error_message?: string | null
          id?: string
          level?: string
          pdf_url: string
          questions_generated?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_code?: string
          course_title?: string
          created_at?: string
          department?: string
          error_message?: string | null
          id?: string
          level?: string
          pdf_url?: string
          questions_generated?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          code: string
          created_at: string | null
          faculty: string
          id: string
          level: string
          price: number
          title: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          faculty: string
          id?: string
          level: string
          price?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          faculty?: string
          id?: string
          level?: string
          price?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          faculty: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          level: string | null
        }
        Insert: {
          created_at?: string | null
          faculty?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          level?: string | null
        }
        Update: {
          created_at?: string | null
          faculty?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          level?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          completed_at: string
          course_id: string
          created_at: string
          id: string
          percentage: number | null
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          created_at?: string
          id?: string
          percentage?: number | null
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          created_at?: string
          id?: string
          percentage?: number | null
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string
          id: string
          q1_buy_reason: string
          q2_buy_timing: string
          q3_question_overlap: string
          q4_hesitation: string
          q5_return_intent: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          q1_buy_reason: string
          q2_buy_timing: string
          q3_question_overlap: string
          q4_hesitation: string
          q5_return_intent: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          q1_buy_reason?: string
          q2_buy_timing?: string
          q3_question_overlap?: string
          q4_hesitation?: string
          q5_return_intent?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_course_question_counts: {
        Args: { p_course_ids: string[] }
        Returns: {
          course_id: string
          question_count: number
        }[]
      }
      has_purchased_course: { Args: { course_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
