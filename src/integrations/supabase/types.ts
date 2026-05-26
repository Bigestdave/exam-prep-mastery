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
      ambassador_applications: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          reason: string | null
          reviewed_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      course_questions: {
        Row: {
          answer_text: string
          content: Json | null
          course_id: string
          created_at: string | null
          id: string
          question_index: number
          question_text: string
          quiz_options: Json | null
          status: string
          structured_content: Json | null
          updated_at: string | null
        }
        Insert: {
          answer_text: string
          content?: Json | null
          course_id: string
          created_at?: string | null
          id?: string
          question_index: number
          question_text: string
          quiz_options?: Json | null
          status?: string
          structured_content?: Json | null
          updated_at?: string | null
        }
        Update: {
          answer_text?: string
          content?: Json | null
          course_id?: string
          created_at?: string | null
          id?: string
          question_index?: number
          question_text?: string
          quiz_options?: Json | null
          status?: string
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
          pdf_url: string | null
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
          pdf_url?: string | null
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
          pdf_url?: string | null
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
      department_milestones: {
        Row: {
          achieved_at: string
          ambassador_id: string
          bonus_amount: number
          department: string
          id: string
          semester_id: string
          tier: number
        }
        Insert: {
          achieved_at?: string
          ambassador_id: string
          bonus_amount: number
          department: string
          id?: string
          semester_id: string
          tier: number
        }
        Update: {
          achieved_at?: string
          ambassador_id?: string
          bonus_amount?: number
          department?: string
          id?: string
          semester_id?: string
          tier?: number
        }
        Relationships: [
          {
            foreignKeyName: "department_milestones_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semester_config"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          faculty: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          level: string | null
          referral_code: string | null
          wallet_balance: number
        }
        Insert: {
          created_at?: string | null
          faculty?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          level?: string | null
          referral_code?: string | null
          wallet_balance?: number
        }
        Update: {
          created_at?: string | null
          faculty?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          level?: string | null
          referral_code?: string | null
          wallet_balance?: number
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
      question_quizzes: {
        Row: {
          correct_index: number
          created_at: string
          explanation_text: string | null
          hint_text: string | null
          id: string
          options: Json
          question_id: string
          question_text: string
          quiz_index: number
        }
        Insert: {
          correct_index: number
          created_at?: string
          explanation_text?: string | null
          hint_text?: string | null
          id?: string
          options: Json
          question_id: string
          question_text: string
          quiz_index: number
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation_text?: string | null
          hint_text?: string | null
          id?: string
          options?: Json
          question_id?: string
          question_text?: string
          quiz_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_quizzes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "course_questions"
            referencedColumns: ["id"]
          },
        ]
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
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          credited_amount: number
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          credited_amount?: number
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          credited_amount?: number
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      semester_config: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
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
      withdrawal_requests: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_name: string
          created_at: string
          id: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_note?: string | null
          amount: number
          bank_name: string
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_ambassador_wallet: {
        Args: { ambassador_id: string; credit_amount: number }
        Returns: undefined
      }
      get_course_question_counts: {
        Args: { p_course_ids: string[] }
        Returns: {
          course_id: string
          question_count: number
        }[]
      }
      get_courses_with_quizzes: {
        Args: { p_course_ids: string[] }
        Returns: {
          course_id: string
        }[]
      }
      get_department_leaderboard: {
        Args: { p_since?: string }
        Returns: {
          avg_per_buyer: number
          department: string
          rank: number
          total_unlocks: number
          unique_buyers: number
        }[]
      }
      get_department_stats: {
        Args: { p_since?: string }
        Returns: {
          avg_per_buyer: number
          department: string
          total_unlocks: number
          unique_buyers: number
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
      app_role: "admin" | "user" | "ambassador" | "modifier"
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
      app_role: ["admin", "user", "ambassador", "modifier"],
    },
  },
} as const
