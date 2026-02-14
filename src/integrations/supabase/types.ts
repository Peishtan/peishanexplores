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
      activities: {
        Row: {
          calories: number | null
          created_at: string
          distance: number | null
          duration: number
          elevation_gain: number | null
          id: string
          intensity: Database["public"]["Enums"]["intensity_level"] | null
          notes: string | null
          route: string | null
          start_time: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          distance?: number | null
          duration: number
          elevation_gain?: number | null
          id?: string
          intensity?: Database["public"]["Enums"]["intensity_level"] | null
          notes?: string | null
          route?: string | null
          start_time?: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          distance?: number | null
          duration?: number
          elevation_gain?: number | null
          id?: string
          intensity?: Database["public"]["Enums"]["intensity_level"] | null
          notes?: string | null
          route?: string | null
          start_time?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          result: string
          test_id: Database["public"]["Enums"]["benchmark_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          result: string
          test_id: Database["public"]["Enums"]["benchmark_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          result?: string
          test_id?: Database["public"]["Enums"]["benchmark_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          goal_active_minutes: number | null
          goal_calories: number | null
          goal_elevation_avg: number
          goal_exercises_per_week: number | null
          goal_hiking_quarterly_miles: number
          goal_kayak_per_week: number | null
          goal_kayak_quarterly_miles: number
          goal_outdoor_per_week: number | null
          goal_steps: number | null
          goal_weight: number | null
          goal_workouts_per_week: number | null
          id: string
          onboarding_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          goal_active_minutes?: number | null
          goal_calories?: number | null
          goal_elevation_avg?: number
          goal_exercises_per_week?: number | null
          goal_hiking_quarterly_miles?: number
          goal_kayak_per_week?: number | null
          goal_kayak_quarterly_miles?: number
          goal_outdoor_per_week?: number | null
          goal_steps?: number | null
          goal_weight?: number | null
          goal_workouts_per_week?: number | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          goal_active_minutes?: number | null
          goal_calories?: number | null
          goal_elevation_avg?: number
          goal_exercises_per_week?: number | null
          goal_hiking_quarterly_miles?: number
          goal_kayak_per_week?: number | null
          goal_kayak_quarterly_miles?: number
          goal_outdoor_per_week?: number | null
          goal_steps?: number | null
          goal_weight?: number | null
          goal_workouts_per_week?: number | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skill_milestone_progress: {
        Row: {
          achieved_at: string | null
          evidence_log_ids: Json
          id: string
          milestone_id: string
          progress_current: number
          progress_target: number
          status: Database["public"]["Enums"]["milestone_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          evidence_log_ids?: Json
          id?: string
          milestone_id: string
          progress_current?: number
          progress_target?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          evidence_log_ids?: Json
          id?: string
          milestone_id?: string
          progress_current?: number
          progress_target?: number
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_milestone_progress_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "skill_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_milestones: {
        Row: {
          activity_type:
            | Database["public"]["Enums"]["milestone_activity_type"]
            | null
          created_at: string
          id: string
          is_active: boolean
          milestone_type: Database["public"]["Enums"]["milestone_type"]
          threshold_count: number | null
          threshold_distance_mi: number | null
          threshold_duration_min: number | null
          threshold_elevation_ft: number | null
          title: string
          window_days: number | null
          window_type: Database["public"]["Enums"]["window_type"]
        }
        Insert: {
          activity_type?:
            | Database["public"]["Enums"]["milestone_activity_type"]
            | null
          created_at?: string
          id?: string
          is_active?: boolean
          milestone_type: Database["public"]["Enums"]["milestone_type"]
          threshold_count?: number | null
          threshold_distance_mi?: number | null
          threshold_duration_min?: number | null
          threshold_elevation_ft?: number | null
          title: string
          window_days?: number | null
          window_type?: Database["public"]["Enums"]["window_type"]
        }
        Update: {
          activity_type?:
            | Database["public"]["Enums"]["milestone_activity_type"]
            | null
          created_at?: string
          id?: string
          is_active?: boolean
          milestone_type?: Database["public"]["Enums"]["milestone_type"]
          threshold_count?: number | null
          threshold_distance_mi?: number | null
          threshold_duration_min?: number | null
          threshold_elevation_ft?: number | null
          title?: string
          window_days?: number | null
          window_type?: Database["public"]["Enums"]["window_type"]
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type:
        | "kayaking"
        | "hiking"
        | "xc_skiing"
        | "peloton"
        | "orange_theory"
      benchmark_type:
        | "500m_row"
        | "1000m_row"
        | "pushups_1m"
        | "situps_1m"
        | "plank_time"
      intensity_level: "low" | "moderate" | "high" | "extreme"
      milestone_activity_type: "kayak" | "hike" | "ski" | "gym"
      milestone_status: "locked" | "in_progress" | "achieved"
      milestone_type:
        | "COUNT_ACTIVITIES_OVER_DISTANCE"
        | "COUNT_ACTIVITIES_OVER_ELEVATION"
        | "SINGLE_ACTIVITY_OVER_ELEVATION"
        | "SINGLE_ACTIVITY_OVER_DISTANCE"
        | "STREAK_WEEKLY_MINIMUM"
        | "QUARTERLY_DISTANCE_TARGET"
        | "QUARTERLY_ELEVATION_AVG_TARGET"
      window_type: "all_time" | "quarter" | "rolling_days"
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
      activity_type: [
        "kayaking",
        "hiking",
        "xc_skiing",
        "peloton",
        "orange_theory",
      ],
      benchmark_type: [
        "500m_row",
        "1000m_row",
        "pushups_1m",
        "situps_1m",
        "plank_time",
      ],
      intensity_level: ["low", "moderate", "high", "extreme"],
      milestone_activity_type: ["kayak", "hike", "ski", "gym"],
      milestone_status: ["locked", "in_progress", "achieved"],
      milestone_type: [
        "COUNT_ACTIVITIES_OVER_DISTANCE",
        "COUNT_ACTIVITIES_OVER_ELEVATION",
        "SINGLE_ACTIVITY_OVER_ELEVATION",
        "SINGLE_ACTIVITY_OVER_DISTANCE",
        "STREAK_WEEKLY_MINIMUM",
        "QUARTERLY_DISTANCE_TARGET",
        "QUARTERLY_ELEVATION_AVG_TARGET",
      ],
      window_type: ["all_time", "quarter", "rolling_days"],
    },
  },
} as const
