export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      body_log: {
        Row: {
          arm_cm: number | null
          chest_cm: number | null
          created_at: string
          estimated_bf_pct: number | null
          family_id: string
          hip_cm: number | null
          id: string
          logged_at: string
          member_name: string
          neck_cm: number | null
          notes: string | null
          thigh_cm: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arm_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          estimated_bf_pct?: number | null
          family_id: string
          hip_cm?: number | null
          id?: string
          logged_at?: string
          member_name: string
          neck_cm?: number | null
          notes?: string | null
          thigh_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arm_cm?: number | null
          chest_cm?: number | null
          created_at?: string
          estimated_bf_pct?: number | null
          family_id?: string
          hip_cm?: number | null
          id?: string
          logged_at?: string
          member_name?: string
          neck_cm?: number | null
          notes?: string | null
          thigh_cm?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: [{ foreignKeyName: "body_log_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      families: {
        Row: { created_at: string; id: string; name: string }
        Insert: { created_at?: string; id?: string; name: string }
        Update: { created_at?: string; id?: string; name?: string }
        Relationships: []
      }
      family_invitations: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          family_id: string
          id: string
          token: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          family_id: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          family_id?: string
          id?: string
          token?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [{ foreignKeyName: "family_invitations_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      family_members: {
        Row: {
          color: string
          created_at: string
          family_id: string
          id: string
          name: string
          role: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          family_id: string
          id?: string
          name: string
          role?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          family_id?: string
          id?: string
          name?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [{ foreignKeyName: "family_members_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      meal_plan: {
        Row: { created_at: string | null; day: string; description: string; family_id: string; id: string; meal_type: string }
        Insert: { created_at?: string | null; day: string; description: string; family_id: string; id?: string; meal_type: string }
        Update: { created_at?: string | null; day?: string; description?: string; family_id?: string; id?: string; meal_type?: string }
        Relationships: [{ foreignKeyName: "meal_plan_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      pantry: {
        Row: { added_date: string | null; created_at: string | null; expires_date: string | null; family_id: string; id: string; is_leftover: boolean | null; item: string }
        Insert: { added_date?: string | null; created_at?: string | null; expires_date?: string | null; family_id: string; id?: string; is_leftover?: boolean | null; item: string }
        Update: { added_date?: string | null; created_at?: string | null; expires_date?: string | null; family_id?: string; id?: string; is_leftover?: boolean | null; item?: string }
        Relationships: [{ foreignKeyName: "pantry_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      person_preferences: {
        Row: {
          created_at: string
          date_of_birth: string | null
          enable_body_tracking: boolean
          enable_nutrition_ai: boolean
          enable_training: boolean
          experience_level: string | null
          family_id: string
          family_member_id: string
          gender: string | null
          height_cm: number | null
          id: string
          meal_goal: string | null
          meal_goals: string[]
          onboarding_completed: boolean
          preferred_training_days: number[]
          preferred_training_time: string | null
          training_goal: string | null
          training_goals: string[]
          updated_at: string
          wake_time: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          enable_body_tracking?: boolean
          enable_nutrition_ai?: boolean
          enable_training?: boolean
          experience_level?: string | null
          family_id: string
          family_member_id: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          meal_goal?: string | null
          meal_goals?: string[]
          onboarding_completed?: boolean
          preferred_training_days?: number[]
          preferred_training_time?: string | null
          training_goal?: string | null
          training_goals?: string[]
          updated_at?: string
          wake_time?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          enable_body_tracking?: boolean
          enable_nutrition_ai?: boolean
          enable_training?: boolean
          experience_level?: string | null
          family_id?: string
          family_member_id?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          meal_goal?: string | null
          meal_goals?: string[]
          onboarding_completed?: boolean
          preferred_training_days?: number[]
          preferred_training_time?: string | null
          training_goal?: string | null
          training_goals?: string[]
          updated_at?: string
          wake_time?: string | null
        }
        Relationships: [
          { foreignKeyName: "person_preferences_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] },
          { foreignKeyName: "person_preferences_family_member_id_fkey"; columns: ["family_member_id"]; isOneToOne: true; referencedRelation: "family_members"; referencedColumns: ["id"] },
        ]
      }
      progress_photos: {
        Row: { ai_analysis: string | null; created_at: string; family_id: string; id: string; label: string | null; member_name: string; notes: string | null; storage_path: string; taken_at: string }
        Insert: { ai_analysis?: string | null; created_at?: string; family_id: string; id?: string; label?: string | null; member_name: string; notes?: string | null; storage_path: string; taken_at?: string }
        Update: { ai_analysis?: string | null; created_at?: string; family_id?: string; id?: string; label?: string | null; member_name?: string; notes?: string | null; storage_path?: string; taken_at?: string }
        Relationships: [{ foreignKeyName: "progress_photos_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      schedule_events: {
        Row: { created_at: string | null; day: string; family_id: string; id: string; person: string; tag: string | null; time_end: string | null; time_start: string | null; title: string }
        Insert: { created_at?: string | null; day: string; family_id: string; id?: string; person: string; tag?: string | null; time_end?: string | null; time_start?: string | null; title: string }
        Update: { created_at?: string | null; day?: string; family_id?: string; id?: string; person?: string; tag?: string | null; time_end?: string | null; time_start?: string | null; title?: string }
        Relationships: [{ foreignKeyName: "schedule_events_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      training_plans: {
        Row: { created_at: string; end_date: string; family_id: string; goal_snapshot: string | null; id: string; person: string; start_date: string }
        Insert: { created_at?: string; end_date: string; family_id: string; goal_snapshot?: string | null; id?: string; person: string; start_date: string }
        Update: { created_at?: string; end_date?: string; family_id?: string; goal_snapshot?: string | null; id?: string; person?: string; start_date?: string }
        Relationships: [{ foreignKeyName: "training_plans_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] }]
      }
      training_sessions: {
        Row: { completed: boolean; created_at: string; exercises: Json; family_id: string; id: string; notes: string | null; person: string; plan_id: string; scheduled_date: string; workout_type: string }
        Insert: { completed?: boolean; created_at?: string; exercises?: Json; family_id: string; id?: string; notes?: string | null; person: string; plan_id: string; scheduled_date: string; workout_type: string }
        Update: { completed?: boolean; created_at?: string; exercises?: Json; family_id?: string; id?: string; notes?: string | null; person?: string; plan_id?: string; scheduled_date?: string; workout_type?: string }
        Relationships: [
          { foreignKeyName: "training_sessions_family_id_fkey"; columns: ["family_id"]; isOneToOne: false; referencedRelation: "families"; referencedColumns: ["id"] },
          { foreignKeyName: "training_sessions_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "training_plans"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { my_family_id: { Args: never; Returns: string } }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"]

// Named type aliases used throughout the app
export type Family            = Tables<"families">
export type FamilyMember      = Tables<"family_members">
export type FamilyInvitation  = Tables<"family_invitations">
export type PersonPreferences = Tables<"person_preferences">
export type ScheduleEvent     = Tables<"schedule_events">
export type MealPlan          = Tables<"meal_plan">
export type Pantry            = Tables<"pantry">
export type TrainingPlan      = Tables<"training_plans">
export type TrainingSession   = Tables<"training_sessions">
export type BodyLog           = Tables<"body_log">
export type ProgressPhoto     = Tables<"progress_photos">

// Exercise is a nested type inside training_sessions.exercises (JSON)
export interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds?: number
  notes?: string
}

// gender narrowed type for BodyTab compatibility
export type Gender = 'male' | 'female' | 'other'
